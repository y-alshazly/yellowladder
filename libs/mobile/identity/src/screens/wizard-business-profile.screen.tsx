import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation } from '@react-navigation/native';
import {
  useGetAnnualTurnoverBandsQuery,
  useGetBusinessCategoriesQuery,
  useGetPaymentMethodsQuery,
} from '@yellowladder/shared-api';
import { AppMenu, FormScreenLayout, useAppTheme } from '@yellowladder/shared-mobile-ui';
import {
  patchBusinessProfile,
  selectWizardBusinessType,
  startWizard,
  useAppDispatch,
  useAppSelector,
} from '@yellowladder/shared-store';
import { BusinessType } from '@yellowladder/shared-types';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { HelperText, SegmentedButtons, Text, TextInput, TouchableRipple } from 'react-native-paper';
import { WizardBottomBar } from '../components/wizard-bottom-bar.component';
import { useWizardDraft } from '../hooks/use-wizard-draft.hook';
import type { AuthStackNavigationProp } from '../navigation/auth-stack.types';
import { generateIdempotencyKey } from '../utils/generate-idempotency-key.util';
import {
  wizardBusinessProfileSchema,
  type WizardBusinessProfileFormValues,
} from './wizard-business-profile.schema';

/**
 * Four pills total — the Phase-C wizard dots on the new design are:
 *   1. Account (Phase A sign-up, pre-wizard)
 *   2. Business Profile (this screen)
 *   3. Connect Business OR Self-Employed Details
 *   4. Primary Contact (limited-company only)
 *
 * The self-employed branch only reaches pill 3; limited-company reaches
 * pill 4 and then exits to OTP.
 */
const WIZARD_TOTAL_STEPS = 4;

/**
 * Wizard step 2 dot: "Set up your profile". Collects category, sell mode,
 * annual turnover, VAT yes/no (segmented), VAT number (shown when VAT is
 * enabled). Persists into the wizard-draft Redux slice before navigating
 * forward to step 3.
 */
