import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthStackNavigator } from '@yellowladder/mobile-identity';
import { selectAuthStatus, selectCurrentUser, useAppSelector } from '@yellowladder/shared-store';
import { MainNavigator } from './main.navigator';

type RootStackParamList = {
  AuthFlow: undefined;
  MainApp: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Top-level navigator. Switches between the auth flow and the main app
 * based on a stable gate:
 *
 *   - `authStatus` must be `'authenticated'` (only flips on explicit
 *     login / logout / hydration — NOT on transient user mutations).
 *   - `user` must exist with a company AND verified email.
 *
 * Gating on `authStatus` prevents the navigator from unmounting the main
 * app tree during in-flight token refreshes or user-profile updates.
 */
export function RootNavigator() {
  const authStatus = useAppSelector(selectAuthStatus);
  const user = useAppSelector(selectCurrentUser);
  const isFullyOnboarded =
    authStatus === 'authenticated' && Boolean(user && user.companyId && user.emailVerified);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isFullyOnboarded ? (
        <Stack.Screen name="MainApp" component={MainNavigator} />
      ) : (
        <Stack.Screen name="AuthFlow" component={AuthStackNavigator} />
      )}
    </Stack.Navigator>
  );
}
