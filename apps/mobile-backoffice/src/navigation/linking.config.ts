/**
 * Deep linking configuration. Maps URL paths to navigator screens.
 *
 * Auth flow paths (login, signup, reset-password) are handled by the
 * AuthStackNavigator. Main app paths (pos, kitchen, etc.) are handled
 * by the device-aware MainNavigator.
 */
export const linkingConfig = {
  prefixes: ['yellowladder://', 'https://app.yellowladder.com'],
  config: {
    screens: {
      AuthFlow: {
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
      MainApp: {
        screens: {
          PointOfSale: 'pos',
          Kitchen: 'kitchen',
          Transactions: 'transactions',
          Catalogue: 'catalogue',
          Reporting: 'reporting',
          Settings: {
            screens: {
              Stores: 'settings/stores',
              Members: 'settings/members',
              MemberDetail: 'settings/members/:memberId',
              AddMember: 'settings/members/add',
              General: 'settings/general',
              Subscriptions: 'settings/subscriptions',
              Tax: 'settings/tax',
              Discounts: 'settings/discounts',
              Integrations: 'settings/integrations',
            },
          },
        },
      },
    },
  },
};
