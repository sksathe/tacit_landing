import 'dotenv/config';
import express from 'express';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { MCP_TOOLS, executeTool } from './tools/index.js';
import { supabase } from './services/supabase.js';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { promises as fs } from 'node:fs';

const app = express();
const PORT = process.env.PORT || 3002;

// File logging: store tool call logs under mcp-agent/logs with timestamped filename
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const LOG_DIR = resolve(__dirname, '..', 'logs');
const LOG_FILE = resolve(
  LOG_DIR,
  `tool-calls-${new Date().toISOString().replace(/[:.]/g, '-')}Z.log`
);
let logsInitialized = false;

async function ensureLogDir(): Promise<void> {
  if (logsInitialized) return;
  try {
    await fs.mkdir(LOG_DIR, { recursive: true });
    logsInitialized = true;
  } catch (err) {
    console.warn(
      '⚠️ Failed to create log directory:',
      (err as any)?.message ?? String(err)
    );
  }
}

// CORS middleware for ElevenLabs (must be before routes)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());

// Store active SSE connections
const activeConnections = new Map<string, express.Response>();

/**
 * MCP spec: tools/call result must be { content: [{ type: "text", text: "..." }], isError: boolean }.
 * This is what clients (e.g. ElevenLabs) read to get the tool output for the agent.
 */
function toMCPToolResult(toolName: string, rawResult: Record<string, unknown>): { content: Array<{ type: 'text'; text: string }>; isError: boolean } {
  const msg = (rawResult.message_for_user ?? rawResult.say_to_user ?? rawResult.text ?? rawResult.message) as string | undefined;
  let text: string;
  let isError = false;

  if (toolName === 'verify_user_and_start_session') {
    const status = rawResult.status as string | undefined;
    isError = status === 'verification_failed' || status === 'too_early' || status === 'too_late' || rawResult.result === 'error';
    if (status === 'verified') {
      const ctx = rawResult.meeting_context as { title?: string; agenda?: string | null } | undefined;
      const hints = (rawResult.agent_hints as string[] | undefined) || [];
      const noAgenda = (rawResult.no_agenda_opening as string | null | undefined) || null;
      const parts = [
        msg,
        rawResult.call_session_id && `call_session_id: ${rawResult.call_session_id} (use this for persist_transcript and finalize_call_session).`,
        ctx?.agenda ? `Agenda: ${ctx.agenda}.` : (noAgenda ? `No agenda. Say to the user: "${noAgenda}"` : null),
        ...hints.slice(0, 4),
      ].filter(Boolean);
      text = parts.join(' ');
    } else {
      text = typeof msg === 'string' && msg.length > 0
        ? msg
        : (isError ? 'Verification failed. Please try again.' : 'Verification successful.');
    }
  } else if (toolName === 'get_meeting_context') {
    const meeting = rawResult.meeting as { title?: string; agenda?: string } | undefined;
    if (rawResult.result === 'guidance' || (!meeting && (rawResult.agent_instruction ?? rawResult.text))) {
      text = (rawResult.agent_instruction ?? rawResult.text ?? rawResult.message) as string;
    } else {
      const invitee = rawResult.invitee as { name?: string } | undefined;
      const hints = (rawResult.agent_hints as string[] | undefined) || [];
      const noAgendaOpening = (rawResult.no_agenda_opening as string | null | undefined) || null;
      text = [
        meeting?.title && `Meeting: ${meeting.title}.`,
        meeting?.agenda ? `Agenda: ${meeting.agenda}.` : (noAgendaOpening ? `No agenda. Say to the user: "${noAgendaOpening}"` : null),
        invitee?.name && `Invitee: ${invitee.name}.`,
        ...hints.slice(0, 4),
      ].filter(Boolean).join(' ');
      if (!text) text = JSON.stringify(rawResult);
    }
  } else if (toolName === 'persist_transcript') {
    text = 'Transcript saved successfully.';
  } else if (toolName === 'finalize_call_session') {
    text = (rawResult as any).success ? 'Call session ended.' : 'Failed to finalize call session.';
    isError = !(rawResult as any).success;
  } else if (toolName === 'persist_summary' || toolName === 'generate_summary_from_transcript') {
    text = 'Summary saved successfully.';
  } else {
    text = typeof msg === 'string' && msg.length > 0 ? msg : JSON.stringify(rawResult);
    if (typeof (rawResult as any).success === 'boolean') isError = !(rawResult as any).success;
  }

  return {
    content: [{ type: 'text' as const, text }],
    isError,
  };
}

