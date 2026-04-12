import type { AuthTokens } from './auth-tokens.interface';

/**
 * Empty body — refresh token rides in an HttpOnly cookie (web) or
 * Authorization header (mobile). CSRF token rides in the X-CSRF-Token header.
 */
export type RefreshRequest = Record<string, never>;

export interface RefreshResponse {
  tokens: AuthTokens;
}
