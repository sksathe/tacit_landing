# MCP Tool Call Flow

This document describes the **intended order** of tool calls and what each tool does. The voice agent (ElevenLabs) must follow this flow.

---

## Flow overview

```
1. verify_user_and_start_session(meeting_code, spoken_name)
        ↓ on success: returns call_session_id + agenda + agent_hints in one response
2. [Agent says welcome and starts meeting — no second tool call]
3. [Conversation — agent follows agenda from step 1]
4. finalize_call_session(call_session_id, status, raw_transcript)  — when the call ends; pass raw_transcript so the transcript is saved automatically
5. (Optional) persist_transcript during the call for a mid-call snapshot
```

**Critical:** On verification **success**, the response already includes `call_session_id`, `agent_hints`, and agenda (or `no_agenda_opening`). The agent should **not** call `get_meeting_context`—it should respond immediately with the welcome and start the meeting. When the call ends, the agent must call **finalize_call_session** with **raw_transcript** so the transcript is saved automatically.

---

## 1. `verify_user_and_start_session`

**Purpose:** Validate the caller (meeting code + name) and create a call session. This is the **first** tool the agent must call; all later tools depend on it.

**When to call:** Only after the agent has collected **both** from the user:
- 4-digit **meeting code**
- **Full name** (spoken)

**Inputs (required):**
- `meeting_code` (string) — e.g. `"1234"`
- `spoken_name` (string) — e.g. `"Jane Smith"`

**Optional:** `caller_phone`, `elevenlabs_conversation_id`, `now_iso`, `idempotency_key`

**What it does:**
- Looks up the meeting by normalized code.
- If no meeting: returns `verification_failed` (“We couldn't find a meeting for that code”).
- If too early (>30 min before start) or too late (>60 min after end): returns `too_early` / `too_late` with a human-readable scheduled time; **no** `call_session_id`.
- Fuzzy-matches `spoken_name` to the meeting’s invitees.
- If name doesn’t match: returns `verification_failed` (“That name doesn’t match our records”); **no** `call_session_id`.
- If code + time + name OK: creates or reuses a **call session**, sets `verification_status: 'verified'`, returns **success**.

**Output (success):**
- `status: 'verified'`
- `call_session_id` (UUID) — **save this; use it for persist_transcript and finalize_call_session**
- `message_for_user` / `say_to_user` — short welcome message the agent should say
- `meeting_context` — title, agenda, invitee_name, project_name
- `agent_hints` — same as get_meeting_context (agenda to follow or no-agenda opening)
- `no_agenda_opening` — when no agenda was set: phrase to say to the user
- `agent_instruction` — say welcome, then start the meeting; do not call get_meeting_context; respond immediately.

**Output (failure):**
- `status`: `'verification_failed'` | `'too_early'` | `'too_late'`
- `call_session_id: null` — do **not** call `get_meeting_context`; ask for code/name again or tell user to call back at the right time.

---

## 2. `get_meeting_context` (optional)

**Purpose:** Get meeting details (title, agenda, times, invitee) and **agent hints**. Usually **not needed** because the verification success response already includes agenda and agent_hints.

**When to call:** Optional. Only if you need to re-fetch context. Do **not** call with empty arguments. After verification success you already have agenda and hints in the same response.

**Inputs (required):**
- `call_session_id` (UUID) — from the **success** response of `verify_user_and_start_session`

**What it does:**
- Loads the call session and its meeting from the DB.
- Loads invitee (name, email) from `verified_invitee_id`.
- Builds `agent_hints` (e.g. “Stick to the agenda”, agenda text, or “No agenda was given… what would you like to discuss?”).
- Returns meeting title, agenda (or null), scheduled times, meeting code, invitee, and `agent_hints`. If no agenda was set, also returns `no_agenda_opening` with the exact phrase to say.

**Output:**
- `meeting`: `{ title, agenda, scheduled_start_at, scheduled_end_at, meeting_code }`
- `invitee`: `{ name, email }` or null
- `agent_hints`: string[] — instructions for the agent (follow agenda, say opening line when no agenda, etc.)
- `no_agenda_opening`: string | null — when no agenda was provided: “No agenda was given for the call. What would you like to discuss?”

**If called without `call_session_id`:** The server returns a **guidance** result (not an error) telling the agent: collect meeting code and name first, call `verify_user_and_start_session`, then call `get_meeting_context` with the returned `call_session_id`.

---

## 3. Conversation (no tool)

The agent conducts the meeting using the **agenda** and **agent_hints** from `get_meeting_context`. No specific tool for “talk”; the agent just speaks and listens.

---

## 4. `finalize_call_session`

**Purpose:** Mark the call session as completed or failed and **save the transcript** when the call ends.

**When to call:** When the meeting/call is ending.

**Inputs (required):**
- `call_session_id` (UUID) — from `verify_user_and_start_session`
- `status`: `'completed'` | `'failed'`
- **`raw_transcript`** (object) — the conversation transcript (e.g. `{ messages: [ ... ] }`). When provided, the transcript is persisted to the database and storage automatically when the call is finalized.

**Optional:** `ended_at_iso`, `duration_sec`, `normalized_transcript`, `idempotency_key`

**What it does:** Updates the call session row with `ended_at`, `status`, and optionally `duration_sec`. If `raw_transcript` is provided, also saves the transcript (same as `persist_transcript`: uploads to storage, upserts `transcripts` row, sets `call_sessions.transcript_path`).

**Output:** `{ success: true }`

---

## 5. `persist_transcript` (optional)

**Purpose:** Store a transcript snapshot during the call (e.g. mid-call save).

**When to call:** Optional. The main transcript save happens when you call **finalize_call_session** with **raw_transcript**. Use this only if you want an extra snapshot before the call ends.

**Inputs (required):** `call_session_id`, `raw_transcript`. **Optional:** `normalized_transcript`, `idempotency_key`.

**Output:** `{ transcript_id, transcript_path }`

---

## Optional tools

- **`persist_summary`** — Save a meeting summary (key points, action items). Optional; call after generating a summary.
- **`generate_summary_from_transcript`** — Generate a summary from transcript via LLM and persist it. Optional; call after `persist_transcript` if you want an auto-generated summary.

---

## Summary table

| Step | Tool                         | Required inputs              | Returns `call_session_id`? |
|------|------------------------------|------------------------------|----------------------------|
| 1    | verify_user_and_start_session | meeting_code, spoken_name    | Yes (on success only)      |
| 2    | get_meeting_context          | call_session_id              | No (returns context)       |
| 3    | —                            | —                            | —                          |
| 4    | finalize_call_session        | call_session_id, status, **raw_transcript** | No                |
| 5    | (optional) persist_transcript | call_session_id, raw_transcript | No                      |

**Rule:** When the call ends, call **finalize_call_session** with **raw_transcript** so the transcript is saved. Never call these tools without a valid `call_session_id` from a successful `verify_user_and_start_session`.
