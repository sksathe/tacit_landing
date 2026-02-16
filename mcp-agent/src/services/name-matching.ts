import { supabase } from './supabase.js';

/**
 * Normalize name for fuzzy matching
 */
export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' '); // Normalize whitespace
}

/**
 * Fuzzy match spoken name against invitees using pg_trgm similarity
 * Returns the best match if similarity > 0.5, otherwise null
 */
export async function fuzzyMatchInvitee(
  meetingId: string,
  spokenName: string,
  callerPhone?: string
): Promise<{ invitee_id: string; name: string; similarity: number } | null> {
  const normalizedSpoken = normalizeName(spokenName);

  // First, try exact match on normalized name
  let query = supabase
    .from('meeting_invitees')
    .select('id, name, name_norm')
    .eq('meeting_id', meetingId);

  const { data: exactMatches, error: exactError } = await query
    .eq('name_norm', normalizedSpoken);

  if (!exactError && exactMatches && exactMatches.length > 0) {
    return {
      invitee_id: exactMatches[0].id,
      name: exactMatches[0].name,
      similarity: 1.0,
    };
  }

  // Try phone match if caller phone provided
  if (callerPhone) {
    const { data: phoneMatches, error: phoneError } = await supabase
      .from('meeting_invitees')
      .select('id, name, name_norm')
      .eq('meeting_id', meetingId)
      .eq('phone', callerPhone);

    if (!phoneError && phoneMatches && phoneMatches.length > 0) {
      return {
        invitee_id: phoneMatches[0].id,
        name: phoneMatches[0].name,
        similarity: 0.9, // High confidence for phone match
      };
    }
  }

  // Use database function for pg_trgm fuzzy matching
  const { data: matches, error: fuzzyError } = await supabase
    .rpc('fuzzy_match_invitee', {
      p_meeting_id: meetingId,
      p_spoken_name: spokenName,
      p_caller_phone: callerPhone || null,
    });

  if (fuzzyError || !matches || matches.length === 0) {
    return null;
  }

  const bestMatch = matches[0];
  return {
    invitee_id: bestMatch.invitee_id,
    name: bestMatch.name,
    similarity: bestMatch.similarity,
  };
}
