# How Name Verification Works

## Overview

The system uses a **multi-step fuzzy matching process** to verify that a spoken name matches one of the invitees for a meeting. This handles variations in how names are spoken (pronunciation, accents, typos, etc.).

---

## Step-by-Step Verification Process

### Step 1: User Provides Name

When the agent calls `verify_user_and_start_session`, it receives:
- `meeting_code`: The 4-digit meeting code
- `spoken_name`: The name the user said (e.g., "John Doe" or "john doe")

### Step 2: Normalize the Spoken Name

The system normalizes the spoken name to make matching easier:

```javascript
normalizeName("John-Paul O'Brien")
// Result: "john paul obrien"
```

**Normalization process:**
1. Convert to lowercase: `"John Doe"` → `"john doe"`
2. Trim whitespace: `"  John Doe  "` → `"john doe"`
3. Remove special characters: `"John-Paul"` → `"johnpaul"`
4. Normalize spaces: `"John    Doe"` → `"john doe"`

**Code location:** `mcp-agent/src/services/name-matching.ts` → `normalizeName()`

### Step 3: Find the Meeting

The system finds the meeting using the meeting code:

```sql
SELECT * FROM meetings 
WHERE meeting_code_norm = '1234'  -- Normalized meeting code
  AND scheduled_end_at >= (NOW() - 30 minutes)
  AND scheduled_start_at <= (NOW() + 60 minutes)
```

**Time window:** Meeting must be within:
- 30 minutes before scheduled start
- 60 minutes after scheduled end

### Step 4: Match Name Against Invitees

The system tries **three matching strategies** in order:

#### Strategy 1: Exact Match (Highest Priority)

**What it does:**
- Compares normalized spoken name with `name_norm` field in database
- If exact match found → **Similarity: 1.0** (100% match)

**Example:**
```
Stored: "John Doe" → normalized: "john doe"
Spoken: "John Doe" → normalized: "john doe"
Result: ✅ MATCH (similarity: 1.0)
```

**Code:**
```javascript
// From name-matching.ts
const { data: exactMatches } = await supabase
  .from('meeting_invitees')
  .select('id, name, name_norm')
  .eq('meeting_id', meetingId)
  .eq('name_norm', normalizedSpoken);

if (exactMatches && exactMatches.length > 0) {
  return { similarity: 1.0 }; // Perfect match!
}
```

#### Strategy 2: Phone Number Match (If Available)

**What it does:**
- If caller phone number is provided, matches by phone number
- If phone matches → **Similarity: 0.9** (90% confidence)

**Example:**
```
Stored invitee: phone = "+1234567890"
Caller phone: "+1234567890"
Result: ✅ MATCH (similarity: 0.9)
```

**Code:**
```javascript
if (callerPhone) {
  const { data: phoneMatches } = await supabase
    .from('meeting_invitees')
    .select('id, name, name_norm')
    .eq('meeting_id', meetingId)
    .eq('phone', callerPhone);

  if (phoneMatches && phoneMatches.length > 0) {
    return { similarity: 0.9 }; // Phone match!
  }
}
```

#### Strategy 3: Fuzzy Match (Using PostgreSQL pg_trgm)

**What it does:**
- Uses PostgreSQL's `pg_trgm` extension for fuzzy string matching
- Calculates similarity score between normalized names
- Returns best match if similarity > 0.5 (50%)

**How pg_trgm works:**
- Breaks strings into trigrams (3-character sequences)
- Compares trigram overlap between strings
- Returns similarity score from 0.0 to 1.0

**Example:**
```
Stored: "John Doe" → normalized: "john doe"
Spoken: "Jon Doe" → normalized: "jon doe"

Trigrams comparison:
"john doe": ['joh', 'ohn', 'hn ', 'n d', ' do', 'doe']
"jon doe":  ['jon', 'on ', 'n d', ' do', 'doe']

Overlap: 3/6 = 0.5 similarity
Result: ✅ MATCH (similarity: 0.5+)
```

