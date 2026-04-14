import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation } from '@react-navigation/native';
import { FormScreenLayout, FormTextField, useAppTheme } from '@yellowladder/shared-mobile-ui';
import {
  confirmAuthorisation,
  patchSelfEmployed,
  useAppDispatch,
} from '@yellowladder/shared-store';
import { useCallback, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Checkbox, HelperText, Switch, Text, TextInput, TouchableRipple } from 'react-native-paper';
import { DatePickerModal } from 'react-native-paper-dates';
import { WizardBottomBar } from '../components/wizard-bottom-bar.component';
import { useRegisterAndAdvance } from '../hooks/use-register-and-advance.hook';
import { useWizardDraft } from '../hooks/use-wizard-draft.hook';
import type { AuthStackNavigationProp } from '../navigation/auth-stack.types';
import {
  wizardSelfEmployedSchema,
  type WizardSelfEmployedFormValues,
} from './wizard-self-employed.schema';

const WIZARD_TOTAL_STEPS = 4;

/**
 * Wizard step 3 (SELF_EMPLOYED branch). Collects the self-employed details
 * and advances to OTP verification, which then fires the atomic
 * `POST /companies` call.
 *
 * TODO(design): this screen does NOT have a Figma file in
 * `01-accounts-sign-up/designs/` (missing file 17). The current layout is
 * copied from `architect-output.md` and verified against the backend
 * `SelfEmployedDetailsDto`. Replace with the canonical design when it is
 * provided. Until then the fields match the wizard-step 3 dot (first-name,
 * last-name, job position, DOB, legal business name, trading name,
 * registered address, "store same address" toggle and authorisation
 * confirmation checkbox).
 */
