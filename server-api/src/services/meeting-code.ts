/**
 * Generate a speakable meeting code
 * Format: [adjective]-[noun]-[number]
 * Example: "bright-star-42"
 */
export function generateMeetingCode(): string {
  const adjectives = [
    'bright', 'swift', 'calm', 'bold', 'clear', 'quick', 'sharp', 'wise',
    'brave', 'calm', 'cool', 'deep', 'fast', 'firm', 'fresh', 'grand',
    'great', 'happy', 'huge', 'kind', 'loud', 'neat', 'nice', 'proud',
    'quiet', 'rapid', 'real', 'rich', 'smart', 'solid', 'sweet', 'tall',
    'warm', 'wild', 'wise', 'young', 'zest', 'zen', 'zest', 'zest'
  ];

  const nouns = [
    'star', 'moon', 'wave', 'peak', 'lake', 'river', 'ocean', 'cloud',
    'storm', 'light', 'flame', 'stone', 'crown', 'sword', 'shield', 'arrow',
    'eagle', 'lion', 'wolf', 'bear', 'hawk', 'fox', 'deer', 'dove',
    'rose', 'oak', 'pine', 'maple', 'cedar', 'birch', 'willow', 'ash',
    'rock', 'gem', 'pearl', 'diamond', 'crystal', 'amber', 'jade', 'opal'
  ];

  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(Math.random() * 999) + 1;

  return `${adjective}-${noun}-${number}`;
}

/**
 * Normalize meeting code for matching (lowercase, no spaces, no hyphens)
 */
export function normalizeMeetingCode(code: string): string {
  return code.toLowerCase().replace(/[\s-]/g, '');
}

/**
 * Normalize name for fuzzy matching (lowercase, remove accents, trim)
 */
export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' '); // Normalize whitespace
}
