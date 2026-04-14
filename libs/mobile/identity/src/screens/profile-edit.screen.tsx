import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation } from '@react-navigation/native';
import {
  useChangePasswordMutation,
  useLogoutMutation,
  useUpdateCurrentUserMutation,
} from '@yellowladder/shared-api';
import { FormScreenLayout, FormTextField, useAppTheme } from '@yellowladder/shared-mobile-ui';
import {
  markUnauthenticated,
  selectCurrentUser,
  setUser,
  useAppDispatch,
  useAppSelector,
} from '@yellowladder/shared-store';
import { IdentityAuthenticationErrors } from '@yellowladder/shared-types';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';
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

      <FormTextField
        control={profileForm.control}
        name="firstName"
        label={t('profile.firstNameLabel')}
      />
      <FormTextField
        control={profileForm.control}
        name="lastName"
        label={t('profile.lastNameLabel')}
      />
      <TextInput
        mode="outlined"
        label={t('profile.emailLabel')}
        value={currentUser?.email ?? ''}
        editable={false}
        left={<TextInput.Icon icon="email-outline" />}
      />
      <FormTextField
        control={profileForm.control}
        name="phoneE164"
        label={t('profile.phoneLabel')}
        keyboardType="phone-pad"
        containerStyle={{ marginTop: theme.spacing.sm }}
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

      <FormTextField
        control={passwordForm.control}
        name="currentPassword"
        label={t('profile.currentPasswordLabel')}
        secureTextEntry
        autoCapitalize="none"
        containerStyle={{ marginVertical: theme.spacing.sm }}
      />
      <FormTextField
        control={passwordForm.control}
        name="newPassword"
        label={t('profile.newPasswordLabel')}
        secureTextEntry
        autoCapitalize="none"
      />
      <FormTextField
        control={passwordForm.control}
        name="confirmNewPassword"
        label={t('profile.confirmNewPasswordLabel')}
        secureTextEntry
        autoCapitalize="none"
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
