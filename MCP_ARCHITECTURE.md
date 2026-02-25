# MCP Architecture & Agent Conversation Flow

## Overview

The Model Context Protocol (MCP) server acts as a bridge between ElevenLabs voice agents and your Tacit backend. It provides tools that the agent can call during voice conversations to manage meetings, verify users, and capture knowledge.

---

## How MCP Works

### 1. **Connection Flow**

```
ElevenLabs Agent → MCP Server (via ngrok) → Your Backend
```

1. **Initialization Handshake:**
   - ElevenLabs sends `initialize` request with protocol version
   - Server responds with capabilities and server info
   - ElevenLabs sends `notifications/initialized` to confirm

2. **Tool Discovery:**
   - ElevenLabs calls `tools/list` to discover available tools
   - Server returns list of 7 tools with their schemas
   - ElevenLabs stores these for use during conversations

3. **Tool Execution:**
   - During conversation, ElevenLabs calls `tools/call` with tool name and arguments
   - Server executes the tool and returns results
   - Agent uses results to guide conversation

### 2. **MCP Server Endpoints**

**Base URL:** `https://your-ngrok-url.ngrok.io/mcp`

**Protocol:** JSON-RPC 2.0 over HTTP POST

**Transport:** STREAMABLE_HTTP (Server-Sent Events for streaming)

**Endpoints:**
- `GET /mcp?session_id=...` - Establishes SSE connection
- `POST /mcp` - Handles all MCP protocol requests

---

## Available MCP Tools

### 1. `create_or_get_call_session`
**Purpose:** Creates or retrieves a call session when someone calls in

**When Called:** At the start of a call, when caller provides meeting code

**Input:**
```json
{
  "meeting_code": "1234",
  "caller_phone": "+1234567890",
  "elevenlabs_conversation_id": "conv_123",
  "now_iso": "2024-01-01T12:00:00Z",
  "idempotency_key": "unique-key-123"
}
```

**Output:**
```json
{
  "call_session_id": "uuid",
  "meeting_id": "uuid",
  "project_id": "uuid",
  "org_id": "uuid",
  "status": "in_progress"
}
```

**What It Does:**
- Normalizes meeting code (removes spaces/hyphens, lowercase)
- Finds meeting within time window (30 min before to 60 min after scheduled time)
- Creates new call session or returns existing one
- Links ElevenLabs conversation to your database

---

### 2. `verify_spoken_join`
**Purpose:** Verifies caller identity by matching spoken name and meeting code

**When Called:** After caller says their name and meeting code

**Input:**
```json
{
  "call_session_id": "uuid",
  "spoken_name": "John Doe",
  "meeting_code": "1234",
  "idempotency_key": "unique-key-456"
}
```

**Output (Success):**
```json
{
  "status": "verified",
  "attempts_left": 0,
  "message_for_user": "Welcome John Doe! Verification successful.",
  "meeting_context": {
    "title": "Payment Gateway Integration",
    "agenda": "Discuss API endpoints",
    "invitee_name": "John Doe",
    "project_name": "Payment System"
  }
}
```

**Output (Retry):**
```json
{
  "status": "retry",
  "attempts_left": 1,
  "message_for_user": "Name doesn't match our records. Please say your full name again. You have 1 attempt(s) left."
}
```

**What It Does:**
- Validates meeting code matches
- Uses fuzzy matching (pg_trgm) to match spoken name against invitees
- Allows up to 2 verification attempts
- Returns meeting context on success (title, agenda, project name)
- Can also match by phone number if provided

**Fuzzy Matching:**
- Uses PostgreSQL `pg_trgm` extension for similarity matching
- Handles variations like "John" vs "Johnny", "Bob" vs "Robert"
- Requires similarity > 0.5 to match
- Falls back to phone number matching if available

---

### 3. `get_meeting_context`
**Purpose:** Retrieves meeting details and agent conversation hints

**When Called:** During conversation when agent needs context

**Input:**
```json
{
  "call_session_id": "uuid"
}
```

