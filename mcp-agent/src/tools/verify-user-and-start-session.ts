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

    // Normalize meeting code
    const meetingCodeNorm = normalizeMeetingCode(meeting_code);
    const now = now_iso ? new Date(now_iso) : new Date();

    // Step 1: Find meeting within time window (start-30m to end+60m)
    const timeWindowStart = new Date(now.getTime() - 30 * 60 * 1000); // 30 minutes before now
    const timeWindowEnd = new Date(now.getTime() + 60 * 60 * 1000); // 60 minutes after now

    const { data: meeting, error: meetingError } = await supabase
      .from('meetings')
      .select('id, org_id, project_id, scheduled_start_at, scheduled_end_at, title, agenda, project:projects(name)')
      .eq('meeting_code_norm', meetingCodeNorm)
      .gte('scheduled_end_at', timeWindowStart.toISOString())
      .lte('scheduled_start_at', timeWindowEnd.toISOString())
      .single();

    if (meetingError || !meeting) {
      throw new Error(`Meeting not found for code: ${meeting_code}`);
    }

    const project = meeting.project as any;

    // Step 2: Verify meeting code matches
    // (Already validated by finding the meeting above)

    // Step 3: Fuzzy match spoken name against invitees
    const match = await fuzzyMatchInvitee(
      meeting.id,
      spoken_name,
      caller_phone || undefined
    );

    if (!match || match.similarity < 0.5) {
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
    
    return {
      // Explicit success indicators at the top
      verified: true,
      success: true,
      status: 'verified',
      attempts_left: 0,
      // Clear, short message for the agent to speak
      message_for_user: welcomeMessage,
      // What the agent should say (explicit instruction)
      say_to_user: welcomeMessage,
      call_session_id: callSession.id,
      meeting_context: {
        title: meeting.title || '',
        agenda: meeting.agenda || null,
        invitee_name: invitee.name,
        project_name: project?.name || '',
      },
      // Explicit instruction for the agent
      agent_instruction: `VERIFICATION SUCCESSFUL. Say this to the user: "${welcomeMessage}" Then proceed with the knowledge capture conversation about: ${meeting.title || 'the meeting'}.`,
    };
  });
}
