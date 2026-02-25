# ElevenLabs MCP Server Setup Guide

## Overview

Your MCP server is running on port **3002** and exposes tools that ElevenLabs can call during voice conversations. This guide walks you through connecting it to ElevenLabs.

---

## Prerequisites

1. ✅ MCP server is running (`cd mcp-agent && npm run dev`)
2. ✅ Server is accessible (localhost for dev, or deployed URL for production)
3. ✅ ElevenLabs account with API access
4. ✅ Twilio number configured (you mentioned you'll add this externally)

---

## Agent Instructions & Behavior

The MCP server now includes explicit instructions for the agent on how to handle calls:

**When a call starts, the agent will:**
1. Greet: "Hello! Welcome to Tacit. To get started, I'll need your 4-digit meeting code."
2. Wait for meeting code (user may say "1234" or "one two three four")
3. Ask: "Thank you. Now please tell me your full name."
4. Wait for name
5. Call `verify_user_and_start_session` with both values

**Important:** The agent is configured to ALWAYS ask for meeting code first, then name, before proceeding with the conversation.

These instructions are provided in:
- The `initialize` response (server capabilities)
- The `tools/list` response (as a `prompt` field)
- Enhanced tool descriptions with explicit action steps
- Error messages that guide the agent when parameters are missing

---

## Step-by-Step Setup

### Step 1: Start Your MCP Server

```bash
cd mcp-agent
npm run dev
```

You should see:
```
MCP Agent Server running on port 3002
Available tools: create_or_get_call_session, verify_spoken_join, get_meeting_context, persist_transcript, persist_summary, finalize_call_session, generate_summary_from_transcript
```

**Test the server:**
```bash
# Health check (GET)
curl http://localhost:3002/health

# List tools via REST endpoint (GET)
curl http://localhost:3002/tools

# Test SSE endpoint (GET) - ElevenLabs uses this for streaming
curl -N http://localhost:3002/mcp?session_id=test123
# You should see: event: connected\ndata: {"sessionId":"test123","status":"connected"}\n\n

# List tools via MCP protocol (POST) - Backward compatibility
curl -X POST http://localhost:3002/mcp \
  -H "Content-Type: application/json" \
  -d '{"method": "tools/list"}'

# Test SSE with POST (for ElevenLabs)
# First, establish SSE connection in one terminal:
curl -N http://localhost:3002/mcp?session_id=test123

# Then in another terminal, send a POST request:
curl -X POST http://localhost:3002/mcp \
  -H "Content-Type: application/json" \
  -d '{"session_id": "test123", "method": "tools/list"}'
```

---

### Step 2: Make Server Accessible to ElevenLabs

#### For Development (Local Testing):
- Use **ngrok** or similar tunnel service to expose your localhost
- **ngrok setup:**
  ```bash
  # Install ngrok: https://ngrok.com/download
  ngrok http 3002
  ```
- Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)

#### For Production:
- Deploy MCP server to a public URL (e.g., Railway, Render, AWS, etc.)
- Ensure it's accessible via HTTPS
- Example: `https://mcp-agent.yourdomain.com`

---

### Step 3: Configure ElevenLabs Dashboard

1. **Log into ElevenLabs Dashboard**
   - Go to your ElevenLabs project/agent settings

2. **Find MCP/API Integration Settings**
   - Look for "MCP Server", "Custom Tools", "API Integration", or "External Functions"
   - This might be under "Agent Settings" → "Tools" or "Integrations"

3. **Enter MCP Endpoint URL**
   - **Development:** `https://your-ngrok-url.ngrok.io/mcp`
   - **Production:** `https://your-domain.com/mcp`
   
   **Important:** 
   - Use the `/mcp` endpoint (not `/tools`)
   - ElevenLabs uses **STREAMABLE_HTTP** transport (Server-Sent Events/SSE)
   - The server supports both GET (SSE) and POST endpoints
   - ElevenLabs will automatically establish an SSE connection via GET `/mcp`

4. **Test Connection**
   - ElevenLabs should discover your tools automatically
   - You should see all 7 tools listed:
     - `create_or_get_call_session`
     - `verify_spoken_join`
     - `get_meeting_context`
     - `persist_transcript`
     - `persist_summary`
     - `finalize_call_session`
     - `generate_summary_from_transcript`

---

### Step 4: Configure Twilio (External Setup)

As you mentioned, you'll configure Twilio externally in ElevenLabs:

1. **In ElevenLabs Dashboard:**
   - Add your Twilio phone number
   - Configure call routing to your agent
   - Set up webhook/call handling

2. **Call Flow:**
   - User calls Twilio number → Twilio routes to ElevenLabs → ElevenLabs uses MCP tools

