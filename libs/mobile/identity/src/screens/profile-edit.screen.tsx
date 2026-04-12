import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation } from '@react-navigation/native';
import {
  useChangePasswordMutation,
  useLogoutMutation,
  useUpdateCurrentUserMutation,
} from '@yellowladder/shared-api';
import { FormScreenLayout, useAppTheme } from '@yellowladder/shared-mobile-ui';
import {
  markUnauthenticated,
  selectCurrentUser,
  setUser,
  useAppDispatch,
  useAppSelector,
} from '@yellowladder/shared-store';
import { IdentityAuthenticationErrors } from '@yellowladder/shared-types';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Button, Divider, HelperText, Text, TextInput } from 'react-native-paper';
import { clearRefreshToken } from '../hooks/use-secure-refresh-token.hook';
import type { AuthStackNavigationProp } from '../navigation/auth-stack.types';
import {
  changePasswordSchema,
  profileEditSchema,
  type ChangePasswordFormValues,
  type ProfileEditFormValues,
} from './profile-edit.schema';

/**
 * Profile edit screen. Exposes name + phone edits, a disabled photo
 * button (backend returns 501 — TODO(feature-storage)), a password
 * change section, and a logout button.
 *
 * TODO(design): this screen does NOT have a Figma file in
 * `01-accounts-sign-up/designs/` (missing file 23). The current layout is
 * a functional placeholder — replace with the canonical design when it is
 * provided.
 */
