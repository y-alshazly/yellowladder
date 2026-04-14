import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation } from '@react-navigation/native';
import { useLoginMutation } from '@yellowladder/shared-api';
import { AuthScreenLayout, FormTextField, useAppTheme } from '@yellowladder/shared-mobile-ui';
import { setCredentials, useAppDispatch } from '@yellowladder/shared-store';
import type { LoginResponse } from '@yellowladder/shared-types';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Button, HelperText, Text } from 'react-native-paper';
import { resolveResumeScreen } from '../hooks/use-auth-navigator-routing.hook';
import { saveRefreshToken } from '../hooks/use-secure-refresh-token.hook';
import type { AuthStackNavigationProp } from '../navigation/auth-stack.types';
import { loginRequestSchema, type LoginFormValues } from './login.schema';

/**
 * Login screen — matches `04-login-tablet.png`. White watermark background
 * with the `tappd` wordmark top-left (rendered by `AuthScreenLayout`'s
 * solo variant), a centred "Welcome back" heading, email / password
 * inputs, inline Forgot Password link, lavender "Sign in" CTA, and a
 * "Don't have an account? [Create Account]" footer.
 */
export function LoginScreen() {
  const theme = useAppTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<AuthStackNavigationProp>();
  const dispatch = useAppDispatch();
  const [login, { isLoading }] = useLoginMutation();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginRequestSchema),
    defaultValues: { email: 'jane.fresh10@gmail.com', password: 'Test12345678!' },
  });

  const onSubmit = async (values: LoginFormValues): Promise<void> => {
    setServerError(null);
    try {
      const result: LoginResponse = await login({
        email: values.email,
        password: values.password,
      }).unwrap();
      await saveRefreshToken(result.tokens);
      dispatch(
        setCredentials({
          tokens: result.tokens,
          user: result.user,
          resumeAt: result.resumeAt,
        }),
      );
      const next = resolveResumeScreen(result.resumeAt);
      if (next === 'VerifyEmail') {
        navigation.reset({
          index: 0,
          routes: [{ name: 'VerifyEmail', params: { email: result.user.email } }],
        });
      } else if (next === 'WizardBusinessProfile') {
        navigation.reset({ index: 0, routes: [{ name: 'WizardBusinessProfile' }] });
      }
      // else: navigator switches to Home via auth gate on the shell.
    } catch (err) {
      const error = err as { status?: number };
      if (error.status === 401) {
        setServerError(t('auth.login.invalidCredentials'));
      } else if (error.status === 429) {
        setServerError(t('auth.login.rateLimited'));
      } else {
        setServerError(t('common.somethingWentWrong'));
      }
    }
  };

  return (
    <AuthScreenLayout variant="solo" title={t('auth.login.title')}>
      <FormTextField
        control={control}
        name="email"
        label={t('auth.login.emailLabel')}
        leftIcon="email-outline"
        placeholder={t('auth.login.emailPlaceholder')}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
      />
      <View style={styles.passwordLabelRow}>
        <Text
          variant="labelLarge"
          style={{ color: errors.password ? theme.colors.error : theme.colors.onSurface }}
        >
          {t('auth.login.passwordLabel')}
        </Text>
        <Text
          accessibilityRole="link"
          onPress={() => navigation.navigate('ForgotPassword')}
          style={styles.forgotLink}
        >
          {t('auth.login.forgotPassword')}
        </Text>
      </View>
      <FormTextField
        control={control}
        name="password"
        leftIcon="lock-outline"
        placeholder={t('auth.login.passwordPlaceholder')}
        secureTextEntry
        autoComplete="password"
      />
      {serverError ? (
        <HelperText type="error" visible>
          {serverError}
        </HelperText>
      ) : null}
      <Button
        mode="contained"
        onPress={handleSubmit(onSubmit)}
        loading={isLoading}
        disabled={isLoading}
        style={[styles.signInButton, { marginTop: theme.spacing.md }]}
        contentStyle={styles.signInButtonContent}
      >
        {t('auth.login.signIn')}
      </Button>
      <View style={[styles.createAccountRow, { marginTop: theme.spacing.lg }]}>
        <Text style={{ color: theme.colors.onSurface }}>
          {t('auth.login.noAccount')}{' '}
          <Text
            accessibilityRole="link"
            onPress={() => navigation.navigate('SignupAccount')}
            style={styles.createAccountLink}
          >
            {t('auth.login.createAccount')}
          </Text>
        </Text>
      </View>
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  passwordLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  forgotLink: {
    textDecorationLine: 'underline',
    fontWeight: '400',
    fontSize: 16,
    color: '#737373',
  },
  signInButton: { borderRadius: 8 },
  signInButtonContent: { paddingVertical: 8 },
  createAccountRow: { alignItems: 'center' },
  createAccountLink: { textDecorationLine: 'underline', fontWeight: '600', color: '#737373' },
});
