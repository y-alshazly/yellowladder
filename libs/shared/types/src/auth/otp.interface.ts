import type { AuthTokens } from './auth-tokens.interface';
import type { AuthenticatedUser } from './authenticated-user.interface';
import type { OnboardingResumePoint } from './onboarding-resume.constants';

export interface OtpRequestRequest {
  email: string;
}

/**
 * Always returns 200 with this shape regardless of account existence
 * (no account enumeration leak).
 */
export interface OtpRequestResponse {
  sentAt: string;
  expiresAt: string;
  remainingRequestsInWindow: number;
}

export interface OtpVerifyRequest {
  email: string;
  code: string;
}

export interface OtpVerifyResponse {
  user: AuthenticatedUser;
  tokens: AuthTokens;
  resumeAt: OnboardingResumePoint;
}
