import { z } from 'zod';

// MCP Tool Schemas
export const CreateOrGetCallSessionSchema = z.object({
  meeting_code: z.string(),
  spoken_name: z.string().optional(),
  caller_phone: z.string().optional(),
  elevenlabs_conversation_id: z.string().optional(),
  now_iso: z.string().datetime().optional(), // Auto-generated if not provided
  idempotency_key: z.string().optional(), // Auto-generated if not provided
});

export const VerifySpokenJoinSchema = z.object({
  call_session_id: z.string().uuid(),
  spoken_name: z.string(),
  meeting_code: z.string(),
  idempotency_key: z.string().optional(), // Auto-generated if not provided
});

// New schema: Verify user first, then create session
export const VerifyUserAndStartSessionSchema = z.object({
  meeting_code: z.string(),
  spoken_name: z.string(),
  caller_phone: z.string().optional(),
  elevenlabs_conversation_id: z.string().optional(),
  now_iso: z.string().datetime().optional(), // Auto-generated if not provided
  idempotency_key: z.string().optional(), // Auto-generated if not provided
});

export const GetMeetingContextSchema = z.object({
  call_session_id: z.string().uuid(),
});

export const PersistTranscriptSchema = z.object({
  call_session_id: z.string().uuid(),
  raw_transcript: z.any(), // JSON
  normalized_transcript: z.any().optional(), // JSON
  idempotency_key: z.string().optional(), // Auto-generated if not provided
});

export const PersistSummarySchema = z.object({
  call_session_id: z.string().uuid(),
  model: z.string(),
  summary_text: z.string(),
  key_points: z.array(z.string()),
  action_items: z.array(z.any()),
  idempotency_key: z.string().optional(), // Auto-generated if not provided
});

export const FinalizeCallSessionSchema = z.object({
  call_session_id: z.string().uuid(),
  ended_at_iso: z.string().datetime().optional(), // Defaults to now if omitted
  duration_sec: z.number().optional(),
  status: z.enum(['completed', 'failed']),
  /** When provided, the transcript is saved to DB and storage when the call is finalized. Pass the conversation transcript here so it is persisted automatically. */
  raw_transcript: z.any().optional(),
  normalized_transcript: z.any().optional(),
  idempotency_key: z.string().optional(), // Auto-generated if not provided
});

export const GenerateSummaryFromTranscriptSchema = z.object({
  call_session_id: z.string().uuid(),
  transcript: z.any(),
  model: z.string().default('gpt-4'),
  idempotency_key: z.string().optional(), // Auto-generated if not provided
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

export interface VerifyUserAndStartSessionResponse {
  verified?: boolean;
  success?: boolean;
  status: 'verified' | 'verification_failed' | 'too_early' | 'too_late';
  attempts_left: number;
  message_for_user: string;
  say_to_user?: string;
  call_session_id: string | null;
  meeting_context: {
    title: string;
    agenda: string | null;
    invitee_name: string;
    project_name: string;
  } | null;
  /** When verified: same as get_meeting_context so agent does not need a second tool call */
  agent_hints?: string[];
  no_agenda_opening?: string | null;
  agent_instruction?: string;
  verification_successful?: boolean;
  /** When too_early/too_late: human-readable scheduled time for the agent to say */
  scheduled_time_human?: string;
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
  /** When no agenda was set: phrase for the agent to say to open the conversation. */
  no_agenda_opening?: string | null;
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
