# ElevenLabs Agent Configuration Guide

## Problem

Even though the MCP tool returns `verified: true` and `status: "verified"`, the ElevenLabs agent says "technical difficulty verifying information" instead of the success message.

## Root Cause

ElevenLabs needs explicit configuration to understand how to interpret tool responses. The agent may be:
1. Not recognizing success indicators
2. Treating tool responses as errors
3. Not following the `agent_instruction` field

---

## Solution: Configure ElevenLabs Agent

### Step 1: Set System Prompt / Initial Instructions

In your ElevenLabs agent settings, add this system prompt:

```
You are a voice assistant for Tacit knowledge capture meetings.

CRITICAL: When calling MCP tools, you MUST interpret the response correctly:

1. If a tool returns verified=true OR status="verified" OR success=true:
   - This means SUCCESS
   - You MUST say the "say_to_user" or "message_for_user" field EXACTLY as provided
   - DO NOT say "cannot verify", "technical difficulties", or any error message
   - Then proceed with the conversation

2. If a tool returns verified=false OR status="verification_failed" OR success=false:
   - This means FAILURE
   - Say the "say_to_user" or "message_for_user" field EXACTLY as provided
   - Ask the user to try again

3. Always check the "agent_instruction" field - it tells you exactly what to say

4. Tool responses are JSON objects. Parse them correctly:
   - Look for "verified", "success", "status" fields
   - Look for "say_to_user" or "message_for_user" fields
   - Look for "agent_instruction" field

VERIFICATION FLOW:
1. Greet: "Hello! Welcome to Tacit. To get started, I'll need your 4-digit meeting code."
2. Wait for meeting code
3. Ask: "Thank you. Now please tell me your full name."
4. Wait for name
5. Call verify_user_and_start_session with meeting_code and spoken_name
6. Check the response:
   - If verified=true: Say the "say_to_user" field, then proceed with conversation
   - If verified=false: Say the "say_to_user" field, then ask to try again
```

### Step 2: Configure Tool Response Handling

In ElevenLabs agent settings, look for:

**Option A: Tool Response Handler / Post-Processing**
- Enable "Use tool response content"
- Set "Response format" to "JSON"
- Enable "Follow tool instructions"

**Option B: Custom Instructions for Tool Calls**
Add this instruction:
```
When a tool returns a response:
1. Parse the JSON response
2. Check for "verified", "success", or "status" fields
3. If verified=true or status="verified", treat as SUCCESS
4. Say the "say_to_user" or "message_for_user" field verbatim
5. Follow the "agent_instruction" field if present
```

### Step 3: Enable Verbose Tool Responses

If available, enable:
- "Show tool responses in conversation"
- "Use tool response text directly"
- "Follow tool instructions"

### Step 4: Test Tool Response Format

Some ElevenLabs configurations expect a specific format. Try adding this to your agent's tool handling:

```
Tool Response Format:
- Success: { "verified": true, "message": "..." }
- Failure: { "verified": false, "message": "..." }

Always check the "verified" field first.
If verified=true, say the "message" field.
```

---

## Alternative: Modify MCP Response Format

If ElevenLabs still doesn't work, we can modify the response format to be even more explicit. Let me know if you want me to:

1. Add a top-level `result` field with "success" or "error"
2. Simplify the response to only include essential fields
3. Add a `text` field that ElevenLabs can read directly

---

## ElevenLabs-Specific Settings to Check

### 1. Agent Behavior Settings
- **Response Style**: Set to "Follow instructions exactly"
- **Tool Handling**: Enable "Use tool responses"
- **Error Handling**: Disable "Auto-generate error messages"

### 2. MCP Integration Settings
- **Response Parsing**: Enable JSON parsing
- **Success Detection**: Configure to look for `verified: true`
- **Message Extraction**: Configure to use `say_to_user` or `message_for_user`

### 3. Conversation Settings
- **Tool Response Display**: Enable "Show tool responses"
- **Instruction Following**: Enable "Follow agent_instruction field"

---

## Testing

After configuring:

1. Make a test call
2. Provide meeting code: "7391"
3. Provide name: "John Doe"
4. Check what the agent says

**Expected behavior:**
- Agent should say: "Welcome John Doe! Verification successful. I'm here to help capture your knowledge about Q4 Sales Performance & Forecast Review. Let's get started."

**If it still says "technical difficulties":**
- Check ElevenLabs agent logs
- Verify the tool response is being received
- Check if there's a custom error handler overriding the response

---

## Contact ElevenLabs Support

If configuration doesn't work, contact ElevenLabs support with:

1. **Issue**: Agent says "technical difficulties" even when tool returns success
2. **Tool Response Format**: Show them the JSON response structure
3. **Expected Behavior**: Agent should say the `say_to_user` field
4. **Current Behavior**: Agent generates its own error message