**Output:**
```json
{
  "meeting": {
    "title": "Payment Gateway Integration",
    "agenda": "Discuss API endpoints and error handling",
    "scheduled_start_at": "2024-01-01T12:00:00Z",
    "scheduled_end_at": "2024-01-01T13:00:00Z",
    "meeting_code": "1234"
  },
  "invitee": {
    "name": "John Doe",
    "email": "john@example.com"
  },
  "agent_hints": [
    "Focus on: Discuss API endpoints and error handling",
    "Project context: Payment System",
    "Be conversational and help extract tacit knowledge",
    "Ask follow-up questions to clarify details"
  ]
}
```

**What It Does:**
- Retrieves meeting title, agenda, scheduled times
- Gets verified invitee information
- Generates agent hints to guide conversation:
  - Focus areas from agenda
  - Project context
  - Conversation style guidance
  - Instructions to extract tacit knowledge

---

### 4. `persist_transcript`
**Purpose:** Saves conversation transcript to database and storage

**When Called:** Periodically during call or at end of call

**Input:**
```json
{
  "call_session_id": "uuid",
  "raw_transcript": {
    "messages": [...],
    "metadata": {...}
  },
  "normalized_transcript": {
    "text": "Full conversation text...",
    "segments": [...]
  },
  "idempotency_key": "unique-key-789"
}
```

**Output:**
```json
{
  "transcript_id": "uuid",
  "storage_path": "transcripts/uuid/transcript.json"
}
```

**What It Does:**
- Saves transcript to `transcripts` table
- Uploads transcript.json to Supabase Storage
- Updates call session with transcript path
- Uses idempotency to prevent duplicates

---

### 5. `persist_summary`
**Purpose:** Saves meeting summary with key points and action items

**When Called:** After summary is generated (by agent or LLM)

**Input:**
```json
{
  "call_session_id": "uuid",
  "model": "gpt-4o-mini",
  "summary_text": "During this session, we discussed...",
  "key_points": [
    "API endpoint structure",
    "Error handling patterns"
  ],
  "action_items": [
    {"task": "Review API documentation", "assignee": "John"},
    {"task": "Update error handling", "assignee": "Jane"}
  ],
  "idempotency_key": "unique-key-101"
}
```

**Output:**
```json
{
  "summary_id": "uuid",
  "storage_path": "summaries/uuid/summary.json"
}
```

**What It Does:**
- Saves summary to `summaries` table
- Uploads summary.json to Supabase Storage
- Links summary to call session
- Stores key points and action items

---

### 6. `finalize_call_session`
**Purpose:** Marks call session as completed or failed

**When Called:** At end of call

**Input:**
```json
{
  "call_session_id": "uuid",
  "ended_at_iso": "2024-01-01T13:00:00Z",
  "duration_sec": 3600,
  "status": "completed",
  "idempotency_key": "unique-key-202"
}
```

**Output:**
```json
{
  "call_session_id": "uuid",
  "status": "completed"
}
```

**What It Does:**
- Updates call session status (completed/failed)
- Records end time and duration
- Closes the session

---

### 7. `generate_summary_from_transcript`
**Purpose:** Generates summary from transcript using LLM

**When Called:** After transcript is saved, to create summary

**Input:**
```json
{
  "call_session_id": "uuid",
  "transcript": {...},
  "model": "gpt-4o-mini",
  "idempotency_key": "unique-key-303"
}
```

**Output:**
```json
{
  "summary_text": "During this session...",
  "key_points": ["..."],
  "action_items": [...]
}
```

**What It Does:**
- Calls OpenAI or Anthropic API
- Generates structured summary
- Extracts key points and action items
- Returns formatted summary

---

## Agent Conversation Flow

### **Phase 1: Call Initiation**

1. **User calls Twilio number**
   - Twilio routes call to ElevenLabs agent
   - ElevenLabs agent answers

2. **Agent asks for meeting code**
   - "Hello! Please say your 4-digit meeting code."

3. **User says meeting code**
   - Agent calls `create_or_get_call_session` with code
   - Server validates code and creates call session
   - Returns call_session_id

4. **Agent asks for name**
   - "Thank you. Now please say your full name."

