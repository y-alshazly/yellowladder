/**
 * Advisory hint returned by /auth/login and /auth/otp/verify telling the
 * client where to navigate next after token issuance.
 */
export const OnboardingResumePoint = {
  VerifyEmail: 'VERIFY_EMAIL',
  WizardBusinessProfile: 'WIZARD_BUSINESS_PROFILE',
  Home: 'HOME',
} as const;

export type OnboardingResumePoint =
  (typeof OnboardingResumePoint)[keyof typeof OnboardingResumePoint];
