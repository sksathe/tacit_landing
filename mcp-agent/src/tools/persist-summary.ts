import { z } from 'zod';
import { supabase } from '../services/supabase.js';
import { uploadSummary } from '../services/storage.js';
import { withIdempotency } from '../services/idempotency.js';
import { PersistSummarySchema, PersistSummaryResponse } from '../types/index.js';

export async function persistSummary(
  input: z.infer<typeof PersistSummarySchema>
): Promise<PersistSummaryResponse> {
  const { call_session_id, model, summary_text, key_points, action_items, idempotency_key } = input;

  return withIdempotency(`summary:${call_session_id}`, idempotency_key, async () => {
    // Get call session to derive org/project/meeting IDs
    const { data: callSession, error: sessionError } = await supabase
      .from('call_sessions')
      .select('org_id, project_id, meeting_id')
      .eq('id', call_session_id)
      .single();

    if (sessionError || !callSession) {
      throw new Error(`Call session not found: ${call_session_id}`);
    }

    // Prepare summary data for storage
    const summaryData = {
      model,
      summary_text,
      key_points,
      action_items,
      generated_at: new Date().toISOString(),
    };

    // Upload summary to storage
    const summaryPath = await uploadSummary(
      callSession.org_id,
      callSession.project_id,
      callSession.meeting_id,
      call_session_id,
      summaryData
    );

    // Upsert summary record
    const { data: summary, error: summaryError } = await supabase
      .from('summaries')
      .upsert({
        call_session_id,
        org_id: callSession.org_id,
        project_id: callSession.project_id,
        model,
        summary_text,
        key_points,
        action_items,
      }, {
        onConflict: 'call_session_id',
      })
      .select('id')
      .single();

    if (summaryError) {
      throw new Error(`Failed to save summary: ${summaryError.message}`);
    }

    // Update call session with summary path
    await supabase
      .from('call_sessions')
      .update({ summary_path: summaryPath })
      .eq('id', call_session_id);

    return {
      summary_id: summary.id,
      summary_path: summaryPath,
    };
  });
}