/** Convert a tool to MCP list item with JSON Schema (avoids deep type instantiation from zod-to-json-schema). */
function toToolJsonSchema(tool: (typeof MCP_TOOLS)[number]): { name: string; description: string; inputSchema: Record<string, unknown> } {
  try {
    const raw = zodToJsonSchema(tool.inputSchema as never, {
      name: tool.name,
      target: 'openApi3',
    }) as Record<string, unknown>;
    const cleanedSchema: Record<string, unknown> = {
      type: raw.type || 'object',
      properties: raw.properties || {},
      required: raw.required || [],
    };
    if (raw.additionalProperties !== undefined) cleanedSchema.additionalProperties = raw.additionalProperties;
    return { name: tool.name, description: tool.description, inputSchema: cleanedSchema };
  } catch (err: unknown) {
    console.error(`❌ Failed to convert schema for ${tool.name}:`, err);
    return {
      name: tool.name,
      description: tool.description,
      inputSchema: { type: 'object', properties: {}, required: [] },
    };
  }
}

// Helper: log meeting + session context for every tool call
async function logToolContext(
  toolName: string,
  args: unknown,
  result: unknown,
): Promise<void> {
  try {
    const input = (args || {}) as Record<string, any>;
    const output = (result || {}) as Record<string, any>;

    const callSessionId =
      input.call_session_id ||
      output.call_session_id ||
      (output.meeting_context && (output.meeting_context as any).call_session_id) ||
      null;

    if (!callSessionId) {
      const logRecord = {
        timestamp: new Date().toISOString(),
        tool: toolName,
        call_session_id: null as string | null,
        meeting_id: null as string | null,
      };
      console.log('📝 Tool context:', logRecord);
      await ensureLogDir();
      await fs.appendFile(LOG_FILE, JSON.stringify(logRecord) + '\n');
      return;
    }

    const { data: callSession, error } = await supabase
      .from('call_sessions')
      .select('id, meeting_id')
      .eq('id', callSessionId)
      .maybeSingle();

    const meetingId = callSession?.meeting_id ?? null;

    if (error) {
      console.warn('⚠️ Failed to load call_session for logging:', {
        tool: toolName,
        call_session_id: callSessionId,
        error: error.message,
      });
    }

    const logRecord = {
      timestamp: new Date().toISOString(),
      tool: toolName,
      call_session_id: callSessionId,
      meeting_id: meetingId,
    };

    console.log('📝 Tool context:', logRecord);
    await ensureLogDir();
    await fs.appendFile(LOG_FILE, JSON.stringify(logRecord) + '\n');
  } catch (err) {
    console.warn('⚠️ Failed to log tool context:', { tool: toolName, error: (err as any)?.message ?? String(err) });
  }
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// List available tools (MCP protocol: tools/list)
app.get('/tools', (req, res) => {
  res.json({
    tools: MCP_TOOLS.map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema._def,
    })),
  });
});

// Execute a tool (MCP protocol: tools/call) – response in MCP format so agents receive content[].text
app.post('/tools/call', async (req, res) => {
  try {
    const { name, arguments: args } = req.body;

    if (!name || !args) {
      res.status(400).json({ error: 'Missing tool name or arguments' });
      return;
    }

    const rawResult = await executeTool(name, args);
    await logToolContext(name, args, rawResult);
    const mcpResult = toMCPToolResult(name, rawResult as Record<string, unknown>);
    res.json({ result: mcpResult });
  } catch (error: any) {
    console.error('Tool execution error:', error);
    res.status(500).json({
      error: error.message || 'Tool execution failed',
      details: error instanceof Error ? error.stack : undefined,
    });
  }
});

// SSE endpoint for MCP streaming (ElevenLabs STREAMABLE_HTTP transport)
app.get('/mcp', (req, res) => {
  const sessionId = req.query.session_id as string || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Set SSE headers (required for streaming HTTP)
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Critical for nginx/proxies/ngrok
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Store connection
  activeConnections.set(sessionId, res);
  console.log(`✅ SSE connection established: ${sessionId}`);
  
  // Send initial connection message
  res.write(`event: connected\n`);
  res.write(`data: ${JSON.stringify({ sessionId, status: 'connected' })}\n\n`);
  
  // Handle client disconnect
  req.on('close', () => {
    console.log(`❌ SSE connection closed: ${sessionId}`);
    activeConnections.delete(sessionId);
    res.end();
  });
  
  // Keep connection alive with periodic ping
  const pingInterval = setInterval(() => {
    if (!activeConnections.has(sessionId)) {
      clearInterval(pingInterval);
      return;
    }
    try {
      res.write(`: ping\n\n`);
    } catch (e) {
      clearInterval(pingInterval);
      activeConnections.delete(sessionId);
    }
  }, 30000); // Every 30 seconds
});

