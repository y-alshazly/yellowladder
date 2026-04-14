import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation } from '@react-navigation/native';
import { useInitiatePasswordResetMutation } from '@yellowladder/shared-api';
import { AuthScreenLayout, FormTextField, useAppTheme } from '@yellowladder/shared-mobile-ui';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Button, HelperText, Text } from 'react-native-paper';
import type { AuthStackNavigationProp } from '../navigation/auth-stack.types';
import { forgotPasswordSchema, type ForgotPasswordFormValues } from './forgot-password.schema';

/**
 * Email-only form that kicks off the password reset flow. The backend
 * always returns 200 regardless of whether the email exists, so success
 * state is static copy.
 */
export function ForgotPasswordScreen() {
  const theme = useAppTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<AuthStackNavigationProp>();
  const [initiatePasswordReset, { isLoading }] = useInitiatePasswordResetMutation();
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await initiatePasswordReset({ email: values.email }).unwrap();
      setSent(true);
    } catch {
      setServerError(t('common.somethingWentWrong'));
    }
  });

  return (
    <AuthScreenLayout variant="solo" title={t('auth.forgotPassword.title')}>
      <Text
        variant="bodyMedium"
        style={[
          styles.subtitle,
          { color: theme.colors.onSurfaceVariant, marginBottom: theme.spacing.lg },
        ]}
      >
        {t('auth.forgotPassword.subtitle')}
      </Text>

      {sent ? (
        <View>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
            {t('auth.forgotPassword.sent')}
          </Text>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('Login')}
            style={{ marginTop: theme.spacing.md }}
          >
            {t('auth.login.signIn')}
          </Button>
        </View>
      ) : (
        <View>
          <Text
            variant="labelLarge"
            style={{
              color: errors.email ? theme.colors.error : theme.colors.onSurface,
              marginBottom: 4,
            }}
          >
            {t('auth.forgotPassword.emailLabel')}
          </Text>
          <FormTextField
            control={control}
            name="email"
            leftIcon="email-outline"
            placeholder={t('auth.forgotPassword.emailLabel')}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
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
            {t('auth.forgotPassword.submit')}
          </Button>
        </View>
      )}
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  subtitle: { textAlign: 'center' },
  submit: { borderRadius: 8 },
  submitContent: { paddingVertical: 8 },
});
