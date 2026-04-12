import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

/**
 * Param list for the auth stack. Screens that take parameters declare them
 * here so `useNavigation<NativeStackNavigationProp<AuthStackParamList>>()`
 * is fully type-safe.
 *
 * Navigation order (design-accurate, 2026-04-11):
 *
 *   Start (language picker)
 *     → Welcome (create-account vs log-in)
 *     → SignupAccount (Phase A — email / phone / password)
 *         → WizardBusinessProfile (Phase C step 2 dot)
 *             → WizardCompaniesHouseLookup OR WizardSelfEmployedDetails (step 3 dot)
 *                 → WizardPrimaryContact (step 4 dot, limited-company only)
 *                     → VerifyEmail (Phase B — OTP verify)
 *                         → POST /companies + exit auth stack
 *
 *   Login branch:
 *     Welcome → Login → resume based on backend `resumeAt`.
 *
 * Note: `TermsAndConditions` is no longer a stack screen — it is a Paper
 * Portal/Modal opened from the sign-up form. The old `TermsAndConditions`
 * route has been deliberately removed.
 */
export type AuthStackParamList = {
  Splash: undefined;
  Welcome: undefined;
  Login: undefined;
  SignupAccount: undefined;
  VerifyEmail: { email: string };
  WizardBusinessProfile: undefined;
  WizardCompaniesHouseLookup: undefined;
  WizardSelfEmployedDetails: undefined;
  WizardPrimaryContact: undefined;
  ForgotPassword: undefined;
  ForgotPasswordSent: { email: string };
  ResetPassword: { token: string };
  ProfileEdit: undefined;
  Home: undefined;
};

export type AuthStackNavigationProp = NativeStackNavigationProp<AuthStackParamList>;