**Code:**
```sql
-- From supabase/sql/04_functions.sql
SELECT
    mi.id,
    mi.name,
    similarity(mi.name_norm, normalized_spoken) as similarity
FROM meeting_invitees mi
WHERE mi.meeting_id = p_meeting_id
  AND similarity(mi.name_norm, normalized_spoken) > 0.5
ORDER BY similarity DESC
LIMIT 1;
```

**Database function:** `fuzzy_match_invitee()` in `supabase/sql/04_functions.sql`

### Step 5: Check Similarity Threshold

After matching, the system checks if similarity meets the threshold:

```javascript
if (!match || match.similarity < 0.5) {
  // Verification failed
  return {
    status: 'verification_failed',
    message_for_user: "I'm sorry, that name doesn't match our records..."
  };
}
```

**Threshold:** Similarity must be **≥ 0.5** (50% match)

**Code location:** `mcp-agent/src/tools/verify-user-and-start-session.ts` line 55

### Step 6: Return Result

**If match found (similarity ≥ 0.5):**
```javascript
return {
  verified: true,
  status: 'verified',
  call_session_id: "...",
  meeting_context: {
    title: "Meeting Title",
    agenda: "...",
    invitee_name: "John Doe", // The matched name
    project_name: "..."
  }
};
```

**If no match (similarity < 0.5):**
```javascript
return {
  verified: false,
  status: 'verification_failed',
  message_for_user: "I'm sorry, that name doesn't match our records..."
};
```

---

## Complete Flow Diagram

```
User says name: "John Doe"
         ↓
Normalize: "john doe"
         ↓
Find meeting by code
         ↓
┌─────────────────────────────────────┐
│ Try Strategy 1: Exact Match        │
│ "john doe" == "john doe" ?         │
│ ✅ YES → Return (similarity: 1.0)  │
└─────────────────────────────────────┘
         ↓ (if no match)
┌─────────────────────────────────────┐
│ Try Strategy 2: Phone Match        │
│ Caller phone == Stored phone ?      │
│ ✅ YES → Return (similarity: 0.9)  │
└─────────────────────────────────────┘
         ↓ (if no match)
┌─────────────────────────────────────┐
│ Try Strategy 3: Fuzzy Match        │
│ pg_trgm similarity > 0.5 ?         │
│ ✅ YES → Return best match         │
│ ❌ NO → Verification failed         │
└─────────────────────────────────────┘
```

---

## Examples

### Example 1: Exact Match

**Stored in database:**
- Name: "John Doe"
- Normalized: "john doe"

**User says:** "John Doe"
**Normalized:** "john doe"

**Result:** ✅ **MATCH** (similarity: 1.0)
**Reason:** Exact match after normalization

---

### Example 2: Case Insensitive Match

**Stored:** "John Doe" → "john doe"
**User says:** "JOHN DOE" → "john doe"

**Result:** ✅ **MATCH** (similarity: 1.0)
**Reason:** Case doesn't matter after normalization

---

### Example 3: Fuzzy Match (Minor Typo)

**Stored:** "John Doe" → "john doe"
**User says:** "Jon Doe" → "jon doe"

**Trigram comparison:**
- "john doe": ['joh', 'ohn', 'hn ', 'n d', ' do', 'doe']
- "jon doe": ['jon', 'on ', 'n d', ' do', 'doe']
- Overlap: 3 trigrams match

**Result:** ✅ **MATCH** (similarity: ~0.6)
**Reason:** pg_trgm finds sufficient similarity

---

### Example 4: Fuzzy Match (Different Order)

**Stored:** "Mary Jane Smith" → "mary jane smith"
**User says:** "Jane Mary Smith" → "jane mary smith"

**Result:** ⚠️ **MAY MATCH** (similarity depends on trigram overlap)
**Note:** Word order matters for trigrams, but if enough words match, it might still pass

---

### Example 5: No Match (Too Different)

**Stored:** "John Doe" → "john doe"
**User says:** "Bob Smith" → "bob smith"

