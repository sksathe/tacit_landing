import { z } from 'zod';
import { supabase } from '../services/supabase.js';
import { normalizeMeetingCode } from '../services/meeting-code.js';
import { fuzzyMatchInvitee } from '../services/name-matching.js';
import { withIdempotency } from '../services/idempotency.js';
import { VerifySpokenJoinSchema, VerifySpokenJoinResponse } from '../types/index.js';

export async function verifySpokenJoin(
  input: z.infer<typeof VerifySpokenJoinSchema>
): Promise<VerifySpokenJoinResponse> {
  const { call_session_id, spoken_name, meeting_code, idempotency_key } = input;

  const key = idempotency_key ?? `${Date.now()}-${Math.random()}`;
  return withIdempotency(`verify_join:${call_session_id}`, key, async () => {
    // Get call session and meeting
    const { data: callSession, error: sessionError } = await supabase
      .from('call_sessions')
      .select('meeting_id, verification_attempts, caller_phone, meeting:meetings(meeting_code_norm, project:projects(name))')
      .eq('id', call_session_id)
      .single();

    if (sessionError || !callSession) {
      throw new Error(`Call session not found: ${call_session_id}`);
    }

    const meeting = callSession.meeting as any;
    const project = meeting?.project as any;

    // Validate meeting code
    const meetingCodeNorm = normalizeMeetingCode(meeting_code);
    if (meeting.meeting_code_norm !== meetingCodeNorm) {
      const attempts = callSession.verification_attempts + 1;
      const attemptsLeft = Math.max(0, 2 - attempts);

      // Update attempts
      await supabase
        .from('call_sessions')
        .update({ verification_attempts: attempts })
        .eq('id', call_session_id);

      if (attempts >= 2) {
        await supabase
          .from('call_sessions')
          .update({ verification_status: 'rejected' })
          .eq('id', call_session_id);

        return {
          status: 'rejected',
          attempts_left: 0,
          message_for_user: 'Verification failed. Maximum attempts reached.',
        };
      }

      return {
        status: 'retry',
        attempts_left: attemptsLeft,
        message_for_user: `Meeting code doesn't match. Please try again. You have ${attemptsLeft} attempt(s) left.`,
      };
    }

    // Fuzzy match spoken name against invitees
    const match = await fuzzyMatchInvitee(
      callSession.meeting_id,
      spoken_name,
      callSession.caller_phone || undefined
    );

    if (!match || match.similarity < 0.5) {
      const attempts = callSession.verification_attempts + 1;
      const attemptsLeft = Math.max(0, 2 - attempts);

      await supabase
        .from('call_sessions')
        .update({ verification_attempts: attempts })
        .eq('id', call_session_id);

      if (attempts >= 2) {
        await supabase
          .from('call_sessions')
          .update({ verification_status: 'rejected' })
          .eq('id', call_session_id);

        return {
          status: 'rejected',
          attempts_left: 0,
          message_for_user: 'Name verification failed. Maximum attempts reached.',
        };
      }

      return {
        status: 'retry',
        attempts_left: attemptsLeft,
        message_for_user: `Name doesn't match our records. Please say your full name again. You have ${attemptsLeft} attempt(s) left.`,
      };
    }

    // Verification successful
    const { data: invitee } = await supabase
      .from('meeting_invitees')
      .select('name, email')
      .eq('id', match.invitee_id)
      .single();

    const { data: meetingData } = await supabase
      .from('meetings')
      .select('title, agenda')
      .eq('id', callSession.meeting_id)
      .single();

    await supabase
      .from('call_sessions')
      .update({
        verification_status: 'verified',
        verified_invitee_id: match.invitee_id,
        verification_attempts: callSession.verification_attempts + 1,
      })
      .eq('id', call_session_id);

    return {
      status: 'verified',
      attempts_left: 0,
      message_for_user: `Welcome ${invitee?.name || spoken_name}! Verification successful.`,
      meeting_context: {
        title: meetingData?.title || '',
        agenda: meetingData?.agenda || null,
        invitee_name: invitee?.name || spoken_name,
        project_name: project?.name || '',
      },
    };
  });
}
