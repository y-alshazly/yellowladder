/**
 * Onboarding phase stored on the `User` row (authoritative state machine).
 * Mirrors the DB CHECK constraint on `users.onboarding_phase`.
 */
export const OnboardingPhase = {
  PhaseARegistered: 'PHASE_A_REGISTERED',
  PhaseBVerified: 'PHASE_B_VERIFIED',
  PhaseCCompleted: 'PHASE_C_COMPLETED',
} as const;

export type OnboardingPhase = (typeof OnboardingPhase)[keyof typeof OnboardingPhase];
