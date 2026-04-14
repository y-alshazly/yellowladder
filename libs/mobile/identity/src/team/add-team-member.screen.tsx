import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation } from '@react-navigation/native';
import { useCreateTeamMemberMutation, useGetShopsQuery } from '@yellowladder/shared-api';
import { FormTextField, SafeScreen, useAppTheme, useToast } from '@yellowladder/shared-mobile-ui';
import { UserRole } from '@yellowladder/shared-types';
import { useCallback, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import {
  Button,
  Checkbox,
  HelperText,
  IconButton,
  SegmentedButtons,
  Text,
} from 'react-native-paper';
import { PHONE_COUNTRY_CODES, PhoneInput } from '../components/phone-input.component';
import {
  createTeamMemberSchema,
  type CreateTeamMemberFormValues,
} from './create-team-member.schema';

export function AddTeamMemberScreen() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const navigation = useNavigation();
  const { showSuccess, showError } = useToast();
  const [createTeamMember, { isLoading: isCreating }] = useCreateTeamMemberMutation();
  const { data: shopsData } = useGetShopsQuery({});
  const shops = useMemo(() => shopsData?.data ?? [], [shopsData]);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateTeamMemberFormValues>({
    resolver: zodResolver(createTeamMemberSchema),
    defaultValues: {
      email: '',
      firstName: '',
      lastName: '',
      phoneCountryCode: 'GB',
      phoneNationalNumber: '',
      countryCode: 'GB',
      role: UserRole.Employee,
      shopIds: [],
      password: '',
    },
  });

  const goBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const onSubmit = useCallback(
    async (values: CreateTeamMemberFormValues) => {
      try {
        const dialInfo =
          PHONE_COUNTRY_CODES.find((c) => c.code === values.phoneCountryCode) ??
          PHONE_COUNTRY_CODES[0];
        const phoneE164 = `${dialInfo?.dialCode ?? '+44'}${values.phoneNationalNumber}`;

        await createTeamMember({
          email: values.email,
          firstName: values.firstName,
          lastName: values.lastName,
          phoneE164,
          phoneCountryCode: values.phoneCountryCode,
          countryCode: values.countryCode,
          role: values.role,
          shopIds: values.shopIds,
          password: values.password,
        }).unwrap();

        showSuccess(t('team.memberCreated'));
        goBack();
      } catch {
        showError(t('common.somethingWentWrong'));
      }
    },
    [createTeamMember, showSuccess, showError, t, goBack],
  );

  return (
    <SafeScreen noPadding>
      <View
        style={[
          styles.header,
          { paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.sm },
        ]}
      >
        <Text variant="titleLarge" style={styles.title}>
          {t('team.addMember')}
        </Text>
        <IconButton
          icon="close"
          mode="outlined"
          size={20}
          onPress={goBack}
          accessibilityLabel={t('common.close')}
        />
      </View>

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
                      countryCode={ccValue}
                      nationalNumber={value}
                      onChangeCountryCode={ccOnChange}
                      onChangeNationalNumber={onChange}
                      error={
                        errors.phoneNationalNumber
                          ? t(errors.phoneNationalNumber.message ?? 'validation.phoneRequired')
                          : undefined
                      }
                    />
                  )}
                />
              )}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text
              variant="labelLarge"
              style={{
                color: errors.role ? theme.colors.error : theme.colors.onSurface,
                marginBottom: 4,
              }}
            >
              {t('team.role')}
            </Text>
            <Controller
              control={control}
              name="role"
              render={({ field: { value, onChange } }) => (
                <>
                  <SegmentedButtons
                    value={value}
                    onValueChange={onChange}
                    buttons={[
                      { value: UserRole.CompanyAdmin, label: t('team.roleAdmin') },
                      { value: UserRole.ShopManager, label: t('team.roleManager') },
                      { value: UserRole.Employee, label: t('team.roleClerk') },
                    ]}
                  />
                  {errors.role ? (
                    <HelperText type="error" visible>
                      {t(errors.role.message ?? 'validation.fieldRequired')}
                    </HelperText>
                  ) : null}
                </>
              )}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text variant="labelLarge" style={{ color: theme.colors.onSurface, marginBottom: 4 }}>
              {t('team.shops')}
            </Text>
            <Controller
              control={control}
              name="shopIds"
              render={({ field: { value, onChange } }) => (
                <View>
                  {shops.map((shop) => {
                    const isChecked = value.includes(shop.id);
                    return (
                      <Checkbox.Item
                        key={shop.id}
                        label={shop.name}
                        status={isChecked ? 'checked' : 'unchecked'}
                        onPress={() => {
                          if (isChecked) {
                            onChange(value.filter((id: string) => id !== shop.id));
                          } else {
                            onChange([...value, shop.id]);
                          }
                        }}
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
              )}
            />
          </View>

          <FormTextField
            control={control}
            name="password"
            label={t('team.password')}
            leftIcon="lock-outline"
            secureTextEntry
            autoCapitalize="none"
            autoComplete="off"
            textContentType="newPassword"
          />
        </ScrollView>

        <View
          style={[
            styles.footer,
            { paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md },
          ]}
        >
          <Button
            mode="contained"
            onPress={handleSubmit(onSubmit)}
            loading={isCreating}
            disabled={isCreating}
            style={styles.saveButton}
          >
            {t('common.save')}
          </Button>
        </View>
      </KeyboardAvoidingView>
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
  fieldGroup: {
    marginBottom: 16,
  },
  checkboxItem: {
    paddingVertical: 2,
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
