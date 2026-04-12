import type { OnboardingPhase } from './onboarding-phase.constants';
import type { UserRole } from './user-role.constants';

export interface AuthenticatedUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phoneE164: string;
  phoneCountryCode: string;
  countryCode: string;
  role: UserRole;
  companyId: string | null;
  shopIds: readonly string[];
  emailVerified: boolean;
  onboardingPhase: OnboardingPhase;
  profilePhotoUrl: string | null;
  createdAt: string;
  updatedAt: string;
}
