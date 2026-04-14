import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import {
  useAdminResetPasswordMutation,
  useAssignTeamMemberShopsMutation,
  useDeleteTeamMemberMutation,
  useGetShopsQuery,
  useGetTeamMemberByIdQuery,
  useUpdateTeamMemberMutation,
  useUpdateTeamMemberRoleMutation,
} from '@yellowladder/shared-api';
import {
  DeleteConfirmDialog,
  FormTextField,
  HasPermission,
  SafeScreen,
  useAppTheme,
  useToast,
} from '@yellowladder/shared-mobile-ui';
import { selectCurrentUser, useAppSelector } from '@yellowladder/shared-store';
import { Permissions, UserRole } from '@yellowladder/shared-types';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  Button,
  Checkbox,
  IconButton,
  SegmentedButtons,
  Text,
} from 'react-native-paper';
import { PHONE_COUNTRY_CODES, PhoneInput } from '../components/phone-input.component';
import { editTeamMemberSchema, type EditTeamMemberFormValues } from './edit-team-member.schema';

type MemberDetailRouteParams = {
  MemberDetail: { memberId: string };
  [key: string]: object | undefined;
};

export function MemberDetailScreen() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<MemberDetailRouteParams, 'MemberDetail'>>();
  const { memberId } = route.params;
  const { showSuccess, showError } = useToast();
  const user = useAppSelector(selectCurrentUser);

  const { data: member, isLoading } = useGetTeamMemberByIdQuery(memberId);
  const { data: shopsData } = useGetShopsQuery({});
  const shops = useMemo(() => shopsData?.data ?? [], [shopsData]);

  const [updateTeamMember, { isLoading: isUpdating }] = useUpdateTeamMemberMutation();
  const [updateRole, { isLoading: isUpdatingRole }] = useUpdateTeamMemberRoleMutation();
  const [assignShops, { isLoading: isAssigningShops }] = useAssignTeamMemberShopsMutation();
  const [deleteTeamMember, { isLoading: isDeleting }] = useDeleteTeamMemberMutation();
  const [adminResetPassword, { isLoading: isResetting }] = useAdminResetPasswordMutation();

  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [resetDialogVisible, setResetDialogVisible] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedShopIds, setSelectedShopIds] = useState<string[]>([]);

  const isBusy = isUpdating || isUpdatingRole || isAssigningShops || isDeleting || isResetting;

  const parsedPhone = useMemo(() => {
    if (!member) return { countryCode: 'GB', nationalNumber: '' };
    const dialInfo = PHONE_COUNTRY_CODES.find((c) => c.code === member.phoneCountryCode);
    const dialCode = dialInfo?.dialCode ?? '+44';
    const nationalNumber = member.phoneE164.startsWith(dialCode)
      ? member.phoneE164.slice(dialCode.length)
      : member.phoneE164;
    return { countryCode: member.phoneCountryCode, nationalNumber };
  }, [member]);

  const { control, handleSubmit, reset } = useForm<EditTeamMemberFormValues>({
    resolver: zodResolver(editTeamMemberSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phoneCountryCode: 'GB',
      phoneNationalNumber: '',
      email: '',
    },
  });

  useEffect(() => {
    if (member) {
      reset({
        firstName: member.firstName ?? '',
        lastName: member.lastName ?? '',
        phoneCountryCode: parsedPhone.countryCode,
        phoneNationalNumber: parsedPhone.nationalNumber,
        email: member.email,
      });
      setSelectedRole(member.role);
      setSelectedShopIds(member.shopIds);
    }
  }, [member, parsedPhone, reset]);

  const goBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleSaveProfile = useCallback(
    async (values: EditTeamMemberFormValues) => {
      try {
        const dialInfo =
          PHONE_COUNTRY_CODES.find((c) => c.code === values.phoneCountryCode) ??
          PHONE_COUNTRY_CODES[0];
        const phoneE164 = values.phoneNationalNumber
          ? `${dialInfo?.dialCode ?? '+44'}${values.phoneNationalNumber}`
          : undefined;

        await updateTeamMember({
          id: memberId,
          body: {
            firstName: values.firstName || undefined,
            lastName: values.lastName || undefined,
            email: values.email || undefined,
            phoneE164,
            phoneCountryCode: values.phoneCountryCode || undefined,
          },
        }).unwrap();

        if (selectedRole && member && selectedRole !== member.role) {
          await updateRole({
            id: memberId,
            body: { role: selectedRole as typeof UserRole.CompanyAdmin },
          }).unwrap();
        }

        const shopIdsChanged =
          member &&
          (selectedShopIds.length !== member.shopIds.length ||
            selectedShopIds.some((id) => !member.shopIds.includes(id)));
        if (shopIdsChanged) {
          await assignShops({
            id: memberId,
            body: { shopIds: selectedShopIds },
          }).unwrap();
        }

        showSuccess(t('team.memberUpdated'));
        goBack();
      } catch {
        showError(t('common.somethingWentWrong'));
      }
    },
    [
      memberId,
      member,
      selectedRole,
      selectedShopIds,
      updateTeamMember,
      updateRole,
      assignShops,
      showSuccess,
      showError,
      t,
      goBack,
    ],
  );

  const handleDelete = useCallback(async () => {
    setDeleteDialogVisible(false);
    try {
      await deleteTeamMember(memberId).unwrap();
      showSuccess(t('team.memberDeleted'));
      goBack();
    } catch {
      showError(t('common.somethingWentWrong'));
    }
  }, [memberId, deleteTeamMember, showSuccess, showError, t, goBack]);

  const handleResetPassword = useCallback(async () => {
    setResetDialogVisible(false);
    try {
      await adminResetPassword(memberId).unwrap();
      showSuccess(t('team.passwordResetSent'));
    } catch {
      showError(t('common.somethingWentWrong'));
    }
  }, [memberId, adminResetPassword, showSuccess, showError, t]);

  const toggleShop = useCallback((shopId: string) => {
    setSelectedShopIds((current) =>
      current.includes(shopId) ? current.filter((id) => id !== shopId) : [...current, shopId],
    );
  }, []);

  const assignableRoles = useMemo(() => {
    const hierarchy: UserRole[] = [
      UserRole.SuperAdmin,
      UserRole.CompanyAdmin,
      UserRole.ShopManager,
      UserRole.Employee,
    ];
    const userIndex = hierarchy.indexOf(user?.role ?? UserRole.Employee);
    return [
      { value: UserRole.CompanyAdmin, label: t('team.roleAdmin'), disabled: userIndex > 1 },
      { value: UserRole.ShopManager, label: t('team.roleManager'), disabled: userIndex > 2 },
      { value: UserRole.Employee, label: t('team.roleClerk'), disabled: false },
    ];
  }, [user?.role, t]);

  return (
    <SafeScreen noPadding>
      <View
        style={[
          styles.header,
          { paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.sm },
        ]}
      >
        <Text variant="titleLarge" style={styles.title}>
          {t('team.editMember')}
        </Text>
        <IconButton
          icon="close"
          mode="outlined"
          size={20}
          onPress={goBack}
          accessibilityLabel={t('common.close')}
        />
      </View>

      {isLoading || !member ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[
              styles.scrollContent,
              { paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md },
            ]}
          >
            <FormTextField
              control={control}
              name="email"
              label={t('team.email')}
              leftIcon="email-outline"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <FormTextField
              control={control}
              name="firstName"
              label={t('team.firstName')}
              leftIcon="account-outline"
            />

            <FormTextField
              control={control}
              name="lastName"
              label={t('team.lastName')}
              leftIcon="account-outline"
            />

            <View style={styles.fieldGroup}>
              <Controller
                control={control}
                name="phoneNationalNumber"
                render={({ field: { value, onChange } }) => (
                  <Controller
                    control={control}
                    name="phoneCountryCode"
                    render={({ field: { value: ccValue, onChange: ccOnChange } }) => (
                      <PhoneInput
                        label={t('team.phone')}
                        placeholder={t('team.phone')}
                        countryCode={ccValue ?? 'GB'}
                        nationalNumber={value ?? ''}
                        onChangeCountryCode={ccOnChange}
                        onChangeNationalNumber={onChange}
                        error={undefined}
                      />
                    )}
                  />
                )}
              />
            </View>

            <HasPermission userRole={user?.role ?? null} permission={Permissions.UsersManageRoles}>
              <View style={styles.fieldGroup}>
                <Text
                  variant="labelLarge"
                  style={{ color: theme.colors.onSurface, marginBottom: 4 }}
                >
                  {t('team.role')}
                </Text>
                <SegmentedButtons
                  value={selectedRole}
                  onValueChange={setSelectedRole}
                  buttons={assignableRoles}
                />
              </View>
            </HasPermission>

            <HasPermission userRole={user?.role ?? null} permission={Permissions.UsersAssignShops}>
              <View style={styles.fieldGroup}>
                <Text
                  variant="labelLarge"
                  style={{ color: theme.colors.onSurface, marginBottom: 4 }}
                >
                  {t('team.shops')}
                </Text>
                {shops.map((shop) => {
                  const isChecked = selectedShopIds.includes(shop.id);
                  return (
                    <Checkbox.Item
                      key={shop.id}
                      label={shop.name}
                      status={isChecked ? 'checked' : 'unchecked'}
                      onPress={() => toggleShop(shop.id)}
                      style={styles.checkboxItem}
                    />
                  );
                })}
                {shops.length === 0 ? (
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    {t('stores.noStores')}
                  </Text>
                ) : null}
              </View>
            </HasPermission>

            <View style={[styles.dangerActions, { marginTop: theme.spacing.lg }]}>
              <HasPermission
                userRole={user?.role ?? null}
                permission={Permissions.UsersResetPassword}
              >
                <Button
                  mode="outlined"
                  onPress={() => setResetDialogVisible(true)}
                  disabled={isBusy}
                  icon="lock-reset"
                  style={{ marginBottom: theme.spacing.sm }}
                >
                  {t('team.resetPassword')}
                </Button>
              </HasPermission>

              <HasPermission userRole={user?.role ?? null} permission={Permissions.UsersDelete}>
                <Button
                  mode="outlined"
                  onPress={() => setDeleteDialogVisible(true)}
                  disabled={isBusy}
                  icon="account-remove"
                  textColor={theme.colors.error}
                  style={{ borderColor: theme.colors.error }}
                >
                  {t('team.deleteMember')}
                </Button>
              </HasPermission>
            </View>
          </ScrollView>

          <View
            style={[
              styles.footer,
              { paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md },
            ]}
          >
            <HasPermission userRole={user?.role ?? null} permission={Permissions.UsersUpdate}>
              <Button
                mode="contained"
                onPress={handleSubmit(handleSaveProfile)}
                loading={isBusy}
                disabled={isBusy}
                style={styles.saveButton}
              >
                {t('common.save')}
              </Button>
            </HasPermission>
          </View>
        </KeyboardAvoidingView>
      )}

      <DeleteConfirmDialog
        visible={deleteDialogVisible}
        title={t('team.deleteMember')}
        message={t('team.confirmDelete')}
        confirmLabel={t('team.deleteMember')}
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialogVisible(false)}
      />

      <DeleteConfirmDialog
        visible={resetDialogVisible}
        title={t('team.resetPassword')}
        message={t('team.confirmResetPassword', { email: member?.email ?? '' })}
        confirmLabel={t('team.resetPassword')}
        destructive={false}
        onConfirm={handleResetPassword}
        onCancel={() => setResetDialogVisible(false)}
      />
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    flex: 1,
    fontWeight: '700',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fieldGroup: { marginBottom: 16 },
  checkboxItem: { paddingVertical: 2 },
  dangerActions: {
    alignItems: 'stretch',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  saveButton: {
    borderRadius: 8,
    minWidth: 140,
  },
});