**Example message to ElevenLabs:**
```
Hi, I'm using MCP tools with my ElevenLabs agent. When my tool returns:
{
  "verified": true,
  "success": true,
  "status": "verified",
  "say_to_user": "Welcome John Doe! Verification successful...",
  "agent_instruction": "VERIFICATION SUCCESSFUL. Say this to the user: ..."
}

The agent says "technical difficulty verifying information" instead of saying the "say_to_user" message.

How do I configure the agent to:
1. Recognize verified=true as success?
2. Say the "say_to_user" field verbatim?
3. Follow the "agent_instruction" field?
```

---

## Quick Fix: Response Format Updated

I've already updated the MCP response to include ElevenLabs-friendly fields:

**New fields added:**
- `result`: "success" or "error" (simple string)
- `text`: The message to say (simple text field)
- `message`: Alternative field name for the message

**Response now includes:**
```json
{
  "result": "success",
  "text": "Welcome John Doe! Verification successful...",
  "message": "Welcome John Doe! Verification successful...",
  "verified": true,
  "success": true,
  "status": "verified",
  "say_to_user": "Welcome John Doe! Verification successful...",
  "message_for_user": "Welcome John Doe! Verification successful...",
  "agent_instruction": "VERIFICATION SUCCESSFUL. Say this to the user: ..."
}
```

ElevenLabs can now read:
- `result` field to determine success/error
- `text` or `message` field to get what to say
- All the other fields for additional context

---

## Step-by-Step ElevenLabs Configuration

### Step 1: Go to Agent Settings

1. Log into ElevenLabs dashboard
2. Navigate to your agent
3. Go to **Settings** or **Configuration**

### Step 2: Find System Prompt / Instructions Field

Look for one of these fields:
- "System Prompt"
- "Initial Instructions"
- "Agent Instructions"
- "Behavior Instructions"
- "Custom Instructions"

### Step 3: Add This Prompt

Copy and paste this entire prompt:

```
You are a voice assistant for Tacit knowledge capture meetings.

IMPORTANT: When calling MCP tools, you MUST interpret responses correctly.

TOOL RESPONSE HANDLING:
1. Check the "result" field first:
   - If result="success" → This is SUCCESS, proceed
   - If result="error" → This is FAILURE, handle error

2. For SUCCESS (result="success"):
   - Say the "text" or "message" field EXACTLY as provided
   - DO NOT say "cannot verify", "technical difficulties", or any error message
   - Then proceed with the conversation

3. For FAILURE (result="error"):
   - Say the "text" or "message" field EXACTLY as provided
   - Ask the user to try again

4. Alternative success indicators:
   - If you see verified=true OR status="verified" → This is SUCCESS
   - If you see verified=false OR status="verification_failed" → This is FAILURE

5. Always check these fields in order:
   a. "result" field (success/error)
   b. "text" or "message" field (what to say)
   c. "agent_instruction" field (additional guidance)

VERIFICATION FLOW:
1. Greet: "Hello! Welcome to Tacit. To get started, I'll need your 4-digit meeting code."
2. Wait for meeting code
3. Ask: "Thank you. Now please tell me your full name."
4. Wait for name
5. Call verify_user_and_start_session with meeting_code and spoken_name
6. Check response:
   - If result="success" OR verified=true: Say the "text" field, then proceed
   - If result="error" OR verified=false: Say the "text" field, then ask to try again

CRITICAL RULE: Never say "technical difficulties" or "cannot verify" when result="success" or verified=true.
```

### Step 4: Configure Tool Response Handling

Look for these settings and enable them:

**Option A: Tool Response Handler**
- ✅ Enable "Use tool response content"
- ✅ Enable "Follow tool instructions"
- ✅ Set "Response format" to "JSON"

**Option B: Custom Tool Handler**
Add this code/instruction:
```javascript
// Pseudo-code for ElevenLabs
if (toolResponse.result === "success" || toolResponse.verified === true) {
  say(toolResponse.text || toolResponse.message);
  proceed();
} else {
  say(toolResponse.text || toolResponse.message);
  askToRetry();
}
```

### Step 5: Disable Auto Error Messages

Look for:
- "Auto-generate error messages" → **DISABLE**
- "Custom error handling" → **DISABLE**
- "Override tool responses" → **DISABLE**

### Step 6: Test

1. Save your agent configuration
2. Make a test call
3. Provide meeting code: "7391"
4. Provide name: "John Doe"
5. Check what agent says

**Expected:** "Welcome John Doe! Verification successful. I'm here to help capture your knowledge about Q4 Sales Performance & Forecast Review. Let's get started."

**If still wrong:** Check agent logs to see what response it received