5. **User says name**
   - Agent calls `verify_spoken_join` with name + code
   - Server validates both and returns meeting context

### **Phase 2: Verification**

**If verification succeeds:**
- Agent receives meeting context (title, agenda, project)
- Agent says: "Welcome [Name]! I'm here to help capture your knowledge about [Meeting Title]."
- Conversation proceeds

**If verification fails:**
- Agent receives retry message with attempts left
- Agent says: "I'm sorry, that doesn't match. Please try again. You have [X] attempt(s) left."
- User can retry up to 2 times
- After 2 failures, session is marked as rejected

### **Phase 3: Knowledge Capture**

1. **Agent gets context**
   - Calls `get_meeting_context` to get:
     - Meeting title and agenda
     - Project context
     - Agent hints for conversation style

2. **Agent conducts conversation**
   - Uses context to guide discussion
   - Follows agent hints:
     - Focus on agenda topics
     - Be conversational
     - Extract tacit knowledge
     - Ask follow-up questions

3. **Agent saves transcript**
   - Periodically calls `persist_transcript`
   - Saves conversation to database and storage

### **Phase 4: Summary & Completion**

1. **After conversation ends:**
   - Agent calls `finalize_call_session` to mark complete
   - Optionally calls `generate_summary_from_transcript`
   - Or calls `persist_summary` if summary already generated

2. **Agent says goodbye:**
   - "Thank you for your time! Your knowledge has been captured."

---

## Context Provided to Agent

### **From `verify_spoken_join` (on successful verification):**
```json
{
  "meeting_context": {
    "title": "Payment Gateway Integration",
    "agenda": "Discuss API endpoints and error handling",
    "invitee_name": "John Doe",
    "project_name": "Payment System"
  }
}
```

### **From `get_meeting_context` (during conversation):**
```json
{
  "meeting": {
    "title": "Payment Gateway Integration",
    "agenda": "Discuss API endpoints and error handling",
    "scheduled_start_at": "2024-01-01T12:00:00Z",
    "scheduled_end_at": "2024-01-01T13:00:00Z",
    "meeting_code": "1234"
  },
  "invitee": {
    "name": "John Doe",
    "email": "john@example.com"
  },
  "agent_hints": [
    "Focus on: Discuss API endpoints and error handling",
    "Project context: Payment System",
    "Be conversational and help extract tacit knowledge",
    "Ask follow-up questions to clarify details"
  ]
}
```

### **How Agent Uses Context:**

1. **Meeting Title & Agenda:**
   - Agent knows what topics to discuss
   - Can reference specific agenda items
   - Guides conversation toward meeting goals

2. **Project Context:**
   - Agent understands the project domain
   - Can ask relevant technical questions
   - Provides context-aware follow-ups

3. **Invitee Information:**
   - Agent knows who they're talking to
   - Can personalize conversation
   - Uses correct name throughout

4. **Agent Hints:**
   - Conversation style guidance
   - Instructions to extract tacit knowledge
   - Reminders to ask follow-up questions

---

## Security & Idempotency

### **Idempotency Keys:**
- All write operations use idempotency keys
- Prevents duplicate database entries
- Ensures safe retries

### **Row Level Security (RLS):**
- MCP server uses service role (bypasses RLS)
- But validates org/project from meeting_id
- Never trusts agent inputs directly

### **Time Windows:**
- Meetings only accessible 30 min before to 60 min after scheduled time
- Prevents unauthorized access to old meetings

---

## Database Schema

**Key Tables:**
- `meetings` - Scheduled meetings with codes
- `meeting_invitees` - People invited to meetings
- `call_sessions` - Actual call instances
- `transcripts` - Conversation transcripts
- `summaries` - Meeting summaries
- `idempotency_keys` - Prevents duplicate operations

---

## Current Limitations & Future Enhancements

**Current:**
- Meeting codes are 4-digit numbers (changed from speakable codes)
- Verification allows 2 attempts
- Fuzzy name matching with 0.5 similarity threshold

**Future Enhancements:**
- Real-time transcript streaming
- Multi-language support
- Custom agent personalities per project
- Advanced knowledge extraction prompts
- Integration with external knowledge bases
