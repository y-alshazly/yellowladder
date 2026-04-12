import { OnboardingResumePoint } from '@yellowladder/shared-types';
import type { AuthStackParamList } from '../navigation/auth-stack.types';

/**
 * Maps a backend `resumeAt` hint onto the React Navigation screen name
 * the client should land on next. Kept out of the screen components so
 * the logic is trivially unit-testable and the rule is documented once.
 *
 * HOME is represented as `null` because it exits the auth stack entirely.
 */
export function resolveResumeScreen(
  resumeAt: OnboardingResumePoint | null | undefined,
): keyof AuthStackParamList | null {
  switch (resumeAt) {
    case OnboardingResumePoint.VerifyEmail:
      return 'VerifyEmail';
    case OnboardingResumePoint.WizardBusinessProfile:
      return 'WizardBusinessProfile';
    case OnboardingResumePoint.Home:
      return null;
    default:
      return null;
  }
}
