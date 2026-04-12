import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthStackNavigator } from '@yellowladder/mobile-identity';
import { selectCurrentUser, useAppSelector } from '@yellowladder/shared-store';
import { HomePlaceholderScreen } from './home-placeholder.screen';

type RootStackParamList = {
  AuthFlow: undefined;
  MainApp: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Top-level navigator. Shows the auth flow until the user has both a
 * company AND a verified email. Everything else (POS, kitchen, menu) lives
 * behind the `MainApp` screen and will be introduced in later features.
 */
export function RootNavigator() {
  const user = useAppSelector(selectCurrentUser);
  const isFullyOnboarded = Boolean(user && user.companyId && user.emailVerified);
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isFullyOnboarded ? (
        <Stack.Screen name="MainApp" component={HomePlaceholderScreen} />
      ) : (
        <Stack.Screen name="AuthFlow" component={AuthStackNavigator} />
      )}
    </Stack.Navigator>
  );
}
