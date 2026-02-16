import { z } from 'zod';
import { createOrGetCallSession } from './create-or-get-call-session.js';
import { verifySpokenJoin } from './verify-spoken-join.js';
import { getMeetingContext } from './get-meeting-context.js';
import { persistTranscript } from './persist-transcript.js';
import { persistSummary } from './persist-summary.js';
import { finalizeCallSession } from './finalize-call-session.js';
import { generateSummaryFromTranscript } from './generate-summary-from-transcript.js';
import {
  CreateOrGetCallSessionSchema,
  VerifySpokenJoinSchema,
  GetMeetingContextSchema,
  PersistTranscriptSchema,
  PersistSummarySchema,
  FinalizeCallSessionSchema,
  GenerateSummaryFromTranscriptSchema,
  MCPTool,
} from '../types/index.js';

export const MCP_TOOLS: MCPTool[] = [
  {
    name: 'create_or_get_call_session',
    description: 'Create a new call session or retrieve existing one for a meeting code',
    inputSchema: CreateOrGetCallSessionSchema,
  },
  {
    name: 'verify_spoken_join',
    description: 'Verify a caller by matching their spoken name and meeting code against invitees',
    inputSchema: VerifySpokenJoinSchema,
  },
  {
    name: 'get_meeting_context',
    description: 'Get meeting context including agenda, title, and agent hints',
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

export async function executeTool(toolName: string, input: any): Promise<any> {
  switch (toolName) {
    case 'create_or_get_call_session':
      return createOrGetCallSession(CreateOrGetCallSessionSchema.parse(input));
    case 'verify_spoken_join':
      return verifySpokenJoin(VerifySpokenJoinSchema.parse(input));
    case 'get_meeting_context':
      return getMeetingContext(GetMeetingContextSchema.parse(input));
    case 'persist_transcript':
      return persistTranscript(PersistTranscriptSchema.parse(input));
    case 'persist_summary':
      return persistSummary(PersistSummarySchema.parse(input));
    case 'finalize_call_session':
      return finalizeCallSession(FinalizeCallSessionSchema.parse(input));
    case 'generate_summary_from_transcript':
      return generateSummaryFromTranscript(GenerateSummaryFromTranscriptSchema.parse(input));
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}
