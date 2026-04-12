import type { LinkingOptions } from '@react-navigation/native';
import type { AuthStackParamList } from '@yellowladder/mobile-identity';

/**
 * Deep linking configuration. The reset-password flow lands via an email
 * link, so `/reset-password/:token` is mapped to the ResetPassword screen
 * with the token forwarded as a route param.
 */
export const linkingConfig: LinkingOptions<AuthStackParamList> = {
  prefixes: ['yellowladder://', 'https://app.yellowladder.com'],
  config: {
    screens: {
      Login: 'login',
      SignupAccount: 'signup',
      TermsAndConditions: 'terms',
      VerifyEmail: 'verify-email',
      WizardBusinessProfile: 'wizard/business-profile',
      WizardCompaniesHouseLookup: 'wizard/companies-house',
      WizardSelfEmployedDetails: 'wizard/self-employed',
      WizardPrimaryContact: 'wizard/primary-contact',
      ForgotPassword: 'forgot-password',
      ResetPassword: 'reset-password/:token',
      ProfileEdit: 'profile',
      Home: 'home',
    },
  },
};
