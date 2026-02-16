import { z } from 'zod';
import { generateSummary } from '../services/llm.js';
import { persistSummary } from './persist-summary.js';
import { GenerateSummaryFromTranscriptSchema, GenerateSummaryFromTranscriptResponse } from '../types/index.js';

export async function generateSummaryFromTranscript(
  input: z.infer<typeof GenerateSummaryFromTranscriptSchema>
): Promise<GenerateSummaryFromTranscriptResponse> {
  const { call_session_id, transcript, model, idempotency_key } = input;

  // Generate summary using LLM
  const summaryResult = await generateSummary(transcript, model);

  // Persist the summary
  const persistResult = await persistSummary({
    call_session_id,
    model,
    summary_text: summaryResult.summary_text,
    key_points: summaryResult.key_points,
    action_items: summaryResult.action_items,
    idempotency_key,
  });

  return {
    summary_id: persistResult.summary_id,
    summary_path: persistResult.summary_path,
  };
}