export function WizardBusinessProfileScreen() {
  const theme = useAppTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<AuthStackNavigationProp>();
  const dispatch = useAppDispatch();
  const { state: draft } = useWizardDraft();
  const draftBusinessType = useAppSelector(selectWizardBusinessType);

  const { data: categories, isLoading: categoriesLoading } = useGetBusinessCategoriesQuery();
  const { data: paymentMethods, isLoading: paymentMethodsLoading } = useGetPaymentMethodsQuery();
  const { data: turnoverBands, isLoading: turnoverLoading } = useGetAnnualTurnoverBandsQuery();

  const [categoryMenuVisible, setCategoryMenuVisible] = useState(false);
  const [categoryAnchorWidth, setCategoryAnchorWidth] = useState(0);
  const [paymentMenuVisible, setPaymentMenuVisible] = useState(false);
  const [paymentAnchorWidth, setPaymentAnchorWidth] = useState(0);
  const [turnoverMenuVisible, setTurnoverMenuVisible] = useState(false);
  const [turnoverAnchorWidth, setTurnoverAnchorWidth] = useState(0);

  useEffect(() => {
    if (!draft.idempotencyKey || !draft.businessType) {
      dispatch(
        startWizard({
          businessType: draftBusinessType ?? BusinessType.LimitedCompany,
          idempotencyKey: generateIdempotencyKey(),
        }),
      );
    }
  }, [dispatch, draft.businessType, draft.idempotencyKey, draftBusinessType]);

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<WizardBusinessProfileFormValues>({
    resolver: zodResolver(wizardBusinessProfileSchema),
    defaultValues: {
      businessCategoryId: draft.businessProfile.businessCategoryId ?? '',
      paymentMethodPreferenceId: draft.businessProfile.paymentMethodPreferenceId ?? '',
      annualTurnoverBandId: draft.businessProfile.annualTurnoverBandId ?? '',
      vatRegistered: draft.businessProfile.vatRegistered ?? false,
      vatNumber: draft.businessProfile.vatNumber ?? '',
    },
  });

  const vatRegistered = watch('vatRegistered');

  const onForward = handleSubmit((values) => {
    dispatch(patchBusinessProfile(values));
    if (draftBusinessType === BusinessType.SelfEmployed) {
      navigation.navigate('WizardSelfEmployedDetails');
    } else {
      navigation.navigate('WizardCompaniesHouseLookup');
    }
  });

  const activeCategoryLabel = (id: string): string => {
    const hit = categories?.find((cat) => cat.id === id);
    return hit?.label ?? t('common.select');
  };
  const activePaymentLabel = (id: string): string => {
    const hit = paymentMethods?.find((pm) => pm.id === id);
    return hit?.label ?? t('common.select');
  };
  const activeTurnoverLabel = (id: string): string => {
    const hit = turnoverBands?.find((tb) => tb.id === id);
    return hit?.label ?? t('common.select');
  };

  return (
    <FormScreenLayout
      title={t('wizard.profile.title')}
      brandHeadline={t('common.brand.headline')}
      brandTestimonial={t('common.brand.testimonial')}
      brandAttribution={t('common.brand.attribution')}
      footer={
        <WizardBottomBar
          currentStep={2}
          totalSteps={WIZARD_TOTAL_STEPS}
          onBack={() => navigation.goBack()}
          onForward={onForward}
        />
      }
    >
      <Controller
        control={control}
        name="businessCategoryId"
        render={({ field: { value, onChange } }) => (
          <View style={{ marginBottom: theme.spacing.sm }}>
            <Text
              variant="labelLarge"
              style={{ color: theme.colors.onSurface, marginBottom: theme.spacing.xs }}
            >
              {t('wizard.profile.categoryQuestion')}
            </Text>
            <AppMenu
              visible={categoryMenuVisible}
              onDismiss={() => setCategoryMenuVisible(false)}
              anchorPosition="bottom"
              contentStyle={categoryAnchorWidth > 0 ? { width: categoryAnchorWidth } : undefined}
              anchor={
                <TouchableRipple
                  onPress={() => setCategoryMenuVisible(true)}
                  disabled={categoriesLoading}
                >
                  <View
                    pointerEvents="none"
                    onLayout={(e) => setCategoryAnchorWidth(e.nativeEvent.layout.width)}
                  >
                    <TextInput
                      mode="outlined"
                      placeholder={t('common.select')}
                      value={activeCategoryLabel(value)}
                      editable={false}
                      right={<TextInput.Icon icon="menu-down" />}
                      error={Boolean(errors.businessCategoryId)}
                    />
                  </View>
                </TouchableRipple>
              }
            >
              {categories?.map((cat) => (
                <AppMenu.Item
                  key={cat.id}
                  onPress={() => {
                    onChange(cat.id);
                    setCategoryMenuVisible(false);
                  }}
                  title={cat.label}
                />
              ))}
            </AppMenu>
            <HelperText type="error" visible={Boolean(errors.businessCategoryId)}>
              {errors.businessCategoryId
                ? t(errors.businessCategoryId.message ?? 'validation.fieldRequired')
                : ' '}
            </HelperText>
          </View>
        )}
      />

      <Controller
        control={control}
        name="paymentMethodPreferenceId"
        render={({ field: { value, onChange } }) => (
          <View style={{ marginBottom: theme.spacing.sm }}>
            <Text
              variant="labelLarge"
              style={{ color: theme.colors.onSurface, marginBottom: theme.spacing.xs }}
            >
              {t('wizard.profile.sellModeQuestion')}
            </Text>
            <AppMenu
              visible={paymentMenuVisible}
              onDismiss={() => setPaymentMenuVisible(false)}
              anchorPosition="bottom"
              contentStyle={paymentAnchorWidth > 0 ? { width: paymentAnchorWidth } : undefined}
              anchor={
                <TouchableRipple
                  onPress={() => setPaymentMenuVisible(true)}
                  disabled={paymentMethodsLoading}
                >
                  <View
                    pointerEvents="none"
                    onLayout={(e) => setPaymentAnchorWidth(e.nativeEvent.layout.width)}
                  >
                    <TextInput
                      mode="outlined"
                      placeholder={t('common.select')}
                      value={activePaymentLabel(value)}
                      editable={false}
                      right={<TextInput.Icon icon="menu-down" />}
                      error={Boolean(errors.paymentMethodPreferenceId)}
                    />
                  </View>
                </TouchableRipple>
              }
            >
              {paymentMethods?.map((pm) => (
                <AppMenu.Item
                  key={pm.id}
                  onPress={() => {
                    onChange(pm.id);
                    setPaymentMenuVisible(false);
                  }}
                  title={pm.label}
                />
              ))}
            </AppMenu>
            <HelperText type="error" visible={Boolean(errors.paymentMethodPreferenceId)}>
              {errors.paymentMethodPreferenceId
                ? t(errors.paymentMethodPreferenceId.message ?? 'validation.fieldRequired')
                : ' '}
            </HelperText>
          </View>
        )}
      />

      <Controller
        control={control}
        name="annualTurnoverBandId"
        render={({ field: { value, onChange } }) => (
          <View style={{ marginBottom: theme.spacing.sm }}>
            <Text
              variant="labelLarge"
              style={{ color: theme.colors.onSurface, marginBottom: theme.spacing.xs }}
            >
              {t('wizard.profile.annualTurnoverQuestion')}
            </Text>
            <AppMenu
              visible={turnoverMenuVisible}
              onDismiss={() => setTurnoverMenuVisible(false)}
              anchorPosition="bottom"
              contentStyle={turnoverAnchorWidth > 0 ? { width: turnoverAnchorWidth } : undefined}
              anchor={
                <TouchableRipple
                  onPress={() => setTurnoverMenuVisible(true)}
                  disabled={turnoverLoading}
                >
                  <View
                    pointerEvents="none"
                    onLayout={(e) => setTurnoverAnchorWidth(e.nativeEvent.layout.width)}
                  >
                    <TextInput
                      mode="outlined"
                      placeholder="0"
                      value={activeTurnoverLabel(value)}
                      editable={false}
                      left={<TextInput.Affix text="£" />}
                      right={<TextInput.Icon icon="menu-down" />}
                      error={Boolean(errors.annualTurnoverBandId)}
                    />
                  </View>
                </TouchableRipple>
              }
            >
              {turnoverBands?.map((tb) => (
                <AppMenu.Item
                  key={tb.id}
                  onPress={() => {
                    onChange(tb.id);
                    setTurnoverMenuVisible(false);
                  }}
                  title={tb.label}
                />
              ))}
            </AppMenu>
            <HelperText type="error" visible={Boolean(errors.annualTurnoverBandId)}>
              {errors.annualTurnoverBandId
                ? t(errors.annualTurnoverBandId.message ?? 'validation.fieldRequired')
                : ' '}
            </HelperText>
          </View>
        )}
      />

      <View
        style={[
          styles.divider,
          { backgroundColor: theme.colors.outlineVariant, marginVertical: theme.spacing.sm },
        ]}
      />

      <Controller
        control={control}
        name="vatRegistered"
        render={({ field: { value, onChange } }) => (
          <View style={[styles.vatRow, { marginVertical: theme.spacing.sm }]}>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, flex: 1 }}>
              {t('wizard.profile.vatQuestion')}
            </Text>
            <SegmentedButtons
              value={value ? 'YES' : 'NO'}
              onValueChange={(next) => onChange(next === 'YES')}
              buttons={[
                { value: 'YES', label: t('wizard.profile.yes') },
                { value: 'NO', label: t('wizard.profile.no') },
              ]}
              style={styles.segmented}
            />
          </View>
        )}
      />

      {vatRegistered ? (
        <FormTextField
          control={control}
          name="vatNumber"
          label={t('wizard.profile.vatNumberLabel')}
          placeholder="GB"
          autoCapitalize="characters"
        />
      ) : null}
    </FormScreenLayout>
  );
}

const styles = StyleSheet.create({
  vatRow: { flexDirection: 'row', alignItems: 'center' },
  segmented: { minWidth: 160 },
  divider: { height: StyleSheet.hairlineWidth, width: '100%' },
});
