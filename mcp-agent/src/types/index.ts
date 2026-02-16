import { z } from 'zod';

// MCP Tool Schemas
export const CreateOrGetCallSessionSchema = z.object({
  meeting_code: z.string(),
  spoken_name: z.string().optional(),
  caller_phone: z.string().optional(),
  elevenlabs_conversation_id: z.string().optional(),
  now_iso: z.string().datetime(),
  idempotency_key: z.string(),
});

export const VerifySpokenJoinSchema = z.object({
  call_session_id: z.string().uuid(),
  spoken_name: z.string(),
  meeting_code: z.string(),
  idempotency_key: z.string(),
});

export const GetMeetingContextSchema = z.object({
  call_session_id: z.string().uuid(),
});

export const PersistTranscriptSchema = z.object({
  call_session_id: z.string().uuid(),
  raw_transcript: z.any(), // JSON
  normalized_transcript: z.any().optional(), // JSON
  idempotency_key: z.string(),
});

export const PersistSummarySchema = z.object({
  call_session_id: z.string().uuid(),
  model: z.string(),
  summary_text: z.string(),
  key_points: z.array(z.string()),
  action_items: z.array(z.any()),
  idempotency_key: z.string(),
});

export const FinalizeCallSessionSchema = z.object({
  call_session_id: z.string().uuid(),
  ended_at_iso: z.string().datetime(),
  duration_sec: z.number().optional(),
  status: z.enum(['completed', 'failed']),
  idempotency_key: z.string(),
});

export const GenerateSummaryFromTranscriptSchema = z.object({
  call_session_id: z.string().uuid(),
  transcript: z.any(),
  model: z.string().default('gpt-4'),
  idempotency_key: z.string(),
});

// MCP Tool Response Types
export interface CreateOrGetCallSessionResponse {
  call_session_id: string;
  meeting_id: string;
  project_id: string;
  org_id: string;
  status: string;
}

export interface VerifySpokenJoinResponse {
  status: 'verified' | 'retry' | 'rejected';
  attempts_left: number;
  message_for_user: string;
  meeting_context?: {
    title: string;
    agenda: string | null;
    invitee_name: string;
    project_name: string;
  };
}

export interface GetMeetingContextResponse {
  meeting: {
    title: string;
    agenda: string | null;
    scheduled_start_at: string;
    scheduled_end_at: string;
    meeting_code: string;
  };
  invitee: {
    name: string;
    email: string;
  } | null;
  agent_hints: string[];
}

export interface PersistTranscriptResponse {
  transcript_id: string;
  transcript_path: string;
}

export interface PersistSummaryResponse {
  summary_id: string;
  summary_path: string;
}

export interface FinalizeCallSessionResponse {
  success: boolean;
}

export interface GenerateSummaryFromTranscriptResponse {
  summary_id: string;
  summary_path: string;
}

// MCP Tool Definition
export interface MCPTool {
  name: string;
  description: string;
  inputSchema: z.ZodSchema;
}
