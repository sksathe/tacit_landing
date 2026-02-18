# How to Find Invitee Names for Verification

## Overview

When a user calls in, they need to provide their **full name** that matches one of the invitees stored in the `meeting_invitees` table for that specific meeting.

## Where Names Are Stored

Names are stored in the **`meeting_invitees`** table in Supabase. Each meeting can have multiple invitees.

### Database Table Structure

```sql
meeting_invitees (
    id UUID PRIMARY KEY,
    meeting_id UUID REFERENCES meetings(id),
    name TEXT NOT NULL,           -- The actual name (e.g., "John Doe")
    name_norm TEXT NOT NULL,       -- Normalized version for fuzzy matching (e.g., "john doe")
    email TEXT NOT NULL,
    phone TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'joined', 'declined'
    created_at TIMESTAMPTZ
)
```

## How to Check Invitee Names

### Method 1: Using Supabase SQL Editor (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run this query (replace `'1234'` with your meeting code):

```sql
SELECT 
    m.meeting_code,
    m.title as meeting_title,
    mi.name as invitee_name,
    mi.name_norm as normalized_name,
    mi.email,
    mi.phone
FROM meetings m
JOIN meeting_invitees mi ON mi.meeting_id = m.id
WHERE m.meeting_code = '1234'  -- Replace with your meeting code
ORDER BY mi.name;
```

### Method 2: Using Supabase Table Editor

1. Go to **Table Editor** in Supabase dashboard
2. Select the **`meeting_invitees`** table
3. Filter by `meeting_id` to see invitees for a specific meeting
4. The `name` column shows what name the user should say

### Method 3: Check via Frontend

If you scheduled the meeting through the Tacit frontend:
1. The invitee names you entered when creating the meeting are stored exactly as you typed them
2. Check the meeting details in your dashboard to see the invitee names

## How Name Matching Works

The system uses **fuzzy matching** to handle variations in how names are spoken:

1. **Normalization**: Names are normalized (lowercase, remove special characters, normalize spaces)
   - "John Doe" → "john doe"
   - "John-Paul O'Brien" → "john paul obrien"

2. **Matching Process**:
   - First tries exact match on normalized name
   - Then tries phone number match (if caller phone is available)
   - Finally uses PostgreSQL `pg_trgm` fuzzy matching (similarity threshold: 0.5)

3. **What the User Should Say**:
   - The user should say their **full name** as it appears in the `name` field
   - Examples:
     - If stored as "John Doe" → user can say "John Doe" or "john doe"
     - If stored as "Mary Jane Smith" → user should say "Mary Jane Smith" or "mary jane smith"
     - Fuzzy matching handles minor variations like "John" vs "Jon"

## Example: Finding Names for Your Meeting

### Step 1: Find Your Meeting Code

If you don't know your meeting code, find it:

```sql
SELECT meeting_code, title, scheduled_start_at 
FROM meetings 
ORDER BY scheduled_start_at DESC 
LIMIT 10;
```

### Step 2: Get Invitee Names for That Meeting

```sql
SELECT 
    mi.name as "Name to Say",
    mi.email,
    mi.phone,
    mi.status
FROM meeting_invitees mi
JOIN meetings m ON m.id = mi.meeting_id
WHERE m.meeting_code = '1234'  -- Your meeting code
ORDER BY mi.name;
```

### Step 3: Test Name Matching

To see how similar a spoken name is to stored names:

```sql
SELECT 
    mi.name as stored_name,
    similarity(mi.name_norm, 'john doe') as similarity_score
FROM meeting_invitees mi
JOIN meetings m ON m.id = mi.meeting_id
WHERE m.meeting_code = '1234'
ORDER BY similarity_score DESC;
```

## Common Issues

### Issue: "Name doesn't match our records"

**Possible causes:**
1. The name wasn't added as an invitee when creating the meeting
2. The name is spelled differently than stored
3. The meeting code is wrong (checking wrong meeting)

**Solution:**
1. Check the `meeting_invitees` table for that meeting
2. Verify the exact spelling of the name
3. Make sure the user says their **full name** (first + last name)

### Issue: Name exists but still fails

**Check:**
1. Is the name in the correct meeting? (verify meeting_code)
2. Is the similarity score above 0.5? (run the similarity test query)
3. Is the meeting within the time window? (meeting must be within start-30m to end+60m)

## Quick Reference

**Table:** `meeting_invitees`  
**Key Fields:**
- `name` - The name the user should say
- `name_norm` - Normalized version (for matching)
- `meeting_id` - Links to the meeting
- `email` - Invitee email
- `phone` - Optional phone number (can also be used for matching)

**Matching Threshold:** Similarity score must be ≥ 0.5 (50% match)

**Time Window:** Meeting must be within:
- 30 minutes before scheduled start
- 60 minutes after scheduled end

## SQL Script

A complete SQL script with multiple query options is available at:
`supabase/sql/12_check_invitee_names.sql`

Run it in Supabase SQL Editor and modify the meeting code/ID as needed.
