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
