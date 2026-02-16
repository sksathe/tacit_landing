import { supabase } from './supabase.js';

/**
 * Check if an idempotency key has been used
 * Returns true if key exists (operation already performed)
 */
export async function checkIdempotencyKey(scope: string, key: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('idempotency_keys')
    .select('id')
    .eq('scope', scope)
    .eq('key', key)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = not found
    throw error;
  }

  return !!data;
}

/**
 * Record an idempotency key (mark operation as performed)
 */
export async function recordIdempotencyKey(scope: string, key: string): Promise<void> {
  const { error } = await supabase
    .from('idempotency_keys')
    .insert({
      scope,
      key,
    });

  if (error) {
    // Ignore duplicate key errors (idempotent)
    if (error.code !== '23505') { // Unique violation
      throw error;
    }
  }
}

/**
 * Execute a function with idempotency protection
 */
export async function withIdempotency<T>(
  scope: string,
  key: string,
  fn: () => Promise<T>
): Promise<T> {
  const exists = await checkIdempotencyKey(scope, key);
  if (exists) {
    throw new Error(`Operation already performed (idempotency_key: ${scope}:${key})`);
  }

  const result = await fn();
  await recordIdempotencyKey(scope, key);
  return result;
}
