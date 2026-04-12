import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation } from '@react-navigation/native';
import { FormScreenLayout, useAppTheme } from '@yellowladder/shared-mobile-ui';
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

  const onForward = handleSubmit((values) => {
    setServerError(null);
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
    // Routing change (2026-04-11): the self-employed branch no longer
    // submits directly. The OTP screen now fires `POST /companies` after
    // the email is verified, so this step only advances to OTP.
    navigation.navigate('VerifyEmail', { email: draft.accountData?.email ?? '' });
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
        />
      }
    >
      <Controller
        control={control}
        name="firstName"
        render={({ field: { value, onChange, onBlur } }) => (
          <View style={{ marginBottom: theme.spacing.sm }}>
            <Text
              variant="labelLarge"
              style={{
                color: errors.firstName ? theme.colors.error : theme.colors.onSurface,
                marginBottom: 4,
              }}
            >
              {t('wizard.selfEmployed.firstNameLabel')}
            </Text>
            <TextInput
              mode="outlined"
              placeholder={t('wizard.selfEmployed.firstNameLabel')}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={Boolean(errors.firstName)}
            />
            <HelperText type="error" visible={Boolean(errors.firstName)}>
              {errors.firstName ? t(errors.firstName.message ?? 'validation.fieldRequired') : ' '}
            </HelperText>
          </View>
        )}
      />
      <Controller
        control={control}
        name="lastName"
        render={({ field: { value, onChange, onBlur } }) => (
          <View style={{ marginBottom: theme.spacing.sm }}>
            <Text
              variant="labelLarge"
              style={{
                color: errors.lastName ? theme.colors.error : theme.colors.onSurface,
                marginBottom: 4,
              }}
            >
              {t('wizard.selfEmployed.lastNameLabel')}
            </Text>
            <TextInput
              mode="outlined"
              placeholder={t('wizard.selfEmployed.lastNameLabel')}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={Boolean(errors.lastName)}
            />
            <HelperText type="error" visible={Boolean(errors.lastName)}>
              {errors.lastName ? t(errors.lastName.message ?? 'validation.fieldRequired') : ' '}
            </HelperText>
          </View>
        )}
      />
      <Controller
        control={control}
        name="jobPosition"
        render={({ field: { value, onChange, onBlur } }) => (
          <View style={{ marginBottom: theme.spacing.sm }}>
            <Text
              variant="labelLarge"
              style={{
                color: errors.jobPosition ? theme.colors.error : theme.colors.onSurface,
                marginBottom: 4,
              }}
            >
              {t('wizard.selfEmployed.jobPositionLabel')}
            </Text>
            <TextInput
              mode="outlined"
              placeholder={t('wizard.selfEmployed.jobPositionLabel')}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={Boolean(errors.jobPosition)}
            />
            <HelperText type="error" visible={Boolean(errors.jobPosition)}>
              {errors.jobPosition
                ? t(errors.jobPosition.message ?? 'validation.fieldRequired')
                : ' '}
            </HelperText>
          </View>
        )}
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
      <Controller
        control={control}
        name="legalBusinessName"
        render={({ field: { value, onChange, onBlur } }) => (
          <View style={{ marginBottom: theme.spacing.sm }}>
            <Text
              variant="labelLarge"
              style={{
                color: errors.legalBusinessName ? theme.colors.error : theme.colors.onSurface,
                marginBottom: 4,
              }}
            >
              {t('wizard.selfEmployed.legalBusinessNameLabel')}
            </Text>
            <TextInput
              mode="outlined"
              placeholder={t('wizard.selfEmployed.legalBusinessNameLabel')}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={Boolean(errors.legalBusinessName)}
            />
            <HelperText type="error" visible={Boolean(errors.legalBusinessName)}>
              {errors.legalBusinessName
                ? t(errors.legalBusinessName.message ?? 'validation.fieldRequired')
                : ' '}
            </HelperText>
          </View>
        )}
      />
      <Controller
        control={control}
        name="tradingName"
        render={({ field: { value, onChange, onBlur } }) => (
          <View style={{ marginBottom: theme.spacing.sm }}>
            <Text
              variant="labelLarge"
              style={{
                color: errors.tradingName ? theme.colors.error : theme.colors.onSurface,
                marginBottom: 4,
              }}
            >
              {t('wizard.selfEmployed.tradingNameLabel')}
            </Text>
            <TextInput
              mode="outlined"
              placeholder={t('wizard.selfEmployed.tradingNameLabel')}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={Boolean(errors.tradingName)}
            />
            <HelperText type="error" visible={Boolean(errors.tradingName)}>
              {errors.tradingName
                ? t(errors.tradingName.message ?? 'validation.fieldRequired')
                : ' '}
            </HelperText>
          </View>
        )}
      />
      <Text
        variant="labelLarge"
        style={{ color: theme.colors.onSurface, marginBottom: theme.spacing.xs }}
      >
        {t('wizard.selfEmployed.registeredAddressLabel')}
      </Text>
      <Controller
        control={control}
        name="registeredAddressLine1"
        render={({ field: { value, onChange, onBlur } }) => (
          <View style={{ marginBottom: theme.spacing.sm }}>
            <Text
              variant="labelLarge"
              style={{
                color: errors.registeredAddressLine1 ? theme.colors.error : theme.colors.onSurface,
                marginBottom: 4,
              }}
            >
              {t('wizard.common.address.line1')}
            </Text>
            <TextInput
              mode="outlined"
              placeholder={t('wizard.common.address.line1')}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={Boolean(errors.registeredAddressLine1)}
            />
            <HelperText type="error" visible={Boolean(errors.registeredAddressLine1)}>
              {errors.registeredAddressLine1
                ? t(errors.registeredAddressLine1.message ?? 'validation.fieldRequired')
                : ' '}
            </HelperText>
          </View>
        )}
      />
      <Controller
        control={control}
        name="registeredAddressCity"
        render={({ field: { value, onChange, onBlur } }) => (
          <View style={{ marginBottom: theme.spacing.sm }}>
            <Text
              variant="labelLarge"
              style={{
                color: errors.registeredAddressCity ? theme.colors.error : theme.colors.onSurface,
                marginBottom: 4,
              }}
            >
              {t('wizard.common.address.city')}
            </Text>
            <TextInput
              mode="outlined"
              placeholder={t('wizard.common.address.city')}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={Boolean(errors.registeredAddressCity)}
            />
            <HelperText type="error" visible={Boolean(errors.registeredAddressCity)}>
              {errors.registeredAddressCity
                ? t(errors.registeredAddressCity.message ?? 'validation.fieldRequired')
                : ' '}
            </HelperText>
          </View>
        )}
      />
      <Controller
        control={control}
        name="registeredAddressPostalCode"
        render={({ field: { value, onChange, onBlur } }) => (
          <View style={{ marginBottom: theme.spacing.sm }}>
            <Text
              variant="labelLarge"
              style={{
                color: errors.registeredAddressPostalCode
                  ? theme.colors.error
                  : theme.colors.onSurface,
                marginBottom: 4,
              }}
            >
              {t('wizard.common.address.postcode')}
            </Text>
            <TextInput
              mode="outlined"
              placeholder={t('wizard.common.address.postcode')}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              autoCapitalize="characters"
              error={Boolean(errors.registeredAddressPostalCode)}
            />
            <HelperText type="error" visible={Boolean(errors.registeredAddressPostalCode)}>
              {errors.registeredAddressPostalCode
                ? t(errors.registeredAddressPostalCode.message ?? 'validation.fieldRequired')
                : ' '}
            </HelperText>
          </View>
        )}
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
      {serverError ? (
        <HelperText type="error" visible>
          {serverError}
        </HelperText>
      ) : null}
    </FormScreenLayout>
  );
}

const styles = StyleSheet.create({
  toggleRow: { flexDirection: 'row', alignItems: 'center' },
});
