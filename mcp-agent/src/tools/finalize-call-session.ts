import { randomUUID } from 'crypto';
import { z } from 'zod';
import { supabase } from '../services/supabase.js';
import { withIdempotency } from '../services/idempotency.js';
import { FinalizeCallSessionSchema, FinalizeCallSessionResponse } from '../types/index.js';
import { persistTranscript } from './persist-transcript.js';

export async function finalizeCallSession(
  input: z.infer<typeof FinalizeCallSessionSchema>
): Promise<FinalizeCallSessionResponse> {
  const { call_session_id, ended_at_iso, duration_sec, status, raw_transcript, normalized_transcript, idempotency_key } = input;
  const endedAt = ended_at_iso ?? new Date().toISOString();
  const key = idempotency_key ?? randomUUID();

  return withIdempotency(`finalize:${call_session_id}`, key, async () => {
    const updateData: any = {
      ended_at: endedAt,
      status,
    };

    if (duration_sec !== undefined) {
      updateData.duration_sec = duration_sec;
    } else {
      const { data: session } = await supabase
        .from('call_sessions')
        .select('started_at')
        .eq('id', call_session_id)
        .single();

      if (session?.started_at) {
        const start = new Date(session.started_at);
        const end = new Date(endedAt);
        updateData.duration_sec = Math.floor((end.getTime() - start.getTime()) / 1000);
      }
    }

    const { error } = await supabase
      .from('call_sessions')
      .update(updateData)
      .eq('id', call_session_id);

    if (error) {
      throw new Error(`Failed to finalize call session: ${error.message}`);
    }

    // When transcript is provided, save it so the call transcript is persisted when the call ends
    if (raw_transcript != null && typeof raw_transcript === 'object') {
      try {
        await persistTranscript({
          call_session_id,
          raw_transcript,
          normalized_transcript: normalized_transcript ?? undefined,
          idempotency_key: `${key}-transcript`,
        });
      } catch (persistErr) {
        console.error('Failed to persist transcript on finalize:', persistErr);
        // Don't fail finalize if transcript save fails; session is still finalized
      }
    }

    return { success: true };
  });
}