// POST endpoint for sending messages to SSE stream
app.post('/mcp', async (req, res) => {
  try {
    // Log incoming request for debugging
    console.log('📥 POST /mcp request received:');
    console.log('  Headers:', JSON.stringify(req.headers, null, 2));
    console.log('  Body:', JSON.stringify(req.body, null, 2));
    
    const { session_id, method, params, jsonrpc, id } = req.body;
    
    // Handle JSON-RPC format (if ElevenLabs uses it)
    const requestMethod = method || req.body.method;
    const requestParams = params || req.body.params || {};
    const requestId = id !== undefined ? id : req.body.id;
    
    // Handle MCP protocol initialization
    if (requestMethod === 'initialize') {
      const protocolVersion = requestParams.protocolVersion || '2025-03-26';
      
      const response = {
        protocolVersion,
        capabilities: {
          tools: {
            listChanged: false,
          },
        },
        serverInfo: {
          name: 'tacit-mcp-server',
          version: '1.0.0',
        },
        // Add instructions for the agent (flow + personality)
        instructions: `You are the Tacit voice agent for knowledge capture meetings.

PERSONALITY — How to act and speak:
- Warm and professional. Short, clear sentences. One idea per sentence.
- You are the facilitator; the caller is the expert. Listen more than you talk. Ask one question at a time.
- Say exactly what tools return: use the "say_to_user" or "message_for_user" text verbatim for verification success or failure. Never say "technical difficulties" or "I cannot verify" when the tool succeeded.
- If the caller goes off-topic, redirect gently: "That's useful. Let's make sure we cover [agenda item]—what's the key point there?"
- Keep greetings and closings brief. End with a short thank-you and goodbye.
- After any tool returns, respond immediately with a short reply. Do not stay silent for long.

FLOW:
1. Validate: Greet, ask for 4-digit meeting code, then full name. Call verify_user_and_start_session with both. Do not proceed until verification succeeds.
2. After verification success: The response already includes the agenda, agent_hints, and call_session_id. Do NOT call get_meeting_context. Say the welcome message from the tool, then start the meeting right away. Respond immediately—avoid long pauses.
3. Stick to the agenda: Use the agenda and hints from the verification response. Conduct the meeting; extract tacit knowledge.
4. End: When the call ends, call finalize_call_session with call_session_id, status ("completed" or "failed"), and raw_transcript containing the conversation (e.g. { messages: [...] }). The transcript is saved automatically when you pass raw_transcript to finalize_call_session. Optionally call persist_transcript during the call to save a mid-call snapshot.

RULES:
- Meeting code first, then name. Only then call verify_user_and_start_session.
- After verification success you already have agenda and call_session_id in the same response. Do not call get_meeting_context. Reply to the user right away.
- When ending the call, always call finalize_call_session with the call_session_id, status, and raw_transcript so the call transcript is saved.`,
      };
      
      console.log('✅ Initialize response:', response);
      
      return res.json({
        jsonrpc: '2.0',
        id: requestId,
        result: response,
      });
    }
    
    // Handle initialized notification (no response needed)
    // ElevenLabs uses 'notifications/initialized', MCP spec uses 'initialized'
    if (requestMethod === 'initialized' || requestMethod === 'notifications/initialized') {
      console.log('✅ Client initialized');
      // Notifications don't require a response, but we'll return empty result if id is present
      if (requestId !== undefined && requestId !== null) {
        return res.json({ jsonrpc: '2.0', id: requestId, result: {} });
      }
      // For true notifications (no id), return 200 with no body
      return res.status(200).end();
    }
    
    // If no session_id, fall back to regular JSON response (backward compatibility)
    if (!session_id) {
      if (requestMethod === 'tools/list' || requestMethod === 'mcp/tools/list') {
        // Convert Zod schemas to JSON Schema format using zod-to-json-schema
        const tools = MCP_TOOLS.map(tool => toToolJsonSchema(tool));
        
        const response = { 
          tools,
          // Add prompt/instructions to guide the agent
          prompt: `You are the Tacit voice agent. PERSONALITY: Warm and professional. Short, clear sentences. Say tool messages (say_to_user/message_for_user) exactly—never "technical difficulties" when the tool succeeded. Listen more than you talk; one question at a time. Redirect off-topic gently; keep closings brief. After any tool returns, respond immediately; avoid long pauses. FLOW: (1) Ask meeting code then name → verify_user_and_start_session. (2) Verification success response already has agenda and call_session_id—do NOT call get_meeting_context; say the welcome and start the meeting right away. (3) Conduct meeting, extract knowledge. (4) When the call ends, call finalize_call_session with call_session_id, status, and raw_transcript (the conversation transcript) so the transcript is saved automatically.`
        };
        
        console.log('✅ Tools list response:', { toolCount: tools.length });
        console.log('📤 Tools list:', JSON.stringify(response, null, 2));
        
        // JSON-RPC response format - MCP protocol expects { tools: [...] } directly in result
        if (jsonrpc && requestId !== undefined) {
          return res.json({
            jsonrpc: '2.0',
            id: requestId,
            result: response, // { tools: [...], prompt: "..." }
          });
        }
        
        return res.json(response);
      }

      if (requestMethod === 'tools/call' || requestMethod === 'mcp/tools/call') {
        // Try multiple possible formats
        const toolName = requestParams.name || requestParams.tool_name || req.body.name;
        let toolArgs = requestParams.arguments || requestParams.args || req.body.arguments || req.body.args;
        
        console.log('🔧 Tool call:', { toolName, toolArgs });
        
        if (!toolName) {
          const error = { error: 'Missing tool name', received: { method: requestMethod, params: requestParams } };
          console.error('❌', error);
          
          if (jsonrpc && requestId !== undefined) {
            return res.status(400).json({
              jsonrpc: '2.0',
              id: requestId,
              error: { code: -32602, message: 'Missing tool name', data: error },
            });
          }
          
          return res.status(400).json(error);
        }
        
        // Allow empty arguments - Zod validation will handle missing required fields
        // Some tools might be called with empty args initially (e.g., before user provides input)
        if (!toolArgs || (typeof toolArgs === 'object' && Object.keys(toolArgs).length === 0)) {
          toolArgs = {};
        }
        
        // Log what we're about to execute
        console.log('🔧 Executing tool:', toolName);
        console.log('📥 Tool arguments:', JSON.stringify(toolArgs, null, 2));

        try {
          const result = await executeTool(toolName, toolArgs);
          console.log('✅ Tool executed successfully:', toolName);
          console.log('📤 Tool result:', JSON.stringify(result, null, 2));
          await logToolContext(toolName, toolArgs, result);
          
          // For verify_user_and_start_session, ensure explicit success indicators
          // Also add ElevenLabs-friendly format
          if (toolName === 'verify_user_and_start_session') {
            if (result.status === 'verified') {
              // Ensure all success indicators are present
              result.verified = true;
              result.success = true;
              result.verification_successful = true;
              // Ensure say_to_user matches message_for_user
              if (!result.say_to_user) {
                result.say_to_user = result.message_for_user;
              }
              // Ensure agent_instruction is present and clear
              if (!result.agent_instruction) {
                result.agent_instruction = `VERIFICATION SUCCESSFUL. Say this to the user: "${result.message_for_user}" Then proceed with the knowledge capture conversation.`;
              }
              
              // Add ElevenLabs-friendly fields at the top level
              result.result = 'success';
              result.text = result.say_to_user || result.message_for_user; // Simple text field ElevenLabs can read
              result.message = result.say_to_user || result.message_for_user; // Alternative field name
            } else if (result.status === 'verification_failed' || result.status === 'too_early' || result.status === 'too_late') {
              result.verified = false;
              result.success = false;
              result.verification_successful = false;
              if (!result.say_to_user) result.say_to_user = result.message_for_user;
              if (!result.agent_instruction) {
                result.agent_instruction = result.status === 'too_early'
                  ? `Caller is too early. Say this: "${result.message_for_user}"`
                  : result.status === 'too_late'
                    ? `Caller is too late. Say this: "${result.message_for_user}"`
                    : `VERIFICATION FAILED. Say this to the user: "${result.message_for_user}" Then ask them to try again.`;
              }
              result.result = 'error';
              result.text = result.say_to_user || result.message_for_user;
              result.message = result.say_to_user || result.message_for_user;
            }
          }
          
          // MCP spec: result must be { content: [{ type: "text", text: "..." }], isError } so the agent receives the output
          const mcpResult = toMCPToolResult(toolName, result as Record<string, unknown>);
          if (jsonrpc && requestId !== undefined) {
            return res.json({
              jsonrpc: '2.0',
              id: requestId,
              result: mcpResult,
            });
          }
          return res.json({ result: mcpResult });
        } catch (error: any) {
          console.error('❌ Tool execution failed:', error);
          
          // Format Zod validation errors for better readability
          let errorMessage = error.message || 'Tool execution failed';
          let errorCode = -32603; // Internal error
          
          if (error.name === 'ZodError' && error.issues) {
            const missingFields = error.issues
              .filter((issue: any) => issue.code === 'invalid_type' && issue.received === 'undefined')
              .map((issue: any) => issue.path.join('.'));
            
            if (missingFields.length > 0) {
              errorMessage = `Missing required parameters: ${missingFields.join(', ')}. Please collect these values from the user before calling this tool.`;
              errorCode = -32602; // Invalid params
            } else {
              // Format other Zod errors
              const errors = error.issues.map((issue: any) => 
                `${issue.path.join('.')}: ${issue.message}`
              ).join('; ');
              errorMessage = `Validation error: ${errors}`;
              errorCode = -32602; // Invalid params
            }
          }
          
          console.error('Error message:', errorMessage);
          
          // For verify_user_and_start_session with missing params, provide helpful response
          if (toolName === 'verify_user_and_start_session' && errorMessage.includes('Missing required parameters')) {
            // Return a structured response that guides the agent instead of an error
            const guidanceResponse = {
              result: 'error',
              error: 'missing_parameters',
              message: 'You must collect the meeting code and name from the user before calling this tool.',
              text: 'Please collect the meeting code and name from the user first.',
              agent_instruction: 'DO NOT call verify_user_and_start_session yet. First ask the user for their 4-digit meeting code, then ask for their full name. Only call this tool when you have both values.',
            };
            const mcpGuidance = toMCPToolResult('verify_user_and_start_session', guidanceResponse);
            if (jsonrpc && requestId !== undefined) {
              return res.json({ jsonrpc: '2.0', id: requestId, result: mcpGuidance });
            }
            return res.json({ result: mcpGuidance });
          }

          // For get_meeting_context called without call_session_id, return guidance so the agent can recover
          if (toolName === 'get_meeting_context' && errorMessage.includes('call_session_id')) {
            const guidanceResponse = {
              result: 'guidance',
              error: 'missing_call_session_id',
              message: 'get_meeting_context requires call_session_id from verify_user_and_start_session.',
              text: 'Do NOT call get_meeting_context until after verification. First ask the user for their 4-digit meeting code and full name, then call verify_user_and_start_session with meeting_code and spoken_name. Use the call_session_id from that response when calling get_meeting_context.',
              agent_instruction: 'You have not verified the user yet. Ask: "Hello! Welcome to Tacit. To get started, please tell me your 4-digit meeting code." Then ask for their full name. Call verify_user_and_start_session with those values. Only after it succeeds, call get_meeting_context with the call_session_id from the verification response.',
            };
            const mcpGuidance = toMCPToolResult('get_meeting_context', guidanceResponse);
            if (jsonrpc && requestId !== undefined) {
              return res.json({ jsonrpc: '2.0', id: requestId, result: mcpGuidance });
            }
            return res.json({ result: mcpGuidance });
          }
          
          if (jsonrpc && requestId !== undefined) {
            return res.status(400).json({
              jsonrpc: '2.0',
              id: requestId,
              error: { 
                code: errorCode,
                message: errorMessage,
              },
            });
          }
          
          return res.status(400).json({ error: errorMessage });
        }
      }

      const error = { 
        error: `Unknown method: ${requestMethod}`, 
        received: req.body,
        supported_methods: ['initialize', 'initialized', 'notifications/initialized', 'tools/list', 'tools/call', 'mcp/tools/list', 'mcp/tools/call'],
      };
      console.error('❌', error);
      
      if (jsonrpc && requestId !== undefined) {
        return res.status(400).json({
          jsonrpc: '2.0',
          id: requestId,
          error: { code: -32601, message: `Unknown method: ${requestMethod}`, data: error },
        });
      }
      
      return res.status(400).json(error);
    }
    
    // SSE mode: optional SSE broadcast; always return result in POST body so client gets tools/results
    const sseConnection = activeConnections.get(session_id);
    
    let sseToolName: string | undefined;
    try {
      if (requestMethod === 'tools/list' || requestMethod === 'mcp/tools/list') {
        const tools = MCP_TOOLS.map(tool => toToolJsonSchema(tool));
        const jsonRpcResponse = {
          jsonrpc: '2.0',
          id: requestId,
          result: { tools },
        };
        if (sseConnection) {
          sseConnection.write(`event: response\n`);
          sseConnection.write(`data: ${JSON.stringify(jsonRpcResponse)}\n\n`);
        }
        console.log('✅ Tools list response (toolCount=%d)', tools.length);
        return res.json(jsonRpcResponse);
      }

      if (requestMethod === 'tools/call' || requestMethod === 'mcp/tools/call') {
        sseToolName = requestParams.name || requestParams.tool_name || req.body.name;
        let toolArgs = requestParams.arguments || requestParams.args || requestParams;
        
        console.log('🔧 SSE Tool call:', { session_id, toolName: sseToolName, toolArgs });
        
        if (!sseToolName) {
          const error = { error: 'Missing tool name', received: { method: requestMethod, params: requestParams } };
          console.error('❌', error);
          if (sseConnection) {
            sseConnection.write(`event: error\n`);
            sseConnection.write(`data: ${JSON.stringify({ ...error, id: requestId })}\n\n`);
          }
          return res.status(400).json(error);
        }
        
        // Allow empty arguments - Zod validation will handle missing required fields
        if (!toolArgs || (typeof toolArgs === 'object' && Object.keys(toolArgs).length === 0)) {
          toolArgs = {};
        }

        // Execute tool and send result via SSE
        let result = await executeTool(sseToolName, toolArgs);
        console.log('✅ SSE Tool executed successfully:', sseToolName);
        console.log('📤 SSE Tool result (before processing):', JSON.stringify(result, null, 2));
        await logToolContext(sseToolName, toolArgs, result);
        
        // Apply same success indicators as non-SSE mode
        if (sseToolName === 'verify_user_and_start_session') {
          if (result.status === 'verified') {
            // Ensure all success indicators are present
            result.verified = true;
            result.success = true;
            result.verification_successful = true;
            // Ensure say_to_user matches message_for_user
            if (!result.say_to_user) {
              result.say_to_user = result.message_for_user;
            }
            // Ensure agent_instruction is present and clear
            if (!result.agent_instruction) {
              result.agent_instruction = `VERIFICATION SUCCESSFUL. Say this to the user: "${result.message_for_user}" Then proceed with the knowledge capture conversation.`;
            }
            // Add ElevenLabs-friendly fields at the top level
            result.result = 'success';
            result.text = result.say_to_user || result.message_for_user;
            result.message = result.say_to_user || result.message_for_user;
          } else if (result.status === 'verification_failed' || result.status === 'too_early' || result.status === 'too_late') {
            result.verified = false;
            result.success = false;
            result.verification_successful = false;
            if (!result.say_to_user) result.say_to_user = result.message_for_user;
            if (!result.agent_instruction) {
              result.agent_instruction = result.status === 'too_early'
                ? `Caller is too early. Say this: "${result.message_for_user}"`
                : result.status === 'too_late'
                  ? `Caller is too late. Say this: "${result.message_for_user}"`
                  : `VERIFICATION FAILED. Say this to the user: "${result.message_for_user}" Then ask them to try again.`;
            }
            result.result = 'error';
            result.text = result.say_to_user || result.message_for_user;
            result.message = result.say_to_user || result.message_for_user;
          }
        }
        
        console.log('📤 Tool result (after processing):', JSON.stringify(result, null, 2));
        
        const mcpResult = toMCPToolResult(sseToolName, result as Record<string, unknown>);
        const jsonRpcResponse = {
          jsonrpc: '2.0',
          id: requestId,
          result: mcpResult,
        };
        if (sseConnection) {
          sseConnection.write(`event: response\n`);
          sseConnection.write(`data: ${JSON.stringify(jsonRpcResponse)}\n\n`);
        }
        return res.json(jsonRpcResponse);
      }

      const error = { 
        error: `Unknown method: ${requestMethod}`, 
        received: req.body,
        supported_methods: ['initialize', 'initialized', 'notifications/initialized', 'tools/list', 'tools/call', 'mcp/tools/list', 'mcp/tools/call'],
      };
      console.error('❌', error);
      if (sseConnection) {
        sseConnection.write(`event: error\n`);
        sseConnection.write(`data: ${JSON.stringify({ ...error, id: requestId })}\n\n`);
      }
      return res.status(400).json(error);
    } catch (error: any) {
      console.error('❌ Tool execution error:', error);
      
      // Format Zod validation errors for better readability
      let errorMessage = error.message || 'Tool execution failed';
      let errorCode = -32603; // Internal error
      
      if (error.name === 'ZodError' && error.issues) {
        const missingFields = error.issues
          .filter((issue: any) => issue.code === 'invalid_type' && issue.received === 'undefined')
          .map((issue: any) => issue.path.join('.'));
        
        if (missingFields.length > 0) {
          errorMessage = `Missing required parameters: ${missingFields.join(', ')}. Please collect these values from the user before calling this tool.`;
          errorCode = -32602; // Invalid params
          
          // For verify_user_and_start_session with missing params, provide helpful response
          if (sseToolName === 'verify_user_and_start_session') {
            const guidanceResponse = {
              result: 'error',
              error: 'missing_parameters',
              message: 'You must collect the meeting code and name from the user before calling this tool.',
              text: 'Please collect the meeting code and name from the user first.',
              agent_instruction: 'DO NOT call verify_user_and_start_session yet. First ask the user for their 4-digit meeting code, then ask for their full name. Only call this tool when you have both values.',
            };
            const mcpGuidance = toMCPToolResult('verify_user_and_start_session', guidanceResponse);
            const guidanceRpcResponse = { jsonrpc: '2.0', id: requestId, result: mcpGuidance };
            if (sseConnection) {
              sseConnection.write(`event: response\n`);
              sseConnection.write(`data: ${JSON.stringify(guidanceRpcResponse)}\n\n`);
            }
            return res.json(guidanceRpcResponse);
          }
        } else {
          const errors = error.issues.map((issue: any) => 
            `${issue.path.join('.')}: ${issue.message}`
          ).join('; ');
          errorMessage = `Validation error: ${errors}`;
          errorCode = -32602; // Invalid params
        }
      }

      // get_meeting_context called without call_session_id: return guidance so the agent can recover
      if (sseToolName === 'get_meeting_context' && errorMessage.includes('call_session_id')) {
        const guidanceResponse = {
          result: 'guidance',
          error: 'missing_call_session_id',
          message: 'get_meeting_context requires call_session_id from verify_user_and_start_session.',
          text: 'Do NOT call get_meeting_context until after verification. First ask the user for their 4-digit meeting code and full name, then call verify_user_and_start_session with meeting_code and spoken_name. Use the call_session_id from that response when calling get_meeting_context.',
          agent_instruction: 'You have not verified the user yet. Ask: "Hello! Welcome to Tacit. To get started, please tell me your 4-digit meeting code." Then ask for their full name. Call verify_user_and_start_session with those values. Only after it succeeds, call get_meeting_context with the call_session_id from the verification response.',
        };
        const mcpGuidance = toMCPToolResult('get_meeting_context', guidanceResponse);
        const guidanceRpcResponse = { jsonrpc: '2.0', id: requestId, result: mcpGuidance };
        if (sseConnection) {
          sseConnection.write(`event: response\n`);
          sseConnection.write(`data: ${JSON.stringify(guidanceRpcResponse)}\n\n`);
        }
        return res.json(guidanceRpcResponse);
      }
      
      const errorRpcResponse = {
        jsonrpc: '2.0',
        id: requestId,
        error: { code: errorCode, message: errorMessage },
      };
      if (sseConnection) {
        sseConnection.write(`event: error\n`);
        sseConnection.write(`data: ${JSON.stringify(errorRpcResponse)}\n\n`);
      }
      return res.status(400).json(errorRpcResponse);
    }
  } catch (error: any) {
    console.error('MCP protocol error:', error);
    res.status(500).json({
      error: error.message || 'MCP protocol error',
    });
  }
});

app.listen(PORT, () => {
  console.log(`MCP Agent Server running on port ${PORT}`);
  console.log(`Available tools: ${MCP_TOOLS.map(t => t.name).join(', ')}`);
});
