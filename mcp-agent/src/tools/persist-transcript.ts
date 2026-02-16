import { z } from 'zod';
import { supabase } from '../services/supabase.js';
import { uploadTranscript } from '../services/storage.js';
import { withIdempotency } from '../services/idempotency.js';
import { PersistTranscriptSchema, PersistTranscriptResponse } from '../types/index.js';

export async function persistTranscript(
  input: z.infer<typeof PersistTranscriptSchema>
): Promise<PersistTranscriptResponse> {
  const { call_session_id, raw_transcript, normalized_transcript, idempotency_key } = input;

  return withIdempotency(`transcript:${call_session_id}`, idempotency_key, async () => {
    // Get call session to derive org/project/meeting IDs
    const { data: callSession, error: sessionError } = await supabase
      .from('call_sessions')
      .select('org_id, project_id, meeting_id')
      .eq('id', call_session_id)
      .single();

    if (sessionError || !callSession) {
      throw new Error(`Call session not found: ${call_session_id}`);
    }

    // Upload transcript to storage
    const transcriptPath = await uploadTranscript(
      callSession.org_id,
      callSession.project_id,
      callSession.meeting_id,
      call_session_id,
      raw_transcript
    );

    // Upsert transcript record
    const { data: transcript, error: transcriptError } = await supabase
      .from('transcripts')
      .upsert({
        call_session_id,
        org_id: callSession.org_id,
        project_id: callSession.project_id,
        raw: raw_transcript,
        normalized: normalized_transcript || null,
      }, {
        onConflict: 'call_session_id',
      })
      .select('id')
      .single();

    if (transcriptError) {
      throw new Error(`Failed to save transcript: ${transcriptError.message}`);
    }

    // Update call session with transcript path
    await supabase
      .from('call_sessions')
      .update({ transcript_path: transcriptPath })
      .eq('id', call_session_id);

    return {
      transcript_id: transcript.id,
      transcript_path: transcriptPath,
    };
  });
}
