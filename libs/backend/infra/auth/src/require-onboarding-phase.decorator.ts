import { SetMetadata } from '@nestjs/common';
import type { OnboardingPhase } from '@yellowladder/shared-types';

export const REQUIRE_ONBOARDING_PHASE_KEY = 'requireOnboardingPhase';

/**
 * Slot of onboarding phases this endpoint accepts. If the phase on the
 * authenticated user does not match, `OnboardingPhaseGuard` throws 403
 * `ONBOARDING_PHASE_FORBIDDEN`.
 *
 * Use `'ACTIVE'` to denote any user with a populated `companyId`
 * (i.e. Phase C completed — onboarding finished). Most production
 * endpoints use `'ACTIVE'` only.
 */
export type OnboardingPhaseGate = OnboardingPhase | 'ACTIVE';

export const RequireOnboardingPhase = (
  ...phases: readonly OnboardingPhaseGate[]
): MethodDecorator & ClassDecorator => SetMetadata(REQUIRE_ONBOARDING_PHASE_KEY, phases);
