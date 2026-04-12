import type { AuthenticatedUser } from '@yellowladder/shared-types';
import { OnboardingPhase, UserRole } from '@yellowladder/shared-types';

interface UserLike {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phoneE164: string;
  phoneCountryCode: string;
  countryCode: string;
  role: string;
  companyId: string | null;
  emailVerifiedAt: Date | null;
  onboardingPhase: string;
  profilePhotoUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

function coerceRole(value: string): AuthenticatedUser['role'] {
  const match = Object.values(UserRole).find((r) => r === value);
  return match ?? UserRole.Employee;
}

function coerceOnboardingPhase(value: string): AuthenticatedUser['onboardingPhase'] {
  const match = Object.values(OnboardingPhase).find((p) => p === value);
  return match ?? OnboardingPhase.PhaseARegistered;
}

/**
 * Map a Prisma `User` row to the platform-wide `AuthenticatedUser` shape.
 */
export function toAuthenticatedUser(user: UserLike): AuthenticatedUser {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phoneE164: user.phoneE164,
    phoneCountryCode: user.phoneCountryCode,
    countryCode: user.countryCode,
    role: coerceRole(user.role),
    companyId: user.companyId,
    shopIds: [],
    emailVerified: user.emailVerifiedAt !== null,
    onboardingPhase: coerceOnboardingPhase(user.onboardingPhase),
    profilePhotoUrl: user.profilePhotoUrl,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}
