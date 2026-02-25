# AI Summary & Multiple Invitees Status

## 1. AI Summary Status

### Current State: ❌ **NOT Automatically Enabled**

The AI summary tool (`generate_summary_from_transcript`) exists but is **not automatically called**. Here's the situation:

**What Exists:**
- ✅ Tool is available: `generate_summary_from_transcript`
- ✅ LLM service supports OpenAI and Anthropic
- ✅ Can generate structured summaries with key points and action items

**What's Missing:**
- ❌ No automatic trigger after transcript is saved
- ❌ Agent must explicitly call the tool (not guaranteed)
- ❌ Requires LLM API keys to be configured

**To Enable AI Summary:**

1. **Configure LLM API Keys** (in `mcp-agent/.env`):
   ```env
   LLM_PROVIDER=openai  # or 'anthropic'
   LLM_MODEL=gpt-4o-mini      # or 'claude-3-opus-20240229'
   OPENAI_API_KEY=sk-... # or ANTHROPIC_API_KEY=sk-ant-...
   ```

2. **Current Behavior:**
   - Agent can call `generate_summary_from_transcript` manually
   - But nothing forces it to do so
   - Summary generation is optional

**Recommendation:** Add automatic summary generation after transcript is saved or when call session is finalized.

---

## 2. Multiple Invitees Status

### Current State: ⚠️ **Partially Supported**

**What Works:**
- ✅ A meeting can have **multiple invitees** (database supports it)
- ✅ Each invitee receives an email with the same meeting code
- ✅ All invitees are stored in `meeting_invitees` table

**Limitation:**
- ⚠️ Each **call session** only tracks **ONE verified invitee**
- ⚠️ Only one person can join per call session
- ⚠️ Multiple people need to call separately (each gets their own call session)

**How It Works:**

1. **Meeting Creation:**
   - You can invite multiple people to one meeting
   - All receive the same meeting code (e.g., "1234")
   - All receive email invitations

2. **Call Sessions:**
   - Each person calls separately
   - Each call creates a new `call_session`
   - Each session verifies ONE invitee
   - Multiple sessions can exist for the same meeting

3. **Database Structure:**
   ```sql
   -- One meeting can have multiple invitees
   meeting_invitees (meeting_id, name, email, ...)
   
   -- But each call_session tracks only one verified invitee
   call_sessions (
     meeting_id,
     verified_invitee_id,  -- Only ONE invitee per session
     ...
   )
   ```

**Example Scenario:**
- Meeting "API Design Review" has 3 invitees: Alice, Bob, Charlie
- All get meeting code "1234"
- Alice calls → Creates call_session_1, verifies Alice
- Bob calls → Creates call_session_2, verifies Bob  
- Charlie calls → Creates call_session_3, verifies Charlie
- Result: 3 separate call sessions, 3 separate transcripts

**Current Limitation:**
- No group calls (all participants in one session)
- Each person has their own individual session
- Transcripts are separate per person

---

## Recommendations

### For AI Summary:

**Option 1: Auto-generate on Transcript Save**
- Modify `persist_transcript` to automatically trigger summary generation
- Generate summary immediately after transcript is saved

**Option 2: Auto-generate on Call Finalization**
- Modify `finalize_call_session` to check if transcript exists
- If transcript exists and no summary exists, generate one automatically

**Option 3: Agent Instructions**
- Configure ElevenLabs agent to always call `generate_summary_from_transcript` after saving transcript
- Add this to agent's system prompt/instructions

### For Multiple Invitees:

**Current Design is Fine For:**
- One-on-one knowledge capture sessions
- Individual interviews
- Separate sessions per person

**If You Need Group Calls:**
- Would require significant changes:
  - Track multiple verified invitees per session
  - Modify verification to allow multiple people
  - Update agent to handle group conversations
  - Merge transcripts from multiple participants

---

## Next Steps

1. **Enable AI Summary:**
   - Add LLM API keys to `mcp-agent/.env`
   - Choose: auto-generate or agent-triggered
   - Test summary generation

2. **Multiple Invitees:**
   - Current design supports multiple invitees (separate calls)
   - If you need group calls, we'd need to redesign the call session model