export function ProfileEditScreen() {
  const theme = useAppTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<AuthStackNavigationProp>();
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector(selectCurrentUser);
  const [updateCurrentUser, { isLoading: isSavingProfile }] = useUpdateCurrentUserMutation();
  const [changePassword, { isLoading: isSavingPassword }] = useChangePasswordMutation();
  const [logout] = useLogoutMutation();
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [currentPwVisible, setCurrentPwVisible] = useState(false);
  const [newPwVisible, setNewPwVisible] = useState(false);
  const [confirmPwVisible, setConfirmPwVisible] = useState(false);

  const profileForm = useForm<ProfileEditFormValues>({
    resolver: zodResolver(profileEditSchema),
    defaultValues: {
      firstName: currentUser?.firstName ?? '',
      lastName: currentUser?.lastName ?? '',
      phoneE164: currentUser?.phoneE164 ?? '',
    },
  });

  const passwordForm = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmNewPassword: '' },
  });

  const onSaveProfile = profileForm.handleSubmit(async (values) => {
    setProfileError(null);
    try {
      const result = await updateCurrentUser(values).unwrap();
      dispatch(setUser(result.user));
    } catch {
      setProfileError(t('common.somethingWentWrong'));
    }
  });

  const onSavePassword = passwordForm.handleSubmit(async (values) => {
    setPasswordError(null);
    try {
      await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      }).unwrap();
      passwordForm.reset();
    } catch (err) {
      const error = err as { status?: number; data?: { errorCode?: string } };
      if (error.data?.errorCode === IdentityAuthenticationErrors.CurrentPasswordIncorrect) {
        setPasswordError(t('profile.currentPasswordIncorrect'));
      } else {
        setPasswordError(t('common.somethingWentWrong'));
      }
    }
  });

  const onLogout = async (): Promise<void> => {
    try {
      await logout().unwrap();
    } catch {
      // Ignore — we still tear down local state below.
    }
    await clearRefreshToken();
    dispatch(markUnauthenticated());
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  return (
    <FormScreenLayout title={t('profile.title')} showBrandArtwork={false}>
      <Text
        variant="labelLarge"
        style={{ color: theme.colors.onSurface, marginBottom: theme.spacing.xs }}
      >
        {t('profile.photoLabel')}
      </Text>
      <Button mode="outlined" icon="camera" disabled>
        {t('profile.changePhoto')}
      </Button>
      <HelperText type="info" visible>
        {t('profile.photoComingSoon')}
      </HelperText>

      <Divider style={{ marginVertical: theme.spacing.md }} />

      <Controller
        control={profileForm.control}
        name="firstName"
        render={({ field: { value, onChange, onBlur } }) => (
          <View style={{ marginBottom: theme.spacing.sm }}>
            <TextInput
              mode="outlined"
              label={t('profile.firstNameLabel')}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={Boolean(profileForm.formState.errors.firstName)}
            />
            <HelperText type="error" visible={Boolean(profileForm.formState.errors.firstName)}>
              {profileForm.formState.errors.firstName
                ? t(profileForm.formState.errors.firstName.message ?? 'validation.fieldRequired')
                : ' '}
            </HelperText>
          </View>
        )}
      />
      <Controller
        control={profileForm.control}
        name="lastName"
        render={({ field: { value, onChange, onBlur } }) => (
          <View style={{ marginBottom: theme.spacing.sm }}>
            <TextInput
              mode="outlined"
              label={t('profile.lastNameLabel')}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={Boolean(profileForm.formState.errors.lastName)}
            />
            <HelperText type="error" visible={Boolean(profileForm.formState.errors.lastName)}>
              {profileForm.formState.errors.lastName
                ? t(profileForm.formState.errors.lastName.message ?? 'validation.fieldRequired')
                : ' '}
            </HelperText>
          </View>
        )}
      />
      <TextInput
        mode="outlined"
        label={t('profile.emailLabel')}
        value={currentUser?.email ?? ''}
        editable={false}
        left={<TextInput.Icon icon="email-outline" />}
      />
      <Controller
        control={profileForm.control}
        name="phoneE164"
        render={({ field: { value, onChange, onBlur } }) => (
          <View style={{ marginTop: theme.spacing.sm, marginBottom: theme.spacing.sm }}>
            <TextInput
              mode="outlined"
              label={t('profile.phoneLabel')}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              keyboardType="phone-pad"
              error={Boolean(profileForm.formState.errors.phoneE164)}
            />
            <HelperText type="error" visible={Boolean(profileForm.formState.errors.phoneE164)}>
              {profileForm.formState.errors.phoneE164
                ? t(profileForm.formState.errors.phoneE164.message ?? 'validation.phoneInvalid')
                : ' '}
            </HelperText>
          </View>
        )}
      />

      {profileError ? (
        <HelperText type="error" visible>
          {profileError}
        </HelperText>
      ) : null}
      <Button
        mode="contained"
        onPress={onSaveProfile}
        loading={isSavingProfile}
        disabled={isSavingProfile}
      >
        {t('profile.saveProfile')}
      </Button>

      <Divider style={{ marginVertical: theme.spacing.md }} />

      <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
        {t('profile.changePasswordTitle')}
      </Text>

      <Controller
        control={passwordForm.control}
        name="currentPassword"
        render={({ field: { value, onChange, onBlur } }) => (
          <View style={{ marginVertical: theme.spacing.sm }}>
            <TextInput
              mode="outlined"
              label={t('profile.currentPasswordLabel')}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              secureTextEntry={!currentPwVisible}
              autoCapitalize="none"
              right={
                <TextInput.Icon
                  icon={currentPwVisible ? 'eye-off-outline' : 'eye-outline'}
                  onPress={() => setCurrentPwVisible((p) => !p)}
                />
              }
              error={Boolean(passwordForm.formState.errors.currentPassword)}
            />
            <HelperText
              type="error"
              visible={Boolean(passwordForm.formState.errors.currentPassword)}
            >
              {passwordForm.formState.errors.currentPassword
                ? t(
                    passwordForm.formState.errors.currentPassword.message ??
                      'validation.passwordRequired',
                  )
                : ' '}
            </HelperText>
          </View>
        )}
      />
      <Controller
        control={passwordForm.control}
        name="newPassword"
        render={({ field: { value, onChange, onBlur } }) => (
          <View style={{ marginBottom: theme.spacing.sm }}>
            <TextInput
              mode="outlined"
              label={t('profile.newPasswordLabel')}
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
              error={Boolean(passwordForm.formState.errors.newPassword)}
            />
            <HelperText type="error" visible={Boolean(passwordForm.formState.errors.newPassword)}>
              {passwordForm.formState.errors.newPassword
                ? t(
                    passwordForm.formState.errors.newPassword.message ??
                      'validation.passwordRequired',
                  )
                : ' '}
            </HelperText>
          </View>
        )}
      />
      <Controller
        control={passwordForm.control}
        name="confirmNewPassword"
        render={({ field: { value, onChange, onBlur } }) => (
          <View style={{ marginBottom: theme.spacing.sm }}>
            <TextInput
              mode="outlined"
              label={t('profile.confirmNewPasswordLabel')}
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
              error={Boolean(passwordForm.formState.errors.confirmNewPassword)}
            />
            <HelperText
              type="error"
              visible={Boolean(passwordForm.formState.errors.confirmNewPassword)}
            >
              {passwordForm.formState.errors.confirmNewPassword
                ? t(
                    passwordForm.formState.errors.confirmNewPassword.message ??
                      'validation.passwordsDoNotMatch',
                  )
                : ' '}
            </HelperText>
          </View>
        )}
      />
      {passwordError ? (
        <HelperText type="error" visible>
          {passwordError}
        </HelperText>
      ) : null}
      <Button
        mode="contained"
        onPress={onSavePassword}
        loading={isSavingPassword}
        disabled={isSavingPassword}
      >
        {t('profile.savePassword')}
      </Button>

      <Divider style={{ marginVertical: theme.spacing.md }} />

      <Button mode="outlined" onPress={onLogout} icon="logout">
        {t('profile.logout')}
      </Button>
    </FormScreenLayout>
  );
}

// Silence unused-styles lint.
void StyleSheet;