export function WizardSelfEmployedScreen() {
  const theme = useAppTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<AuthStackNavigationProp>();
  const dispatch = useAppDispatch();
  const { state: draft } = useWizardDraft();
  const [serverError, setServerError] = useState<string | null>(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const {
    register,
    isRegistering,
    error: registerError,
    clearError: clearRegisterError,
  } = useRegisterAndAdvance();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<WizardSelfEmployedFormValues>({
    resolver: zodResolver(wizardSelfEmployedSchema),
    defaultValues: {
      firstName: draft.selfEmployed.firstName ?? '',
      lastName: draft.selfEmployed.lastName ?? '',
      jobPosition: draft.selfEmployed.jobPosition ?? '',
      dateOfBirth: draft.selfEmployed.dateOfBirth ?? '',
      legalBusinessName: draft.selfEmployed.legalBusinessName ?? '',
      tradingName: draft.selfEmployed.tradingName ?? '',
      registeredAddressLine1: draft.selfEmployed.registeredAddress?.line1 ?? '',
      registeredAddressCity: draft.selfEmployed.registeredAddress?.city ?? '',
      registeredAddressPostalCode: draft.selfEmployed.registeredAddress?.postalCode ?? '',
      registeredAddressCountryCode: draft.selfEmployed.registeredAddress?.countryCode ?? 'GB',
      storeIsSameAddress: draft.selfEmployed.storeIsSameAddress ?? true,
      authorisationConfirmed: true as const,
    },
  });

  const onDismissDatePicker = useCallback(() => {
    setDatePickerOpen(false);
  }, []);

  const onForward = handleSubmit(async (values) => {
    setServerError(null);
    clearRegisterError();
    const nowIso = new Date().toISOString();
    dispatch(
      patchSelfEmployed({
        businessType: 'SELF_EMPLOYED',
        firstName: values.firstName,
        lastName: values.lastName,
        jobPosition: values.jobPosition,
        dateOfBirth: values.dateOfBirth,
        legalBusinessName: values.legalBusinessName,
        tradingName: values.tradingName,
        registeredAddress: {
          line1: values.registeredAddressLine1,
          line2: null,
          city: values.registeredAddressCity,
          region: null,
          postalCode: values.registeredAddressPostalCode,
          countryCode: values.registeredAddressCountryCode,
        },
        storeIsSameAddress: values.storeIsSameAddress,
      }),
    );
    dispatch(confirmAuthorisation(nowIso));

    if (!draft.accountData?.email) {
      setServerError(t('common.somethingWentWrong'));
      return;
    }
    // Register the user before navigating to OTP. Registration errors stay
    // on this page so the OTP screen only has to worry about OTP errors.
    const ok = await register(draft.accountData);
    if (!ok) return;
    navigation.navigate('VerifyEmail', { email: draft.accountData.email });
  });

  return (
    <FormScreenLayout
      title={t('wizard.selfEmployed.title')}
      brandHeadline={t('common.brand.headline')}
      brandTestimonial={t('common.brand.testimonial')}
      brandAttribution={t('common.brand.attribution')}
      footer={
        <WizardBottomBar
          currentStep={3}
          totalSteps={WIZARD_TOTAL_STEPS}
          onBack={() => navigation.goBack()}
          onForward={onForward}
          forwardDisabled={isRegistering}
        />
      }
    >
      <FormTextField
        control={control}
        name="firstName"
        label={t('wizard.selfEmployed.firstNameLabel')}
        placeholder={t('wizard.selfEmployed.firstNameLabel')}
      />
      <FormTextField
        control={control}
        name="lastName"
        label={t('wizard.selfEmployed.lastNameLabel')}
        placeholder={t('wizard.selfEmployed.lastNameLabel')}
      />
      <FormTextField
        control={control}
        name="jobPosition"
        label={t('wizard.selfEmployed.jobPositionLabel')}
        placeholder={t('wizard.selfEmployed.jobPositionLabel')}
      />
      <Controller
        control={control}
        name="dateOfBirth"
        render={({ field: { value, onChange } }) => {
          const parsedDate = value ? new Date(value) : undefined;
          const onConfirmDate = (params: { date: Date | undefined }): void => {
            setDatePickerOpen(false);
            if (params.date) {
              const iso = params.date.toISOString().split('T')[0];
              onChange(iso ?? '');
            }
          };
          return (
            <View style={{ marginBottom: theme.spacing.sm }}>
              <Text
                variant="labelLarge"
                style={{
                  color: errors.dateOfBirth ? theme.colors.error : theme.colors.onSurface,
                  marginBottom: 4,
                }}
              >
                {t('wizard.selfEmployed.dateOfBirthLabel')}
              </Text>
              <TouchableRipple onPress={() => setDatePickerOpen(true)}>
                <View pointerEvents="none">
                  <TextInput
                    mode="outlined"
                    placeholder={t('wizard.selfEmployed.dateFormat')}
                    value={value}
                    editable={false}
                    left={<TextInput.Icon icon="calendar" />}
                    error={Boolean(errors.dateOfBirth)}
                  />
                </View>
              </TouchableRipple>
              <DatePickerModal
                locale="en"
                mode="single"
                visible={datePickerOpen}
                onDismiss={onDismissDatePicker}
                date={parsedDate}
                onConfirm={onConfirmDate}
              />
              <HelperText type="error" visible={Boolean(errors.dateOfBirth)}>
                {errors.dateOfBirth
                  ? t(errors.dateOfBirth.message ?? 'validation.dateInvalid')
                  : ' '}
              </HelperText>
            </View>
          );
        }}
      />
      <FormTextField
        control={control}
        name="legalBusinessName"
        label={t('wizard.selfEmployed.legalBusinessNameLabel')}
        placeholder={t('wizard.selfEmployed.legalBusinessNameLabel')}
      />
      <FormTextField
        control={control}
        name="tradingName"
        label={t('wizard.selfEmployed.tradingNameLabel')}
        placeholder={t('wizard.selfEmployed.tradingNameLabel')}
      />
      <Text
        variant="labelLarge"
        style={{ color: theme.colors.onSurface, marginBottom: theme.spacing.xs }}
      >
        {t('wizard.selfEmployed.registeredAddressLabel')}
      </Text>
      <FormTextField
        control={control}
        name="registeredAddressLine1"
        label={t('wizard.common.address.line1')}
        placeholder={t('wizard.common.address.line1')}
      />
      <FormTextField
        control={control}
        name="registeredAddressCity"
        label={t('wizard.common.address.city')}
        placeholder={t('wizard.common.address.city')}
      />
      <FormTextField
        control={control}
        name="registeredAddressPostalCode"
        label={t('wizard.common.address.postcode')}
        placeholder={t('wizard.common.address.postcode')}
        autoCapitalize="characters"
      />
      <Controller
        control={control}
        name="storeIsSameAddress"
        render={({ field: { value, onChange } }) => (
          <View style={[styles.toggleRow, { marginVertical: theme.spacing.sm }]}>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, flex: 1 }}>
              {t('wizard.selfEmployed.sameAsStoreLabel')}
            </Text>
            <Switch value={value} onValueChange={onChange} />
          </View>
        )}
      />
      <Controller
        control={control}
        name="authorisationConfirmed"
        render={({ field: { value, onChange } }) => (
          <View style={[styles.toggleRow, { marginVertical: theme.spacing.sm }]}>
            <Checkbox.Android
              status={value ? 'checked' : 'unchecked'}
              onPress={() => onChange(!value)}
            />
            <Text style={{ color: theme.colors.onSurface, flex: 1 }}>
              {t('wizard.selfEmployed.authorisationLabel')}
            </Text>
          </View>
        )}
      />
      {errors.authorisationConfirmed ? (
        <HelperText type="error" visible>
          {t(errors.authorisationConfirmed.message ?? 'validation.authorisationRequired')}
        </HelperText>
      ) : null}
      {serverError || registerError ? (
        <HelperText type="error" visible>
          {serverError ?? registerError}
        </HelperText>
      ) : null}
    </FormScreenLayout>
  );
}

const styles = StyleSheet.create({
  toggleRow: { flexDirection: 'row', alignItems: 'center' },
});
