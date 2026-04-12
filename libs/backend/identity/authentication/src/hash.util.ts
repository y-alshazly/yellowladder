import { createHash, randomBytes, randomInt } from 'node:crypto';

/**
 * SHA-256 hash helper for OTP codes, refresh tokens, password-reset tokens,
 * and CSRF tokens. Deterministic so lookups by the hashed column work.
 *
 * Passwords use bcrypt (see `AuthenticationService.hashPassword`) — never
 * SHA-256. This helper is for single-use, short-lived secrets.
 */
export function sha256Hex(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

/** Generate a cryptographically secure random token and return hex. */
export function randomHex(bytes: number): string {
  return randomBytes(bytes).toString('hex');
}

/** Generate a numeric OTP code of the requested length. Zero-padded. */
export function randomNumericCode(length: number): string {
  const max = 10 ** length;
  return String(randomInt(0, max)).padStart(length, '0');
}