---

## MCP Protocol Endpoints

Your server exposes these endpoints:

### 1. Health Check
```
GET http://your-server:3002/health
```
Returns: `{ status: 'ok', timestamp: '...' }`

### 2. List Tools (REST)
```
GET http://your-server:3002/tools
```
Returns: List of all available tools with schemas

### 3. MCP Protocol Endpoint (ElevenLabs uses this)
```
POST http://your-server:3002/mcp
Content-Type: application/json

Body:
{
  "method": "tools/list",  // or "tools/call"
  "params": { ... }
}
```

### 4. Direct Tool Call (Alternative)
```
POST http://your-server:3002/tools/call
Content-Type: application/json

Body:
{
  "name": "verify_spoken_join",
  "arguments": { ... }
}
```

---

## Expected Call Flow

1. **Call Starts:**
   - User calls Twilio number
   - ElevenLabs receives call
   - ElevenLabs calls: `create_or_get_call_session` with meeting code

2. **Verification:**
   - Agent asks: "Say your name and meeting code"
   - ElevenLabs calls: `verify_spoken_join` with spoken name + code
   - Returns meeting context if verified

3. **During Call:**
   - Agent uses: `get_meeting_context` to get agenda
   - Agent conducts conversation based on context

4. **Post-Call:**
   - ElevenLabs calls: `persist_transcript` to save transcript
   - ElevenLabs calls: `generate_summary_from_transcript` (or `persist_summary`)
   - ElevenLabs calls: `finalize_call_session` to mark complete

---

## Testing Your MCP Server

### Test Tool Discovery:

**Option 1: REST endpoint (GET)**
```bash
curl http://localhost:3002/tools
```

**Option 2: MCP protocol (POST) - What ElevenLabs uses**
```bash
curl -X POST http://localhost:3002/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "method": "tools/list"
  }'
```

**Note:** `/mcp` is a POST endpoint only. Use GET for `/tools` or `/health`.

### Test Tool Execution:
```bash
curl -X POST http://localhost:3002/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "method": "tools/call",
    "params": {
      "name": "create_or_get_call_session",
      "arguments": {
        "meeting_code": "test-123",
        "spoken_name": "Test User",
        "caller_phone": "+1234567890",
        "elevenlabs_conversation_id": "test_conv",
        "now_iso": "2024-01-01T12:00:00Z",
        "idempotency_key": "test-key-1"
      }
    }
  }'
```

---

## Environment Variables Required

Make sure `mcp-agent/.env` has:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional (for LLM summaries)
OPENAI_API_KEY=sk-...  # or ANTHROPIC_API_KEY
LLM_PROVIDER=openai  # or anthropic
LLM_MODEL=gpt-4o-mini
```

---

## Troubleshooting

### Agent not calling any tools (including verify_user_and_start_session)

If the agent never calls any MCP tools:

1. **Response in POST body (fixed in server):**  
   The MCP server now returns the **tools list** and **tool results** in the **POST response body** (not only over SSE). ElevenLabs expects the result in the HTTP response to its request. Restart the MCP server so it uses the latest code.

2. **ElevenLabs dashboard – MCP URL:**
   - Use the base URL that reaches your MCP server, e.g. `https://your-ngrok-url.ngrok.io/mcp` (with `/mcp`).
   - Test from the same network ElevenLabs uses:  
     `curl -X POST https://your-url/mcp -H "Content-Type: application/json" -d '{"method":"tools/list"}'`  
     You should get a JSON body with a `result.tools` array, not `{ "status": "sent" }`.

3. **Tool approval / execution mode:**
   - In ElevenLabs, find MCP or “Tools” settings for your agent.
   - If there is a “Tool approval” or “Execution mode” option, set it so tools can run without manual approval (e.g. “Auto approve” or “Execute automatically”). If every tool requires approval, the agent may not call them in a voice flow.

4. **System prompt / instructions:**
   - In the agent’s system prompt (or “Initial instructions”), explicitly tell it to use tools, for example:
     - “When you have the meeting code and the user’s full name, you MUST call the verify_user_and_start_session tool with meeting_code and spoken_name.”
     - “You have access to MCP tools. Use them to verify the user and run the meeting flow.”
   - Use the prompt from the “Agent Not Asking for Meeting Code and Name” section below so the agent knows to call `verify_user_and_start_session` after collecting code and name.

5. **Check server logs:**
   - When a call runs, you should see `POST /mcp` with `method: "initialize"`, then `method: "tools/list"`, and later `method: "tools/call"`.
   - If you see `tools/list` but never `tools/call`, the agent is not invoking tools (dashboard/config or prompt).
   - If you don’t see `tools/list`, ElevenLabs is not getting the tool list (URL, network, or discovery flow).

