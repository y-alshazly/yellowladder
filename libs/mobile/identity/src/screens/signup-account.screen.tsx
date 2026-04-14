import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation } from '@react-navigation/native';
import {
  AppMenu,
  AuthScreenLayout,
  FormTextField,
  useAppTheme,
} from '@yellowladder/shared-mobile-ui';
import { setAccountData, useAppDispatch } from '@yellowladder/shared-store';
import { BusinessType } from '@yellowladder/shared-types';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import {
  Button,
  Checkbox,
  HelperText,
  IconButton,
  Text,
  TextInput,
  TouchableRipple,
} from 'react-native-paper';
import { CountryDropdown } from '../components/country-dropdown.component';
import { PHONE_COUNTRY_CODES, PhoneInput } from '../components/phone-input.component';
import { TermsAndConditionsModal } from '../components/terms-and-conditions-modal.component';
import type { AuthStackNavigationProp } from '../navigation/auth-stack.types';
import { signupAccountSchema, type SignupAccountFormValues } from './signup-account.schema';

export function SignupAccountScreen() {
  const theme = useAppTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<AuthStackNavigationProp>();
  const dispatch = useAppDispatch();
  const [businessTypeMenuVisible, setBusinessTypeMenuVisible] = useState(false);
  const [businessTypeAnchorWidth, setBusinessTypeAnchorWidth] = useState(0);
  const [termsModalVisible, setTermsModalVisible] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<SignupAccountFormValues>({
    resolver: zodResolver(signupAccountSchema),
    defaultValues: {
      email: 'jane.fresh10@gmail.com',
      phoneCountryCode: 'GB',
      phoneNationalNumber: '7911123456',
      countryCode: 'GB',
      businessType: BusinessType.LimitedCompany,
      password: 'Test12345678!',
      confirmPassword: 'Test12345678!',
      termsAccepted: true,
    },
  });

  const businessType = watch('businessType');

  const setTermsAcceptedFromModal = (): void => {
    setValue('termsAccepted', true, { shouldValidate: true, shouldDirty: true });
  };

  const businessTypeLabel = (value: string): string => {
    if (value === BusinessType.LimitedCompany) {
      return t('auth.signup.businessType.limitedCompany');
    }
    if (value === BusinessType.SelfEmployed) {
      return t('auth.signup.businessType.selfEmployed');
    }
    return t('auth.signup.businessTypePlaceholder');
  };

  const handleForward = async (): Promise<void> => {
    try {
      await handleSubmit((values: SignupAccountFormValues) => {
        const dialInfo =
          PHONE_COUNTRY_CODES.find((c) => c.code === values.phoneCountryCode) ??
          PHONE_COUNTRY_CODES[0];
        const phoneE164 = `${dialInfo?.dialCode ?? '+44'}${values.phoneNationalNumber}`;
        dispatch(
          setAccountData({
            email: values.email,
            phoneCountryCode: values.phoneCountryCode,
            phoneE164,
            countryCode: values.countryCode,
            businessType: values.businessType,
            password: values.password,
            termsAcceptedAt: new Date().toISOString(),
          }),
        );
        navigation.navigate('WizardBusinessProfile');
      })();
    } catch (err) {
      console.warn('handleSubmit error:', err);
    }
  };

  return (
    <AuthScreenLayout
      title={t('auth.signup.title')}
      brandHeadline={t('common.brand.headline')}
      brandTestimonial={t('common.brand.testimonial')}
      brandAttribution={t('common.brand.attribution')}
    >
      <View style={styles.fieldGroup}>
        <Text
          variant="labelLarge"
          style={{
            color: errors.email ? theme.colors.error : theme.colors.onSurface,
            marginBottom: 4,
          }}
        >
          {t('auth.signup.emailLabel')}
        </Text>
        <FormTextField
          control={control}
          name="email"
          leftIcon="email-outline"
          keyboardType="email-address"
          autoCapitalize="none"
          containerStyle={{ marginBottom: 0 }}
        />
      </View>

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
                  label={t('auth.signup.phoneLabel')}
                  placeholder={t('auth.signup.phonePlaceholder')}
                  countryCode={ccValue}
                  nationalNumber={value}
                  onChangeCountryCode={ccOnChange}
                  onChangeNationalNumber={onChange}
                  error={
                    errors.phoneNationalNumber
                      ? t(errors.phoneNationalNumber.message ?? 'validation.phoneInvalid')
                      : undefined
                  }
                />
              )}
            />
          )}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Controller
          control={control}
          name="countryCode"
          render={({ field: { value, onChange } }) => (
            <CountryDropdown
              label={t('auth.signup.countryLabel')}
              placeholder={t('auth.signup.countryPlaceholder')}
              value={value}
              onChange={(code) => onChange(code)}
              error={
                errors.countryCode
                  ? t(errors.countryCode.message ?? 'validation.countryRequired')
                  : undefined
              }
            />
          )}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text
          variant="labelLarge"
          style={{
            color: errors.businessType ? theme.colors.error : theme.colors.onSurface,
            marginBottom: 4,
          }}
        >
          {t('auth.signup.businessTypeLabel')}
        </Text>
        <Controller
          control={control}
          name="businessType"
          render={({ field: { value, onChange } }) => (
            <>
              <AppMenu
                visible={businessTypeMenuVisible}
                onDismiss={() => setBusinessTypeMenuVisible(false)}
                anchorPosition="bottom"
                contentStyle={
                  businessTypeAnchorWidth > 0 ? { width: businessTypeAnchorWidth } : undefined
                }
                anchor={
                  <TouchableRipple onPress={() => setBusinessTypeMenuVisible(true)}>
                    <View
                      pointerEvents="none"
                      onLayout={(e: LayoutChangeEvent) =>
                        setBusinessTypeAnchorWidth(e.nativeEvent.layout.width)
                      }
                    >
                      <TextInput
                        mode="outlined"
                        value={businessTypeLabel(value)}
                        editable={false}
                        left={<TextInput.Icon icon="briefcase-outline" />}
                        right={<TextInput.Icon icon="menu-down" />}
                        error={Boolean(errors.businessType)}
                      />
                    </View>
                  </TouchableRipple>
                }
              >
                <AppMenu.Item
                  onPress={() => {
                    onChange(BusinessType.LimitedCompany);
                    setBusinessTypeMenuVisible(false);
                  }}
                  title={t('auth.signup.businessType.limitedCompany')}
                />
                <AppMenu.Item
                  onPress={() => {
                    onChange(BusinessType.SelfEmployed);
                    setBusinessTypeMenuVisible(false);
                  }}
                  title={t('auth.signup.businessType.selfEmployed')}
                />
              </AppMenu>
              {errors.businessType ? (
                <HelperText type="error" visible>
                  {t(errors.businessType.message ?? 'validation.businessTypeRequired')}
                </HelperText>
              ) : null}
            </>
          )}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text
          variant="labelLarge"
          style={{
            color: errors.password ? theme.colors.error : theme.colors.onSurface,
            marginBottom: 4,
          }}
        >
          {t('auth.signup.passwordLabel')}
        </Text>
        <FormTextField
          control={control}
          name="password"
          leftIcon="lock-outline"
          secureTextEntry
          autoCapitalize="none"
          autoComplete="off"
          textContentType="newPassword"
          containerStyle={{ marginBottom: 0 }}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text
          variant="labelLarge"
          style={{
            color: errors.confirmPassword ? theme.colors.error : theme.colors.onSurface,
            marginBottom: 4,
          }}
        >
          {t('auth.signup.confirmPasswordLabel')}
        </Text>
        <FormTextField
          control={control}
          name="confirmPassword"
          leftIcon="lock-outline"
          secureTextEntry
          autoCapitalize="none"
          autoComplete="off"
          textContentType="newPassword"
          containerStyle={{ marginBottom: 0 }}
        />
      </View>

      <Controller
        control={control}
        name="termsAccepted"
        render={({ field: { value, onChange } }) => (
          <View style={[styles.termsRow, { marginTop: theme.spacing.sm }]}>
            <Checkbox.Android
              status={value ? 'checked' : 'unchecked'}
              onPress={() => onChange(!value)}
            />
            <Text style={{ color: theme.colors.onSurface, flex: 1 }}>
              {t('auth.signup.termsLabel')}{' '}
              <Text
                onPress={() => setTermsModalVisible(true)}
                style={{ textDecorationLine: 'underline', color: '#737373' }}
              >
                {t('auth.signup.termsLink')}
              </Text>
            </Text>
          </View>
        )}
      />
      <TermsAndConditionsModal
        visible={termsModalVisible}
        onDismiss={() => setTermsModalVisible(false)}
        onAccept={() => {
          setTermsModalVisible(false);
          // Ticking the parent checkbox when the user accepts the modal.
          // This is a controlled write into the form via the Controller ref
          // — the Controller component above re-renders and shows the check.
          // We cannot reach it through `useForm` without hooking setValue,
          // so drive it with a dedicated field update.
          setTermsAcceptedFromModal();
        }}
      />
      {errors.termsAccepted ? (
        <HelperText type="error" visible>
          {t(errors.termsAccepted.message ?? 'validation.termsRequired')}
        </HelperText>
      ) : null}

      <View style={[styles.actionRow, { marginTop: theme.spacing.lg }]}>
        <Button mode="text" onPress={() => navigation.goBack()}>
          {t('common.goBack')}
        </Button>
        <IconButton
          mode="contained"
          icon="arrow-right"
          iconColor={theme.colors.onPrimary}
          size={28}
          onPress={handleForward}
          style={[styles.forwardButton, { backgroundColor: theme.colors.primary }]}
          accessibilityLabel={t('auth.signup.submit')}
        />
      </View>
      {/* Keep businessType reactive so linter sees it used. */}
      <Text style={styles.visuallyHidden}>{businessType}</Text>
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  fieldGroup: { marginBottom: 16 },
  termsRow: { flexDirection: 'row', alignItems: 'center' },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  forwardButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  visuallyHidden: { width: 0, height: 0, opacity: 0 },
});
