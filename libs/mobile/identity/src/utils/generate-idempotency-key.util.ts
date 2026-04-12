/**
 * Generates a client-side idempotency key for `POST /companies`. Uses the
 * Web Crypto API when available (React Native 0.79's Hermes exposes it via
 * polyfill) and falls back to a timestamp + random suffix otherwise.
 *
 * The key must be stable across retries of the same submission — callers
 * should generate it once per wizard start and re-use on retry.
 */
export function generateIdempotencyKey(): string {
  const globalCrypto: Crypto | undefined =
    typeof globalThis !== 'undefined' && 'crypto' in globalThis
      ? (globalThis as { crypto?: Crypto }).crypto
      : undefined;
  if (globalCrypto && typeof globalCrypto.randomUUID === 'function') {
    return globalCrypto.randomUUID();
  }
  // Fallback: generate a valid UUID v4 without crypto.randomUUID
  const hex = () => Math.floor(Math.random() * 16).toString(16);
  const s = (n: number) => Array.from({ length: n }, hex).join('');
  return `${s(8)}-${s(4)}-4${s(3)}-${['8', '9', 'a', 'b'][Math.floor(Math.random() * 4)]}${s(3)}-${s(12)}`;
}