### "Unexpected ExceptionGroup occurred while connecting to MCP server" / "STREAMABLE_HTTP transport" Error

This error means ElevenLabs is trying to use Server-Sent Events (SSE) but can't establish the connection. Common causes:

1. **ngrok Buffering Issue:**
   - ngrok may buffer SSE streams by default
   - **Solution:** The server already includes `X-Accel-Buffering: no` header
   - **Alternative:** Use ngrok with request header forwarding:
     ```bash
     ngrok http 3002
     ```
   - Check ngrok web interface (http://127.0.0.1:4040) to see if requests are reaching your server

2. **SSE Connection Not Established:**
   - ElevenLabs needs to connect via `GET /mcp` first to establish SSE stream
   - Check server logs for: `✅ SSE connection established: session_...`
   - If you don't see this, ElevenLabs isn't connecting properly

3. **Test SSE Manually:**
   ```bash
   # Test SSE endpoint (should stream continuously):
   curl -N https://your-ngrok-url.ngrok.io/mcp?session_id=test123
   
   # You should see:
   # event: connected
   # data: {"sessionId":"test123","status":"connected"}
   # 
   # (Connection stays open, sends ping every 30 seconds)
   ```

4. **Check Server Logs:**
   - Look for `✅ SSE connection established` messages
   - Look for `❌ SSE connection closed` messages
   - Check for any error messages

### ElevenLabs can't connect:
- ✅ Check server is running: `curl http://localhost:3002/health`
- ✅ Check firewall/network allows connections
- ✅ Verify URL is correct (include `/mcp` endpoint)
- ✅ Check server logs for errors
- ✅ Test SSE endpoint manually with `curl -N`

### Tools not discovered:
- ✅ Test `/tools` endpoint manually
- ✅ Check MCP endpoint returns correct format
- ✅ Verify tool schemas are valid JSON

### Tool calls failing:
- ✅ Check server logs for error details

### Agent Not Asking for Meeting Code and Name:

If the agent isn't automatically asking for meeting code and name when a call starts:

1. **Check ElevenLabs Agent Configuration:**
   - In ElevenLabs, go to your agent's settings
   - Look for "System Prompt" or "Initial Instructions" field
   - Add this prompt:
     ```
     You are a voice assistant for Tacit knowledge capture meetings.

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
     - After successful verification, you'll receive the meeting agenda and can begin the knowledge capture conversation
     ```

2. **Verify MCP Server Instructions:**
   - The MCP server now includes instructions in the `initialize` response
   - Check server logs to confirm the `initialize` response includes the `instructions` field
   - The `tools/list` response also includes a `prompt` field with these instructions

3. **Test the Flow:**
   - Make a test call to your Twilio number
   - The agent should immediately ask for the meeting code
   - If it doesn't, check the ElevenLabs agent logs to see what instructions it received
- ✅ Verify Supabase credentials are correct
- ✅ Check database has test data (meeting, invitee)
- ✅ Verify RLS policies allow service role access

### Common Errors:
- **"Connection refused"** → Server not running or wrong port
- **"404 Not Found"** → Wrong endpoint URL (should be `/mcp`)
- **"Invalid tool"** → Tool name mismatch or schema issue
- **"Database error"** → Check Supabase connection and RLS

---

## Production Deployment

### Option 1: Deploy to Cloud Platform

**Railway:**
```bash
railway init
railway up
railway domain
```

**Render:**
- Connect GitHub repo
- Set build command: `cd mcp-agent && npm install && npm run build`
- Set start command: `cd mcp-agent && npm start`
- Set PORT environment variable

**AWS/Google Cloud:**
- Deploy as containerized service
- Use load balancer for HTTPS
- Set environment variables

### Option 2: Use ngrok for Quick Testing

```bash
ngrok http 3002 --domain=your-custom-domain.ngrok.io
```

---

## Security Considerations

1. **IP Whitelisting:** Restrict access to ElevenLabs IPs only
2. **API Key:** Add optional API key authentication
3. **Rate Limiting:** Implement rate limiting for production
4. **HTTPS:** Always use HTTPS in production
5. **Monitoring:** Set up logging and error tracking

---

## Next Steps

1. ✅ Start MCP server locally
2. ✅ Test endpoints manually
3. ✅ Set up ngrok tunnel (for dev) or deploy (for prod)
4. ✅ Configure ElevenLabs with MCP endpoint URL
5. ✅ Test with a real call
6. ✅ Monitor server logs during calls

---

## Support

If you encounter issues:
1. Check server logs for detailed error messages
2. Test endpoints manually with curl
3. Verify database has test data
4. Check ElevenLabs dashboard for connection status
