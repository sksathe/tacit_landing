-- Check invitee names for a specific meeting
-- Replace 'YOUR_MEETING_CODE' with your actual meeting code (e.g., '1234')

-- Option 1: Find invitees by meeting code
SELECT 
    m.meeting_code,
    m.title as meeting_title,
    mi.id as invitee_id,
    mi.name as invitee_name,
    mi.name_norm as normalized_name,
    mi.email,
    mi.phone,
    mi.status as invitee_status
FROM meetings m
JOIN meeting_invitees mi ON mi.meeting_id = m.id
WHERE m.meeting_code = '1234'  -- Replace with your meeting code
ORDER BY mi.name;

-- Option 2: Find all invitees for all meetings
SELECT 
    m.meeting_code,
    m.title as meeting_title,
    m.scheduled_start_at,
    mi.name as invitee_name,
    mi.name_norm as normalized_name,
    mi.email,
    mi.phone
FROM meetings m
JOIN meeting_invitees mi ON mi.meeting_id = m.id
ORDER BY m.scheduled_start_at DESC, mi.name;

-- Option 3: Find invitees for a specific meeting by meeting ID
-- First, find your meeting ID:
-- SELECT id, meeting_code, title FROM meetings WHERE meeting_code = '1234';
-- Then use that ID:
SELECT 
    mi.name as invitee_name,
    mi.name_norm as normalized_name,
    mi.email,
    mi.phone,
    mi.status
FROM meeting_invitees mi
WHERE mi.meeting_id = 'YOUR_MEETING_ID_HERE'  -- Replace with actual meeting ID
ORDER BY mi.name;

-- Option 4: Test fuzzy matching for a specific name
-- This shows how similar a spoken name is to stored names
SELECT 
    mi.name as stored_name,
    mi.name_norm as normalized_stored_name,
    similarity(mi.name_norm, 'john doe') as similarity_score  -- Replace 'john doe' with the name you want to test
FROM meeting_invitees mi
JOIN meetings m ON m.id = mi.meeting_id
WHERE m.meeting_code = '1234'  -- Replace with your meeting code
ORDER BY similarity_score DESC;
