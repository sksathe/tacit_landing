import { z } from 'zod';
import { randomUUID } from 'crypto';
import { createOrGetCallSession } from './create-or-get-call-session.js';
import { verifySpokenJoin } from './verify-spoken-join.js';
import { verifyUserAndStartSession } from './verify-user-and-start-session.js';
import { getMeetingContext } from './get-meeting-context.js';
import { persistTranscript } from './persist-transcript.js';
import { persistSummary } from './persist-summary.js';
import { finalizeCallSession } from './finalize-call-session.js';
import { generateSummaryFromTranscript } from './generate-summary-from-transcript.js';
import {
  CreateOrGetCallSessionSchema,
  VerifySpokenJoinSchema,
  VerifyUserAndStartSessionSchema,
  GetMeetingContextSchema,
  PersistTranscriptSchema,
  PersistSummarySchema,
  FinalizeCallSessionSchema,
  GenerateSummaryFromTranscriptSchema,
  MCPTool,
} from '../types/index.js';

// Primary tools for the agent (validate user → meeting details → talk → store transcript → finalize)
export const MCP_TOOLS: MCPTool[] = [
  {
    name: 'verify_user_and_start_session',
    description: `Validate user and start the call session. Call ONLY after you have BOTH meeting_code and spoken_name from the user.
Steps: (1) Greet and ask for 4-digit meeting code. (2) Ask for full name. (3) Call this tool with meeting_code and spoken_name.
Required: meeting_code (string), spoken_name (string). On success returns call_session_id, agenda, and agent_hints in one response—do NOT call get_meeting_context; use this response and respond immediately. Use call_session_id for persist_transcript and finalize_call_session.`,
    inputSchema: VerifyUserAndStartSessionSchema,
  },
  {
    name: 'get_meeting_context',
    description: 'Optional: retrieve meeting details (title, agenda, invitee, agent hints). Usually not needed—verification success already returns agenda and hints. Only call if you need to re-fetch context. Required: call_session_id (from verify_user_and_start_session).',
    inputSchema: GetMeetingContextSchema,
  },
  {
    name: 'persist_transcript',
    description: 'Store the conversation transcript in the database and Supabase Storage. Call during or at the end of the meeting to save the transcript. Required: call_session_id, raw_transcript (e.g. { messages: [...] }). Optional: normalized_transcript.',
    inputSchema: PersistTranscriptSchema,
  },
  {
    name: 'finalize_call_session',
    description: 'Mark the call session as completed or failed and save the transcript. Call when the meeting ends. Required: call_session_id, status ("completed" or "failed"). You MUST pass raw_transcript with the conversation transcript (e.g. { messages: [...] }) so the call is saved to the database. Optional: ended_at_iso (defaults to now), duration_sec, normalized_transcript.',
    inputSchema: FinalizeCallSessionSchema,
  },
  {
    name: 'persist_summary',
    description: 'Save meeting summary (key points, action items) to the database and storage. Optional: call after generating a summary.',
    inputSchema: PersistSummarySchema,
  },
  {
    name: 'generate_summary_from_transcript',
    description: 'Generate a summary from transcript using LLM and persist it. Optional: call after persist_transcript to create and store a summary.',
    inputSchema: GenerateSummaryFromTranscriptSchema,
  },
];

/**
 * Auto-generate idempotency_key if not provided
 */
function ensureIdempotencyKey(input: any): any {
  if (!input.idempotency_key) {
    input.idempotency_key = randomUUID();
  }
  return input;
}

/**
 * Auto-generate now_iso if not provided (for create_or_get_call_session)
 */
function ensureNowIso(input: any): any {
  if (!input.now_iso) {
    input.now_iso = new Date().toISOString();
  }
  return input;
}

export async function executeTool(toolName: string, input: any): Promise<any> {
  try {
    // Auto-generate missing internal parameters
    let processedInput = { ...input };
    
    switch (toolName) {
      case 'verify_user_and_start_session':
        processedInput = ensureIdempotencyKey(processedInput);
        processedInput = ensureNowIso(processedInput);
        return verifyUserAndStartSession(VerifyUserAndStartSessionSchema.parse(processedInput));
      
      case 'create_or_get_call_session':
        processedInput = ensureIdempotencyKey(processedInput);
        processedInput = ensureNowIso(processedInput);
        return createOrGetCallSession(CreateOrGetCallSessionSchema.parse(processedInput));
      
      case 'verify_spoken_join':
        processedInput = ensureIdempotencyKey(processedInput);
        return verifySpokenJoin(VerifySpokenJoinSchema.parse(processedInput));
      
      case 'get_meeting_context':
        return getMeetingContext(GetMeetingContextSchema.parse(processedInput));
      
      case 'persist_transcript':
        processedInput = ensureIdempotencyKey(processedInput);
        return persistTranscript(PersistTranscriptSchema.parse(processedInput));
      
      case 'persist_summary':
        processedInput = ensureIdempotencyKey(processedInput);
        return persistSummary(PersistSummarySchema.parse(processedInput));
      
      case 'finalize_call_session':
        processedInput = ensureIdempotencyKey(processedInput);
        return finalizeCallSession(FinalizeCallSessionSchema.parse(processedInput));
      
      case 'generate_summary_from_transcript':
        processedInput = ensureIdempotencyKey(processedInput);
        return generateSummaryFromTranscript(GenerateSummaryFromTranscriptSchema.parse(processedInput));
      
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  } catch (error: any) {
    // If it's a Zod validation error, provide helpful message
    if (error.name === 'ZodError' && error.issues) {
      const missingFields = error.issues
        .filter((issue: any) => issue.code === 'invalid_type' && issue.received === 'undefined')
        .map((issue: any) => issue.path.join('.'))
        .join(', ');
      
      if (missingFields) {
        // Provide helpful guidance for common missing parameters
        let guidance = '';
        if (missingFields.includes('call_session_id') && toolName === 'get_meeting_context') {
          guidance = ' get_meeting_context requires call_session_id from verify_user_and_start_session. Do NOT call get_meeting_context until after verification succeeds. First ask for meeting code and name, call verify_user_and_start_session; use the call_session_id from that response when calling get_meeting_context.';
        } else if (missingFields.includes('call_session_id') && toolName === 'verify_spoken_join') {
          guidance = ' Note: Use verify_user_and_start_session instead - it verifies the user first, then creates the session.';
        } else if (missingFields.includes('meeting_code')) {
          guidance = ' ACTION REQUIRED: Greet the user and ask: "Hello! Welcome to Tacit. To get started, please tell me your 4-digit meeting code." Wait for their response, then call this tool again with the meeting_code.';
        } else if (missingFields.includes('spoken_name')) {
          guidance = ' ACTION REQUIRED: After getting the meeting code, ask: "Thank you. Now please tell me your full name." Wait for their response, then call this tool again with both meeting_code and spoken_name.';
        } else if (missingFields.includes('meeting_code') && missingFields.includes('spoken_name')) {
          guidance = ' ACTION REQUIRED: You must collect both pieces of information. First ask: "Hello! Welcome to Tacit. Please tell me your 4-digit meeting code." After they provide it, ask: "Thank you. Now please tell me your full name." Once you have both, call this tool with meeting_code and spoken_name.';
        }
        
        throw new Error(`Missing required parameters: ${missingFields}.${guidance}`);
      }
    }
    // Re-throw other errors as-is
    throw error;
  }
}