**Trigram comparison:**
- "john doe": ['joh', 'ohn', 'hn ', 'n d', ' do', 'doe']
- "bob smith": ['bob', 'ob ', 'b s', ' sm', 'smi', 'mit', 'ith']
- Overlap: 0 trigrams match

**Result:** ❌ **NO MATCH** (similarity: ~0.0)
**Reason:** Names are too different

---

## Technical Details

### Database Extension Required

The system uses PostgreSQL's `pg_trgm` extension for fuzzy matching:

```sql
-- Enable extension (run once)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

**Location:** `supabase/sql/01_extensions.sql`

### Index for Performance

An index is created on `name_norm` for fast fuzzy matching:

```sql
CREATE INDEX idx_meeting_invitees_name_norm 
ON meeting_invitees 
USING gin(name_norm gin_trgm_ops);
```

**Location:** `supabase/sql/02_tables.sql` line 117

### Normalization Function

Both client-side (JavaScript) and server-side (PostgreSQL) normalization:

**JavaScript:**
```javascript
// mcp-agent/src/services/name-matching.ts
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' '); // Normalize whitespace
}
```

**PostgreSQL:**
```sql
-- supabase/sql/04_functions.sql
normalized_spoken := lower(trim(regexp_replace(p_spoken_name, '[^\w\s]', '', 'g')));
normalized_spoken := regexp_replace(normalized_spoken, '\s+', ' ', 'g');
```

---

## Configuration

### Similarity Threshold

**Current threshold:** 0.5 (50%)

**Where it's checked:**
- `mcp-agent/src/tools/verify-user-and-start-session.ts` line 55
- `supabase/sql/04_functions.sql` line 61

**To change threshold:**
1. Update the check in `verify-user-and-start-session.ts`
2. Update the SQL function in `04_functions.sql`
3. Re-run the SQL migration

### Time Window

**Current window:**
- Start: 30 minutes before scheduled start
- End: 60 minutes after scheduled end

**Where it's set:**
- `mcp-agent/src/tools/verify-user-and-start-session.ts` lines 28-29

---

## Troubleshooting

### Issue: Name exists but verification fails

**Check:**
1. Is the name in the correct meeting? (verify meeting_code)
2. Is similarity above 0.5? (run similarity test query)
3. Is the meeting within time window?
4. Is `name_norm` populated correctly? (check database)

**Test similarity:**
```sql
SELECT 
    mi.name as stored_name,
    similarity(mi.name_norm, 'john doe') as similarity_score
FROM meeting_invitees mi
WHERE mi.meeting_id = 'YOUR_MEETING_ID'
ORDER BY similarity_score DESC;
```

### Issue: Similarity score too low

**Possible causes:**
1. Names are too different (e.g., "John" vs "Bob")
2. Special characters not normalized correctly
3. Name stored incorrectly in database

**Solution:**
- Check `name_norm` field in database
- Verify normalization is working correctly
- Consider lowering threshold (not recommended)

---

## Files Involved

1. **Name Matching Logic:**
   - `mcp-agent/src/services/name-matching.ts` - JavaScript normalization and matching
   - `supabase/sql/04_functions.sql` - PostgreSQL fuzzy matching function

2. **Verification Tool:**
   - `mcp-agent/src/tools/verify-user-and-start-session.ts` - Main verification flow

3. **Database Schema:**
   - `supabase/sql/02_tables.sql` - `meeting_invitees` table definition
   - `supabase/sql/01_extensions.sql` - `pg_trgm` extension

4. **Name Normalization:**
   - `server-api/src/services/meeting-code.ts` - `normalizeName()` function (used when creating meetings)

---

## Summary

The name verification system uses a **three-tier matching strategy**:

1. **Exact match** (fastest, 100% confidence)
2. **Phone match** (if available, 90% confidence)
3. **Fuzzy match** (handles variations, requires ≥50% similarity)

This approach ensures accurate verification while handling real-world variations in how names are spoken, typed, or stored.
