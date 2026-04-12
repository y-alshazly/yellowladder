import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useCompletePasswordResetMutation } from '@yellowladder/shared-api';
import { AuthScreenLayout, useAppTheme } from '@yellowladder/shared-mobile-ui';
import { IdentityAuthenticationErrors } from '@yellowladder/shared-types';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Button, HelperText, Text, TextInput } from 'react-native-paper';
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
  const [newPwVisible, setNewPwVisible] = useState(false);
  const [confirmPwVisible, setConfirmPwVisible] = useState(false);

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
      <Controller
        control={control}
        name="newPassword"
        render={({ field: { value, onChange, onBlur } }) => (
          <View style={{ marginBottom: theme.spacing.sm }}>
            <TextInput
              mode="outlined"
              placeholder={t('auth.resetPassword.passwordLabel')}
              left={<TextInput.Icon icon="lock-outline" />}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              secureTextEntry={!newPwVisible}
              autoCapitalize="none"
              right={
                <TextInput.Icon
                  icon={newPwVisible ? 'eye-off-outline' : 'eye-outline'}
                  onPress={() => setNewPwVisible((p) => !p)}
                />
              }
              error={Boolean(errors.newPassword)}
            />
            <HelperText type="error" visible={Boolean(errors.newPassword)}>
              {errors.newPassword
                ? t(errors.newPassword.message ?? 'validation.passwordRequired')
                : ' '}
            </HelperText>
          </View>
        )}
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
      <Controller
        control={control}
        name="confirmNewPassword"
        render={({ field: { value, onChange, onBlur } }) => (
          <View style={{ marginBottom: theme.spacing.sm }}>
            <TextInput
              mode="outlined"
              placeholder={t('auth.resetPassword.confirmPasswordLabel')}
              left={<TextInput.Icon icon="lock-outline" />}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              secureTextEntry={!confirmPwVisible}
              autoCapitalize="none"
              right={
                <TextInput.Icon
                  icon={confirmPwVisible ? 'eye-off-outline' : 'eye-outline'}
                  onPress={() => setConfirmPwVisible((p) => !p)}
                />
              }
              error={Boolean(errors.confirmNewPassword)}
            />
            <HelperText type="error" visible={Boolean(errors.confirmNewPassword)}>
              {errors.confirmNewPassword
                ? t(errors.confirmNewPassword.message ?? 'validation.passwordsDoNotMatch')
                : ' '}
            </HelperText>
          </View>
        )}
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
