import { randomUUID } from 'crypto';
import { z } from 'zod';
import { supabase } from '../services/supabase.js';
import { uploadSummary } from '../services/storage.js';
import { withIdempotency } from '../services/idempotency.js';
import { PersistSummarySchema, PersistSummaryResponse } from '../types/index.js';

export async function persistSummary(
  input: z.infer<typeof PersistSummarySchema>
): Promise<PersistSummaryResponse> {
  const { call_session_id, model, summary_text, key_points, action_items, idempotency_key } = input;
  const key = idempotency_key ?? randomUUID();

  return withIdempotency(`summary:${call_session_id}`, key, async () => {
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

    // Find existing summary for this call session; update or insert (no UNIQUE on call_session_id in schema)
    const { data: existingSummary } = await supabase
      .from('summaries')
      .select('id')
      .eq('call_session_id', call_session_id)
      .limit(1)
      .maybeSingle();

    let summaryId: string;

    if (existingSummary) {
      const { error: updateError } = await supabase
        .from('summaries')
        .update({
          model,
          summary_text,
          key_points,
          action_items,
        })
        .eq('id', existingSummary.id);

      if (updateError) {
        throw new Error(`Failed to update summary: ${updateError.message}`);
      }
      summaryId = existingSummary.id;
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from('summaries')
        .insert({
          call_session_id,
          org_id: callSession.org_id,
          project_id: callSession.project_id,
          model,
          summary_text,
          key_points,
          action_items,
        })
        .select('id')
        .single();

      if (insertError || !inserted) {
        throw new Error(`Failed to save summary: ${insertError?.message ?? 'unknown'}`);
      }
      summaryId = inserted.id;
    }

    // Update call session with summary path
    await supabase
      .from('call_sessions')
      .update({ summary_path: summaryPath })
      .eq('id', call_session_id);

    return {
      summary_id: summaryId,
      summary_path: summaryPath,
    };
  });
}
