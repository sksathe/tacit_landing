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

export const MCP_TOOLS: MCPTool[] = [
  {
    name: 'verify_user_and_start_session',
    description: `VERIFICATION TOOL - DO NOT CALL UNTIL YOU HAVE BOTH VALUES.

WHEN TO CALL THIS TOOL:
- ONLY call this tool AFTER you have collected BOTH the meeting_code AND spoken_name from the user
- DO NOT call this tool with empty arguments {}
- DO NOT call this tool before asking the user for information

STEP-BY-STEP PROCESS:
1. When call starts, greet: "Hello! Welcome to Tacit. To get started, I'll need your 4-digit meeting code."
2. WAIT for user to provide meeting code (they may say "1234" or "one two three four")
3. After receiving meeting code, ask: "Thank you. Now please tell me your full name."
4. WAIT for user to provide their full name
5. ONLY NOW, call this tool with BOTH meeting_code and spoken_name

REQUIRED PARAMETERS:
- meeting_code: The 4-digit code the user provided (e.g., "1234")
- spoken_name: The full name the user said (e.g., "John Doe")

RESPONSE HANDLING:
- If result="success" OR verified=true OR status="verified": This means SUCCESS. Say the "text" or "say_to_user" field EXACTLY as provided. DO NOT say "cannot verify" or "technical difficulties". Then proceed with conversation.
- If result="error" OR verified=false OR status="verification_failed": This means FAILURE. Say the "text" or "say_to_user" field EXACTLY as provided. Then ask user to try again.

CRITICAL RULES:
- Never call this tool with empty arguments {}
- Never call this tool before collecting both meeting_code and spoken_name
- Always check result="success" or verified=true before proceeding
- Always say the "text" or "say_to_user" field when verification succeeds`,
    inputSchema: VerifyUserAndStartSessionSchema,
  },
  {
    name: 'create_or_get_call_session',
    description: 'Legacy tool - DO NOT USE. Use verify_user_and_start_session instead.',
    inputSchema: CreateOrGetCallSessionSchema,
  },
  {
    name: 'verify_spoken_join',
    description: 'Legacy tool - DO NOT USE. Use verify_user_and_start_session instead.',
    inputSchema: VerifySpokenJoinSchema,
  },
  {
    name: 'get_meeting_context',
    description: 'Get meeting context including agenda, title, and agent hints. Use this during the conversation to refresh your understanding of what to discuss.',
    inputSchema: GetMeetingContextSchema,
  },
  {
    name: 'persist_transcript',
    description: 'Save transcript to database and storage',
    inputSchema: PersistTranscriptSchema,
  },
  {
    name: 'persist_summary',
    description: 'Save meeting summary to database and storage',
    inputSchema: PersistSummarySchema,
  },
  {
    name: 'finalize_call_session',
    description: 'Mark a call session as completed or failed',
    inputSchema: FinalizeCallSessionSchema,
  },
  {
    name: 'generate_summary_from_transcript',
    description: 'Generate a summary from transcript using LLM and persist it',
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
        if (missingFields.includes('call_session_id') && toolName === 'verify_spoken_join') {
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
