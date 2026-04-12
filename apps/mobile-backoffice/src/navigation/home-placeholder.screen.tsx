import { clearRefreshToken } from '@yellowladder/mobile-identity';
import { useLogoutMutation } from '@yellowladder/shared-api';
import { FormScreenLayout, useAppTheme } from '@yellowladder/shared-mobile-ui';
import {
  markUnauthenticated,
  selectCurrentUser,
  useAppDispatch,
  useAppSelector,
} from '@yellowladder/shared-store';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';
import { Button, Text } from 'react-native-paper';

/**
 * Placeholder home screen rendered when the user has an active company.
 * Feature 01 hands off at this screen — POS / Kitchen / Menu / Settings
 * navigators arrive in later features.
 */
export function HomePlaceholderScreen() {
  const theme = useAppTheme();
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);
  const [logout] = useLogoutMutation();

  const onLogout = async (): Promise<void> => {
    try {
      await logout().unwrap();
    } catch {
      // Non-fatal — we still clear local state below.
    }
    await clearRefreshToken();
    dispatch(markUnauthenticated());
  };

  return (
    <FormScreenLayout title={t('home.placeholderTitle')}>
      <Text
        variant="bodyMedium"
        style={[styles.body, { color: theme.colors.onSurface, marginBottom: theme.spacing.md }]}
      >
        {t('home.placeholderBody')}
      </Text>
      {user ? (
        <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant }}>
          {user.email}
        </Text>
      ) : null}
      <Button
        mode="outlined"
        icon="logout"
        onPress={onLogout}
        style={{ marginTop: theme.spacing.lg }}
      >
        {t('profile.logout')}
      </Button>
    </FormScreenLayout>
  );
}

const styles = StyleSheet.create({
  body: { textAlign: 'center' },
});
