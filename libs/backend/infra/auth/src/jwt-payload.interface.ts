import type { OnboardingPhase, UserRole } from '@yellowladder/shared-types';

/**
 * JWT access token payload.
 *
 * Matches architect §2.3. Every access/refresh token the backend issues
 * contains exactly these claims.
 */
export interface JwtAccessTokenPayload {
  sub: string;
  email: string;
  role: UserRole;
  companyId: string | null;
  shopIds: readonly string[];
  emailVerified: boolean;
  onboardingPhase: OnboardingPhase;
  tokenType: 'access';
  sid: string;
  iat?: number;
  exp?: number;
}

export interface JwtRefreshTokenPayload {
  sub: string;
  sid: string;
  tokenType: 'refresh';
  iat?: number;
  exp?: number;
}
