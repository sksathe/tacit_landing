import 'dotenv/config';
import express from 'express';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { MCP_TOOLS, executeTool } from './tools/index.js';

const app = express();
const PORT = process.env.PORT || 3002;

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

// Execute a tool (MCP protocol: tools/call)
app.post('/tools/call', async (req, res) => {
  try {
    const { name, arguments: args } = req.body;

    if (!name || !args) {
      res.status(400).json({ error: 'Missing tool name or arguments' });
      return;
    }

    const result = await executeTool(name, args);
    res.json({ result });
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
        // Add instructions for the agent
        instructions: `You are a voice assistant for Tacit knowledge capture meetings. 

CRITICAL FIRST STEPS WHEN A CALL STARTS:
1. Immediately greet the caller: "Hello! Welcome to Tacit. To get started, I'll need two things from you."
2. Ask for the meeting code: "First, please tell me your 4-digit meeting code."
3. Wait for the user to provide the meeting code (e.g., "1234" or "one two three four").
4. Ask for their name: "Thank you. Now, please tell me your full name."
5. Wait for the user to provide their name.
6. Once you have BOTH the meeting code and name, call the verify_user_and_start_session tool with both values.

IMPORTANT:
- Always ask for meeting code FIRST, then name SECOND
- Do NOT proceed with the conversation until verification succeeds
- If verification fails, ask the user to try again
- After successful verification, you'll receive the meeting agenda and can begin the knowledge capture conversation`,
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
        const tools = MCP_TOOLS.map(tool => {
          try {
            const zodSchema = tool.inputSchema;
            // Use zod-to-json-schema library for proper conversion
            const jsonSchema = zodToJsonSchema(zodSchema, {
              name: tool.name,
              target: 'openApi3', // Use OpenAPI 3 format for better compatibility
            });
            
            // Remove $schema and definitions if present (MCP doesn't need them)
            const cleanedSchema: any = {
              type: jsonSchema.type || 'object',
              properties: jsonSchema.properties || {},
              required: jsonSchema.required || [],
            };
            
            // Copy additional properties if needed
            if (jsonSchema.additionalProperties !== undefined) {
              cleanedSchema.additionalProperties = jsonSchema.additionalProperties;
            }
            
            console.log(`✅ Converted schema for ${tool.name}:`, JSON.stringify(cleanedSchema, null, 2));
            
            return {
              name: tool.name,
              description: tool.description,
              inputSchema: cleanedSchema,
            };
          } catch (error: any) {
            console.error(`❌ Failed to convert schema for ${tool.name}:`, error);
            console.error('Error stack:', error.stack);
            // Fallback to basic structure
            return {
              name: tool.name,
              description: tool.description,
              inputSchema: {
                type: 'object',
                properties: {},
                required: [],
              },
            };
          }
        });
        
        const response = { 
          tools,
          // Add prompt/instructions to guide the agent
          prompt: `You are a voice assistant for Tacit knowledge capture meetings.

CRITICAL FIRST STEPS WHEN A CALL STARTS:
1. Immediately greet: "Hello! Welcome to Tacit. To get started, I'll need your 4-digit meeting code."
2. Wait for the user to provide the meeting code (they may say "1234" or "one two three four")
3. After receiving the code, say: "Thank you. Now please tell me your full name."
4. Wait for the user to provide their name
5. Once you have BOTH the meeting_code and spoken_name, call verify_user_and_start_session with both values

IMPORTANT RULES:
- ALWAYS ask for meeting code FIRST, then name SECOND
- DO NOT proceed with conversation until verify_user_and_start_session succeeds
- If verification fails, politely ask the user to try again
- After successful verification, you'll receive the meeting agenda and can begin the knowledge capture conversation`
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
            } else if (result.status === 'verification_failed') {
              // Ensure all failure indicators are present
              result.verified = false;
              result.success = false;
              result.verification_successful = false;
              // Ensure say_to_user matches message_for_user
              if (!result.say_to_user) {
                result.say_to_user = result.message_for_user;
              }
              // Ensure agent_instruction is present and clear
              if (!result.agent_instruction) {
                result.agent_instruction = `VERIFICATION FAILED. Say this to the user: "${result.message_for_user}" Then ask them to try again.`;
              }
              
              // Add ElevenLabs-friendly fields
              result.result = 'error';
              result.text = result.say_to_user || result.message_for_user;
              result.message = result.say_to_user || result.message_for_user;
            }
          }
          
          // MCP protocol: result should be the tool output directly, not nested
          if (jsonrpc && requestId !== undefined) {
            return res.json({
              jsonrpc: '2.0',
              id: requestId,
              result: result, // Tool result directly, not wrapped
            });
          }
          
          return res.json({ result });
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
              guidance: 'First, greet the user and ask: "Hello! Welcome to Tacit. To get started, I\'ll need your 4-digit meeting code." Wait for their response, then ask: "Thank you. Now please tell me your full name." Once you have both values, call this tool again.',
              text: 'Please collect the meeting code and name from the user first.',
              agent_instruction: 'DO NOT call verify_user_and_start_session yet. First ask the user for their 4-digit meeting code, then ask for their full name. Only call this tool when you have both values.',
            };
            
            if (jsonrpc && requestId !== undefined) {
              return res.json({
                jsonrpc: '2.0',
                id: requestId,
                result: guidanceResponse, // Return guidance as result, not error
              });
            }
            
            return res.json(guidanceResponse);
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
    
    // SSE mode: send response through SSE stream
    const sseConnection = activeConnections.get(session_id);
    if (!sseConnection) {
      console.error(`❌ SSE session not found: ${session_id}`);
      console.log('Available sessions:', Array.from(activeConnections.keys()));
      return res.status(404).json({ error: 'SSE session not found. Connect to /mcp?session_id=... first' });
    }
    
    try {
      if (requestMethod === 'tools/list' || requestMethod === 'mcp/tools/list') {
        // Convert Zod schemas to JSON Schema format using zod-to-json-schema
        const tools = MCP_TOOLS.map(tool => {
          try {
            const zodSchema = tool.inputSchema;
            const jsonSchema = zodToJsonSchema(zodSchema, {
              name: tool.name,
              target: 'openApi3',
            });
            
            const cleanedSchema: any = {
              type: jsonSchema.type || 'object',
              properties: jsonSchema.properties || {},
              required: jsonSchema.required || [],
            };
            
            if (jsonSchema.additionalProperties !== undefined) {
              cleanedSchema.additionalProperties = jsonSchema.additionalProperties;
            }
            
            return {
              name: tool.name,
              description: tool.description,
              inputSchema: cleanedSchema,
            };
          } catch (error: any) {
            console.error(`❌ Failed to convert schema for ${tool.name}:`, error);
            return {
              name: tool.name,
              description: tool.description,
              inputSchema: {
                type: 'object',
                properties: {},
                required: [],
              },
            };
          }
        });
        
        const sseResponse = {
          jsonrpc: '2.0',
          id: requestId,
          result: { tools },
        };
        
        sseConnection.write(`event: response\n`);
        sseConnection.write(`data: ${JSON.stringify(sseResponse)}\n\n`);
        console.log('✅ SSE tools/list response sent');
        return res.json({ status: 'sent' });
      }

      if (requestMethod === 'tools/call' || requestMethod === 'mcp/tools/call') {
        // Try multiple possible formats
        const toolName = requestParams.name || requestParams.tool_name || req.body.name;
        let toolArgs = requestParams.arguments || requestParams.args || requestParams;
        
        console.log('🔧 SSE Tool call:', { session_id, toolName, toolArgs });
        
        if (!toolName) {
          const error = { error: 'Missing tool name', received: { method: requestMethod, params: requestParams } };
          console.error('❌', error);
          sseConnection.write(`event: error\n`);
          sseConnection.write(`data: ${JSON.stringify({ ...error, id: requestId })}\n\n`);
          return res.status(400).json(error);
        }
        
        // Allow empty arguments - Zod validation will handle missing required fields
        if (!toolArgs || (typeof toolArgs === 'object' && Object.keys(toolArgs).length === 0)) {
          toolArgs = {};
        }

        // Execute tool and send result via SSE
        let result = await executeTool(toolName, toolArgs);
        console.log('✅ SSE Tool executed successfully:', toolName);
        console.log('📤 SSE Tool result (before processing):', JSON.stringify(result, null, 2));
        
        // Apply same success indicators as non-SSE mode
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
            result.text = result.say_to_user || result.message_for_user;
            result.message = result.say_to_user || result.message_for_user;
          } else if (result.status === 'verification_failed') {
            // Ensure all failure indicators are present
            result.verified = false;
            result.success = false;
            result.verification_successful = false;
            // Ensure say_to_user matches message_for_user
            if (!result.say_to_user) {
              result.say_to_user = result.message_for_user;
            }
            // Ensure agent_instruction is present and clear
            if (!result.agent_instruction) {
              result.agent_instruction = `VERIFICATION FAILED. Say this to the user: "${result.message_for_user}" Then ask them to try again.`;
            }
            // Add ElevenLabs-friendly fields
            result.result = 'error';
            result.text = result.say_to_user || result.message_for_user;
            result.message = result.say_to_user || result.message_for_user;
          }
        }
        
        console.log('📤 SSE Tool result (after processing):', JSON.stringify(result, null, 2));
        
        // Send via SSE in JSON-RPC format
        const sseResponse = {
          jsonrpc: '2.0',
          id: requestId,
          result: result, // Tool result directly
        };
        
        sseConnection.write(`event: response\n`);
        sseConnection.write(`data: ${JSON.stringify(sseResponse)}\n\n`);
        console.log('✅ SSE response sent:', JSON.stringify(sseResponse, null, 2));
        return res.json({ status: 'sent' });
      }

      const error = { 
        error: `Unknown method: ${requestMethod}`, 
        received: req.body,
        supported_methods: ['initialize', 'initialized', 'notifications/initialized', 'tools/list', 'tools/call', 'mcp/tools/list', 'mcp/tools/call'],
      };
      console.error('❌', error);
      sseConnection.write(`event: error\n`);
      sseConnection.write(`data: ${JSON.stringify({ ...error, id: requestId })}\n\n`);
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
          if (toolName === 'verify_user_and_start_session') {
            const guidanceResponse = {
              result: 'error',
              error: 'missing_parameters',
              message: 'You must collect the meeting code and name from the user before calling this tool.',
              guidance: 'First, greet the user and ask: "Hello! Welcome to Tacit. To get started, I\'ll need your 4-digit meeting code." Wait for their response, then ask: "Thank you. Now please tell me your full name." Once you have both values, call this tool again.',
              text: 'Please collect the meeting code and name from the user first.',
              agent_instruction: 'DO NOT call verify_user_and_start_session yet. First ask the user for their 4-digit meeting code, then ask for their full name. Only call this tool when you have both values.',
            };
            
            const sseErrorResponse = {
              jsonrpc: '2.0',
              id: requestId,
              result: guidanceResponse, // Return guidance as result, not error
            };
            
            sseConnection.write(`event: response\n`);
            sseConnection.write(`data: ${JSON.stringify(sseErrorResponse)}\n\n`);
            console.log('✅ SSE guidance response sent:', JSON.stringify(sseErrorResponse, null, 2));
            return res.json({ status: 'sent' });
          }
        } else {
          const errors = error.issues.map((issue: any) => 
            `${issue.path.join('.')}: ${issue.message}`
          ).join('; ');
          errorMessage = `Validation error: ${errors}`;
          errorCode = -32602; // Invalid params
        }
      }
      
      // Send error via SSE in JSON-RPC format
      const sseErrorResponse = {
        jsonrpc: '2.0',
        id: requestId,
        error: {
          code: errorCode,
          message: errorMessage,
        },
      };
      
      sseConnection.write(`event: error\n`);
      sseConnection.write(`data: ${JSON.stringify(sseErrorResponse)}\n\n`);
      console.log('❌ SSE error response sent:', JSON.stringify(sseErrorResponse, null, 2));
      return res.status(400).json({ error: errorMessage });
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
