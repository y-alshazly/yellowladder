import type { AuthTokens } from './auth-tokens.interface';
import type { AuthenticatedUser } from './authenticated-user.interface';
import type { BusinessType } from './business-type.constants';
import type { OnboardingResumePoint } from './onboarding-resume.constants';

export interface RegisterRequest {
  email: string;
  phoneCountryCode: string;
  phoneE164: string;
  countryCode: string;
  businessType: BusinessType;
  password: string;
  termsAcceptedAt: string;
}

export interface RegisterResponse {
  user: AuthenticatedUser;
  tokens: AuthTokens;
  resumeAt: OnboardingResumePoint;
}
