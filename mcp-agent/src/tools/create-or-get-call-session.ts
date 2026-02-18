import { z } from 'zod';
import { supabase } from '../services/supabase.js';
import { normalizeMeetingCode } from '../services/meeting-code.js';
import { CreateOrGetCallSessionSchema, CreateOrGetCallSessionResponse } from '../types/index.js';

export async function createOrGetCallSession(
  input: z.infer<typeof CreateOrGetCallSessionSchema>
): Promise<CreateOrGetCallSessionResponse> {
  const { meeting_code, caller_phone, elevenlabs_conversation_id, now_iso, idempotency_key } = input;

  // Normalize meeting code
  const meetingCodeNorm = normalizeMeetingCode(meeting_code);
  // Use provided now_iso or current time
  const now = now_iso ? new Date(now_iso) : new Date();

  // Find meeting within time window (start-30m to end+60m)
  const timeWindowStart = new Date(now.getTime() - 30 * 60 * 1000); // 30 minutes before now
  const timeWindowEnd = new Date(now.getTime() + 60 * 60 * 1000); // 60 minutes after now

  const { data: meeting, error: meetingError } = await supabase
    .from('meetings')
    .select('id, org_id, project_id, scheduled_start_at, scheduled_end_at')
    .eq('meeting_code_norm', meetingCodeNorm)
    .gte('scheduled_end_at', timeWindowStart.toISOString())
    .lte('scheduled_start_at', timeWindowEnd.toISOString())
    .single();

  if (meetingError || !meeting) {
    throw new Error(`Meeting not found for code: ${meeting_code}`);
  }

  // Check if call session already exists for this conversation_id
  if (elevenlabs_conversation_id) {
    const { data: existingSession, error: existingError } = await supabase
      .from('call_sessions')
      .select('id, org_id, project_id, meeting_id, status')
      .eq('elevenlabs_conversation_id', elevenlabs_conversation_id)
      .single();

    if (!existingError && existingSession) {
      return {
        call_session_id: existingSession.id,
        meeting_id: existingSession.meeting_id,
        project_id: existingSession.project_id,
        org_id: meeting.org_id,
        status: existingSession.status,
      };
    }
  }

  // Create new call session
  const { data: callSession, error: sessionError } = await supabase
    .from('call_sessions')
    .insert({
      org_id: meeting.org_id,
      project_id: meeting.project_id,
      meeting_id: meeting.id,
      caller_phone: caller_phone || null,
      elevenlabs_conversation_id: elevenlabs_conversation_id || null,
      verification_status: 'pending',
      verification_attempts: 0,
      status: 'in_progress',
      started_at: now.toISOString(),
    })
    .select('id, org_id, project_id, meeting_id, status')
    .single();

  if (sessionError || !callSession) {
    throw new Error(`Failed to create call session: ${sessionError?.message}`);
  }

  return {
    call_session_id: callSession.id,
    meeting_id: callSession.meeting_id,
    project_id: callSession.project_id,
    org_id: callSession.org_id,
    status: callSession.status,
  };
}
