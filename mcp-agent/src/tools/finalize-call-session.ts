import { z } from 'zod';
import { supabase } from '../services/supabase.js';
import { withIdempotency } from '../services/idempotency.js';
import { FinalizeCallSessionSchema, FinalizeCallSessionResponse } from '../types/index.js';

export async function finalizeCallSession(
  input: z.infer<typeof FinalizeCallSessionSchema>
): Promise<FinalizeCallSessionResponse> {
  const { call_session_id, ended_at_iso, duration_sec, status, idempotency_key } = input;

  return withIdempotency(`finalize:${call_session_id}`, idempotency_key, async () => {
    const updateData: any = {
      ended_at: ended_at_iso,
      status,
    };

    if (duration_sec !== undefined) {
      updateData.duration_sec = duration_sec;
    } else {
      // Calculate duration if not provided
      const { data: session } = await supabase
        .from('call_sessions')
        .select('started_at')
        .eq('id', call_session_id)
        .single();

      if (session?.started_at) {
        const start = new Date(session.started_at);
        const end = new Date(ended_at_iso);
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

    return { success: true };
  });
}
