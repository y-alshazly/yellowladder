import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useIsTabletClass } from '@yellowladder/shared-mobile-ui';
import { ForgotPasswordScreen } from '../screens/forgot-password.screen';
import { LoginScreen } from '../screens/login.screen';
import { OtpVerifyScreen } from '../screens/otp-verify.screen';
import { ProfileEditScreen } from '../screens/profile-edit.screen';
import { ResetPasswordScreen } from '../screens/reset-password.screen';
import { SignupAccountScreen } from '../screens/signup-account.screen';
import { SplashScreen } from '../screens/splash.screen';
import { WelcomeScreen } from '../screens/welcome.screen';
import { WizardBusinessProfileScreen } from '../screens/wizard-business-profile.screen';
import { WizardCompaniesHouseLookupScreen } from '../screens/wizard-companies-house-lookup.screen';
import { WizardPrimaryContactScreen } from '../screens/wizard-primary-contact.screen';
import { WizardSelfEmployedScreen } from '../screens/wizard-self-employed.screen';
import type { AuthStackParamList } from './auth-stack.types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

/**
 * Auth flow stack covering the new onboarding order:
 *
 *   Splash (language picker + hand animation)
 *     → Welcome (create-account / log-in)
 *     → SignupAccount
 *         → WizardBusinessProfile
 *             → WizardCompaniesHouseLookup OR WizardSelfEmployedDetails
 *                 → WizardPrimaryContact (limited-company only)
 *                     → VerifyEmail → [POST /companies] → exits stack
 *
 *   Login → resume at VerifyEmail / WizardBusinessProfile / Home.
 *
 * Terms & Conditions is NOT a stack screen any more — it lives as a
 * Paper Portal/Modal inside `signup-account.screen.tsx`.
 *
 * The Splash screen owns the language picker (previously a separate
 * `Start` screen) AND plays the hand-slide animation before transitioning
 * to Welcome. Splash → Welcome uses a fade animation so the hands look
 * continuous between the two screens.
 */
export function AuthStackNavigator() {
  const isTablet = useIsTabletClass();
  const modalPresentation = isTablet ? 'formSheet' : 'card';

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: 'transparent' },
      }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} options={{ animation: 'fade' }} />
      <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ animation: 'fade' }} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignupAccount" component={SignupAccountScreen} />
      <Stack.Screen name="WizardBusinessProfile" component={WizardBusinessProfileScreen} />
      <Stack.Screen
        name="WizardCompaniesHouseLookup"
        component={WizardCompaniesHouseLookupScreen}
      />
      <Stack.Screen name="WizardSelfEmployedDetails" component={WizardSelfEmployedScreen} />
      <Stack.Screen name="WizardPrimaryContact" component={WizardPrimaryContactScreen} />
      <Stack.Screen name="VerifyEmail" component={OtpVerifyScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      <Stack.Screen
        name="ProfileEdit"
        component={ProfileEditScreen}
        options={{
          presentation: modalPresentation,
          headerShown: true,
        }}
      />
    </Stack.Navigator>
  );
}
