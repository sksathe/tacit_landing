import { z } from 'zod';
import { supabase } from '../services/supabase.js';
import { normalizeMeetingCode } from '../services/meeting-code.js';
import { fuzzyMatchInvitee } from '../services/name-matching.js';
import { withIdempotency } from '../services/idempotency.js';
import { VerifyUserAndStartSessionSchema, VerifyUserAndStartSessionResponse } from '../types/index.js';

/**
 * Verify user by name and meeting code, then create call session
 * This is the correct flow: verify first, then start session
 */
export async function verifyUserAndStartSession(
  input: z.infer<typeof VerifyUserAndStartSessionSchema>
): Promise<VerifyUserAndStartSessionResponse> {
  const { meeting_code, spoken_name, caller_phone, elevenlabs_conversation_id, now_iso, idempotency_key } = input;

  // Use idempotency key based on conversation_id or meeting_code+name
  const idempotencyScope = `verify_and_start:${elevenlabs_conversation_id || `${meeting_code}:${spoken_name}`}`;
  const idempotencyKey = idempotency_key || `${Date.now()}-${Math.random()}`;

  return withIdempotency(idempotencyScope, idempotencyKey, async () => {

    const meetingCodeNorm = normalizeMeetingCode(meeting_code);
    const now = now_iso ? new Date(now_iso) : new Date();

    // Step 1: Find meeting by code only (no time filter) so we can tell "invalid code" vs "too early/late"
    const { data: meetingByCode, error: meetingByCodeError } = await supabase
      .from('meetings')
      .select('id, org_id, project_id, scheduled_start_at, scheduled_end_at, title, agenda, project:projects(name)')
      .eq('meeting_code_norm', meetingCodeNorm)
      .maybeSingle();

    if (meetingByCodeError || !meetingByCode) {
      const invalidCodeMessage = `We couldn't find a meeting for that code. Please check the code and try again.`;
      return {
        verified: false,
        success: false,
        status: 'verification_failed',
        attempts_left: 1,
        message_for_user: invalidCodeMessage,
        say_to_user: invalidCodeMessage,
        call_session_id: null,
        meeting_context: null,
        agent_instruction: `Say this to the user: "${invalidCodeMessage}"`,
      };
    }

    const meeting = meetingByCode;
    const project = meeting.project as any;

    const scheduledStart = new Date(meeting.scheduled_start_at);
    const scheduledEnd = new Date(meeting.scheduled_end_at);
    const allowedStart = new Date(scheduledStart.getTime() - 30 * 60 * 1000); // 30 min before start
    const allowedEnd = new Date(scheduledEnd.getTime() + 60 * 60 * 1000);   // 60 min after end

    const scheduledTimeHuman = scheduledStart.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    const isTooEarly = now < allowedStart;
    const isTooLate = now > allowedEnd;

    // Step 2: Verify name (we need it for "code and name match but not on time" message)
    const match = await fuzzyMatchInvitee(
      meeting.id,
      spoken_name,
      caller_phone || undefined
    );

    const nameMatches = match && match.similarity >= 0.5;

    if (isTooEarly) {
      const message = nameMatches
        ? `Your code and name are correct, but you're calling too early. Your session is scheduled for ${scheduledTimeHuman}. Please call back 30 minutes before the start time.`
        : `You're calling too early. Your session is scheduled for ${scheduledTimeHuman}. Please call back 30 minutes before the start time.`;
      return {
        verified: false,
        success: false,
        status: 'too_early',
        attempts_left: 0,
        message_for_user: message,
        say_to_user: message,
        call_session_id: null,
        meeting_context: null,
        scheduled_time_human: scheduledTimeHuman,
        agent_instruction: `Say this to the user: "${message}"`,
      };
    }

    if (isTooLate) {
      const message = nameMatches
        ? `Your code and name are correct, but you're calling too late. The call window for this session has ended. Your session was scheduled for ${scheduledTimeHuman}.`
        : `You're calling too late. The call window for this session has ended. Your session was scheduled for ${scheduledTimeHuman}.`;
      return {
        verified: false,
        success: false,
        status: 'too_late',
        attempts_left: 0,
        message_for_user: message,
        say_to_user: message,
        call_session_id: null,
        meeting_context: null,
        scheduled_time_human: scheduledTimeHuman,
        agent_instruction: `Say this to the user: "${message}"`,
      };
    }

    // In allowed window — name must match to proceed
    if (!nameMatches) {
      const failureMessage = `I'm sorry, that name doesn't match our records. Please say your full name again.`;
      return {
        verified: false,
        success: false,
        status: 'verification_failed',
        attempts_left: 1,
        message_for_user: failureMessage,
        say_to_user: failureMessage,
        call_session_id: null,
        meeting_context: null,
        agent_instruction: `VERIFICATION FAILED. Say this to the user: "${failureMessage}" Then wait for them to provide their name again and call verify_user_and_start_session again.`,
      };
    }

    // Step 4: Verification successful - get invitee details
    const { data: invitee } = await supabase
      .from('meeting_invitees')
      .select('id, name, email')
      .eq('id', match.invitee_id)
      .single();

    if (!invitee) {
      throw new Error(`Invitee not found: ${match.invitee_id}`);
    }

    // Step 5: Check if call session already exists for this conversation_id
    let callSession;
    if (elevenlabs_conversation_id) {
      const { data: existingSession, error: existingError } = await supabase
        .from('call_sessions')
        .select('id, org_id, project_id, meeting_id, status')
        .eq('elevenlabs_conversation_id', elevenlabs_conversation_id)
        .single();

      if (!existingError && existingSession) {
        callSession = existingSession;
        
        // Update existing session with verified invitee
        await supabase
          .from('call_sessions')
          .update({
            verification_status: 'verified',
            verified_invitee_id: invitee.id,
            verification_attempts: 1,
          })
          .eq('id', callSession.id);
      }
    }

    // Step 6: Create new call session if it doesn't exist
    if (!callSession) {
      const { data: newSession, error: sessionError } = await supabase
        .from('call_sessions')
        .insert({
          org_id: meeting.org_id,
          project_id: meeting.project_id,
          meeting_id: meeting.id,
          caller_phone: caller_phone || null,
          elevenlabs_conversation_id: elevenlabs_conversation_id || null,
          verification_status: 'verified',
          verified_invitee_id: invitee.id,
          verification_attempts: 1,
          status: 'in_progress',
          started_at: now.toISOString(),
        })
        .select('id, org_id, project_id, meeting_id, status')
        .single();

      if (sessionError || !newSession) {
        throw new Error(`Failed to create call session: ${sessionError?.message}`);
      }

      callSession = newSession;
    }

    // Short, clear welcome message (don't include full agenda in spoken message)
    const welcomeMessage = `Welcome ${invitee.name}! Verification successful. I'm here to help capture your knowledge about ${meeting.title || 'this meeting'}. Let's get started.`;

    // Include agenda + agent hints in this response so the agent does NOT need to call get_meeting_context
    const hasAgenda = meeting?.agenda && String(meeting.agenda).trim().length > 0;
    const agentHints: string[] = [];
    if (hasAgenda) {
      agentHints.push('Stick to the agenda: cover the topics listed in the agenda; do not go off-topic.');
      agentHints.push(`Agenda to follow: ${meeting!.agenda}`);
      agentHints.push('Introduce and discuss each agenda item; keep the conversation focused on these points.');
    } else {
      agentHints.push(
        'No agenda was provided for this call. Say to the user: "No agenda was given for the call. What would you like to discuss?" Then let the user set the topics and follow their lead.'
      );
      agentHints.push('Be conversational and help extract tacit knowledge on whatever topics the user wants to cover.');
    }
    if (meeting?.title) {
      agentHints.push(`Meeting title: ${meeting.title}. Use this to frame the conversation.`);
    }
    if (project?.name) {
      agentHints.push(`Project context: ${project.name}`);
    }
    if (hasAgenda) {
      agentHints.push('Be conversational and help extract tacit knowledge.');
    }
    agentHints.push(hasAgenda
      ? 'Ask follow-up questions to clarify details while staying on agenda topics.'
      : 'Ask follow-up questions to clarify details.');

    const noAgendaOpening = hasAgenda ? null : 'No agenda was given for the call. What would you like to discuss?';

    return {
      // Explicit success indicators at the top
      verified: true,
      success: true,
      status: 'verified',
      attempts_left: 0,
      // Clear, short message for the agent to speak
      message_for_user: welcomeMessage,
      say_to_user: welcomeMessage,
      call_session_id: callSession.id,
      meeting_context: {
        title: meeting.title || '',
        agenda: hasAgenda ? meeting.agenda : null,
        invitee_name: invitee.name,
        project_name: project?.name || '',
      },
      agent_hints: agentHints,
      no_agenda_opening: noAgendaOpening,
      agent_instruction: `VERIFICATION SUCCESSFUL. Say this to the user: "${welcomeMessage}" You already have the agenda and hints below—do NOT call get_meeting_context. Start the meeting now; respond immediately and keep pauses short.`,
    };
  });
}
