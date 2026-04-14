import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useCompletePasswordResetMutation } from '@yellowladder/shared-api';
import { AuthScreenLayout, FormTextField, useAppTheme } from '@yellowladder/shared-mobile-ui';
import { IdentityAuthenticationErrors } from '@yellowladder/shared-types';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';
import { Button, HelperText, Text } from 'react-native-paper';
import type { AuthStackNavigationProp, AuthStackParamList } from '../navigation/auth-stack.types';
import { resetPasswordSchema, type ResetPasswordFormValues } from './reset-password.schema';

type ResetPasswordRouteProp = RouteProp<AuthStackParamList, 'ResetPassword'>;

/**
 * Password reset completion screen. The token comes in via a deep link —
 * the app's `linking.config.ts` maps `/reset-password/:token` to this
 * screen.
 */
export function ResetPasswordScreen() {
  const theme = useAppTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<AuthStackNavigationProp>();
  const route = useRoute<ResetPasswordRouteProp>();
  const token = route.params.token;
  const [completePasswordReset, { isLoading }] = useCompletePasswordResetMutation();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: '', confirmNewPassword: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await completePasswordReset({ token, newPassword: values.newPassword }).unwrap();
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    } catch (err) {
      const error = err as { status?: number; data?: { errorCode?: string } };
      if (error.data?.errorCode === IdentityAuthenticationErrors.PasswordResetTokenInvalid) {
        setServerError(t('auth.resetPassword.tokenInvalid'));
      } else if (error.data?.errorCode === IdentityAuthenticationErrors.PasswordResetTokenExpired) {
        setServerError(t('auth.resetPassword.tokenExpired'));
      } else {
        setServerError(t('common.somethingWentWrong'));
      }
    }
  });

  return (
    <AuthScreenLayout variant="solo" title={t('auth.resetPassword.title')}>
      <Text
        variant="bodyMedium"
        style={[
          styles.subtitle,
          { color: theme.colors.onSurfaceVariant, marginBottom: theme.spacing.lg },
        ]}
      >
        {t('auth.resetPassword.subtitle')}
      </Text>
      <Text
        variant="labelLarge"
        style={{
          color: errors.newPassword ? theme.colors.error : theme.colors.onSurface,
          marginBottom: 4,
        }}
      >
        {t('auth.resetPassword.passwordLabel')}
      </Text>
      <FormTextField
        control={control}
        name="newPassword"
        leftIcon="lock-outline"
        placeholder={t('auth.resetPassword.passwordLabel')}
        secureTextEntry
        autoCapitalize="none"
      />
      <Text
        variant="labelLarge"
        style={{
          color: errors.confirmNewPassword ? theme.colors.error : theme.colors.onSurface,
          marginBottom: 4,
        }}
      >
        {t('auth.resetPassword.confirmPasswordLabel')}
      </Text>
      <FormTextField
        control={control}
        name="confirmNewPassword"
        leftIcon="lock-outline"
        placeholder={t('auth.resetPassword.confirmPasswordLabel')}
        secureTextEntry
        autoCapitalize="none"
      />
      {serverError ? (
        <HelperText type="error" visible>
          {serverError}
        </HelperText>
      ) : null}
      <Button
        mode="contained"
        onPress={onSubmit}
        loading={isLoading}
        disabled={isLoading}
        style={[styles.submit, { marginTop: theme.spacing.md }]}
        contentStyle={styles.submitContent}
      >
        {t('auth.resetPassword.submit')}
      </Button>
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  subtitle: { textAlign: 'center' },
  submit: { borderRadius: 8 },
  submitContent: { paddingVertical: 8 },
});
