import { randomUUID } from 'crypto';
import { z } from 'zod';
import { supabase } from '../services/supabase.js';
import { uploadTranscript } from '../services/storage.js';
import { withIdempotency } from '../services/idempotency.js';
import { PersistTranscriptSchema, PersistTranscriptResponse } from '../types/index.js';

/**
 * Store conversation transcript in the database and Supabase Storage.
 * Call this during or at the end of the meeting to persist the transcript.
 */
export async function persistTranscript(
  input: z.infer<typeof PersistTranscriptSchema>
): Promise<PersistTranscriptResponse> {
  const { call_session_id, raw_transcript, normalized_transcript, idempotency_key } = input;
  const key = idempotency_key ?? randomUUID();

  return withIdempotency(`transcript:${call_session_id}`, key, async () => {
    // Get call session to derive org/project/meeting IDs
    const { data: callSession, error: sessionError } = await supabase
      .from('call_sessions')
      .select('id, org_id, project_id, meeting_id, meeting:meetings(agent_name)')
      .eq('id', call_session_id)
      .single();

    if (sessionError || !callSession) {
      throw new Error(`Call session not found: ${call_session_id}`);
    }

    // Upload transcript to storage (overwrites if exists)
    const transcriptPath = await uploadTranscript(
      callSession.org_id,
      callSession.project_id,
      callSession.meeting_id,
      call_session_id,
      raw_transcript
    );

    const meeting = callSession.meeting as any | undefined;
    const agentName = meeting?.agent_name || null;

    // Find existing transcript for this call session (no UNIQUE on call_session_id in schema)
    const { data: existing } = await supabase
      .from('transcripts')
      .select('id')
      .eq('call_session_id', call_session_id)
      .limit(1)
      .maybeSingle();

    let transcriptId: string;

    if (existing) {
      const { error: updateError } = await supabase
        .from('transcripts')
        .update({
          raw: raw_transcript,
          normalized: normalized_transcript ?? null,
          meeting_id: callSession.meeting_id,
          agent_name: agentName,
        })
        .eq('id', existing.id);

      if (updateError) {
        throw new Error(`Failed to update transcript: ${updateError.message}`);
      }
      transcriptId = existing.id;
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from('transcripts')
        .insert({
          call_session_id,
          org_id: callSession.org_id,
          project_id: callSession.project_id,
          meeting_id: callSession.meeting_id,
          agent_name: agentName,
          raw: raw_transcript,
          normalized: normalized_transcript ?? null,
        })
        .select('id')
        .single();

      if (insertError || !inserted) {
        throw new Error(`Failed to save transcript: ${insertError?.message ?? 'unknown'}`);
      }
      transcriptId = inserted.id;
    }

    // Update call session with transcript path
    await supabase
      .from('call_sessions')
      .update({ transcript_path: transcriptPath })
      .eq('id', call_session_id);

    // Ensure only the latest transcript per meeting:
    // for this meeting_id, remove transcripts for any other call_sessions
    if (callSession.meeting_id) {
      const { data: otherSessions } = await supabase
        .from('call_sessions')
        .select('id')
        .eq('meeting_id', callSession.meeting_id)
        .neq('id', call_session_id);

      const otherIds = (otherSessions || []).map((s: { id: string }) => s.id);
      if (otherIds.length > 0) {
        await supabase
          .from('transcripts')
          .delete()
          .in('call_session_id', otherIds);
      }
    }

    return {
      transcript_id: transcriptId,
      transcript_path: transcriptPath,
    };
  });
}
