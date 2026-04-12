import type { AuthTokens } from './auth-tokens.interface';
import type { AuthenticatedUser } from './authenticated-user.interface';
import type { OnboardingResumePoint } from './onboarding-resume.constants';
import type { UserDeviceInfoInput } from './user-device-info.interface';

export interface LoginRequest {
  email: string;
  password: string;
  deviceInfo?: UserDeviceInfoInput;
}

export interface LoginResponse {
  user: AuthenticatedUser;
  tokens: AuthTokens;
  resumeAt: OnboardingResumePoint;
}
