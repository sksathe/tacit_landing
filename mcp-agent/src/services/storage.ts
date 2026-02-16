import { supabase } from './supabase.js';

const BUCKET_NAME = 'tacit-artifacts';

/**
 * Upload transcript JSON to Supabase Storage
 */
export async function uploadTranscript(
  orgId: string,
  projectId: string,
  meetingId: string,
  callSessionId: string,
  transcriptData: any
): Promise<string> {
  const path = `org/${orgId}/projects/${projectId}/meetings/${meetingId}/sessions/${callSessionId}/transcript.json`;

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(path, JSON.stringify(transcriptData, null, 2), {
      contentType: 'application/json',
      upsert: true,
    });

  if (error) {
    throw new Error(`Failed to upload transcript: ${error.message}`);
  }

  return path;
}

/**
 * Upload summary JSON to Supabase Storage
 */
export async function uploadSummary(
  orgId: string,
  projectId: string,
  meetingId: string,
  callSessionId: string,
  summaryData: any
): Promise<string> {
  const path = `org/${orgId}/projects/${projectId}/meetings/${meetingId}/sessions/${callSessionId}/summary.json`;

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(path, JSON.stringify(summaryData, null, 2), {
      contentType: 'application/json',
      upsert: true,
    });

  if (error) {
    throw new Error(`Failed to upload summary: ${error.message}`);
  }

  return path;
}
