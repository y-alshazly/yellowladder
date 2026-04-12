import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation } from '@react-navigation/native';
import {
  useLazyLookupCompaniesHouseQuery,
  useLazySearchCompaniesHouseQuery,
} from '@yellowladder/shared-api';
import { FormScreenLayout, useAppTheme } from '@yellowladder/shared-mobile-ui';
import {
  formatAddress,
  patchCompanyOverrides,
  selectWizardCompanyOverrides,
  setCompaniesHouseLookup,
  setSelectedCompany,
  useAppDispatch,
  useAppSelector,
  type WizardContact,
} from '@yellowladder/shared-store';
import type {
  CompaniesHouseLookupResponse,
  CompaniesHouseSearchResultItem,
} from '@yellowladder/shared-types';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { HelperText, List, Text, TextInput } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { EditCompanyModal } from '../components/edit-company-modal.component';
import { WizardBottomBar } from '../components/wizard-bottom-bar.component';
import { useWizardDraft } from '../hooks/use-wizard-draft.hook';
import type { AuthStackNavigationProp } from '../navigation/auth-stack.types';
import {
  wizardCompaniesHouseSchema,
  type WizardCompaniesHouseFormValues,
} from './wizard-companies-house-lookup.schema';

const WIZARD_TOTAL_STEPS = 4;

type LookupStatus = 'idle' | 'searching' | 'results' | 'empty' | 'error' | 'confirmed';

function buildContactsFromLookup(lookup: CompaniesHouseLookupResponse): WizardContact[] {
  return lookup.personsOfSignificantControl.map((psc) => {
    const trimmed = psc.name.trim();
    const firstSpace = trimmed.indexOf(' ');
    const firstName = firstSpace >= 0 ? trimmed.slice(0, firstSpace) : trimmed;
    const lastName = firstSpace >= 0 ? trimmed.slice(firstSpace + 1) : '';
    return {
      id: psc.id,
      firstName,
      lastName,
      jobPosition: psc.kind,
      source: 'COMPANIES_HOUSE' as const,
    } satisfies WizardContact;
  });
}

/**
 * Wizard step 3 dot (LIMITED_COMPANY branch): "Connect your business".
 * Debounced-ish search over Companies House via the lazy RTK query hook,
 * then a selected-company card with the address + officers preview and
 * a pencil icon that opens the Edit Company Info modal. The local edits
 * are stored in `wizardDraft.companyOverrides` and folded into the final
 * `POST /companies` payload by the OTP screen.
 */
export function WizardCompaniesHouseLookupScreen() {
  const theme = useAppTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<AuthStackNavigationProp>();
  const dispatch = useAppDispatch();
  const { state: draft } = useWizardDraft();
  const overrides = useAppSelector(selectWizardCompanyOverrides);

  const [triggerSearch, { isLoading: isSearching }] = useLazySearchCompaniesHouseQuery();
  const [triggerLookup, { isLoading }] = useLazyLookupCompaniesHouseQuery();

  const [status, setStatus] = useState<LookupStatus>(
    draft.companiesHouseLookup ? 'confirmed' : 'idle',
  );
  const [results, setResults] = useState<readonly CompaniesHouseSearchResultItem[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);

  const lookup = draft.companiesHouseLookup;

  const {
    control,
    formState: { errors },
  } = useForm<WizardCompaniesHouseFormValues>({
    resolver: zodResolver(wizardCompaniesHouseSchema),
    defaultValues: { query: '' },
  });

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debouncedSearch = useCallback(
    (query: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (query.length < 2) {
        setStatus('idle');
        setResults([]);
        return;
      }
      debounceRef.current = setTimeout(async () => {
        setStatus('searching');
        setErrorMessage(null);
        try {
          const response = await triggerSearch({ query }, true).unwrap();
          if (response.items.length === 0) {
            setStatus('empty');
            setResults([]);
            return;
          }
          setResults(response.items);
          setStatus('results');
        } catch {
          setStatus('error');
          setErrorMessage(t('wizard.companiesHouse.unavailable'));
        }
      }, 500);
    },
    [triggerSearch, t],
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handlePickResult = async (item: CompaniesHouseSearchResultItem): Promise<void> => {
    setStatus('searching');
    try {
      const response = await triggerLookup(item.registrationNumber, true).unwrap();
      const contacts = buildContactsFromLookup(response);
      dispatch(setSelectedCompany({ lookup: response, contacts }));
      setStatus('confirmed');
    } catch {
      setStatus('error');
      setErrorMessage(t('wizard.companiesHouse.unavailable'));
    }
  };

  const onForward = (): void => {
    if (!lookup) return;
    navigation.navigate('WizardPrimaryContact');
  };

  const effectiveCompanyName = overrides.name ?? lookup?.companyName ?? '';
  const effectiveAddress =
    overrides.address ?? (lookup ? formatAddress(lookup.registeredAddress) : '');
  const officersPreview = lookup
    ? lookup.personsOfSignificantControl.map((psc) => psc.name).join(', ')
    : '';

  return (
    <FormScreenLayout
      title={t('wizard.connectBusiness.title')}
      brandHeadline={t('common.brand.headline')}
      brandTestimonial={t('common.brand.testimonial')}
      brandAttribution={t('common.brand.attribution')}
      footer={
        <WizardBottomBar
          currentStep={3}
          totalSteps={WIZARD_TOTAL_STEPS}
          onBack={() => navigation.goBack()}
          onForward={onForward}
          forwardDisabled={!lookup}
        />
      }
    >
      <Text
        variant="labelLarge"
        style={{ color: theme.colors.onSurface, marginBottom: theme.spacing.xs }}
      >
        {t('wizard.connectBusiness.searchLabel')}
      </Text>
      <Controller
        control={control}
        name="query"
        render={({ field: { value, onChange, onBlur } }) => (
          <View style={{ marginBottom: theme.spacing.sm }}>
            <TextInput
              mode="outlined"
              placeholder={t('wizard.connectBusiness.searchPlaceholder')}
              value={value}
              onChangeText={(text) => {
                onChange(text);
                debouncedSearch(text);
              }}
              onBlur={onBlur}
              autoCapitalize="characters"
              left={<TextInput.Icon icon="magnify" />}
              error={Boolean(errors.query)}
            />
            <HelperText type={errors.query ? 'error' : 'info'} visible>
              {errors.query
                ? t(errors.query.message ?? 'validation.fieldRequired')
                : t('wizard.connectBusiness.searchHelper')}
            </HelperText>
          </View>
        )}
      />

      {status === 'empty' ? (
        // TODO(design): the "no results" state does not have a Figma file in
        // 01-accounts-sign-up/designs/ (missing file 15). This layout is a
        // graceful fallback: a short message and an inline link to the
        // self-employed branch. Replace with the final design when available.
        <View style={[styles.notice, { padding: theme.spacing.md }]}>
          <Text
            variant="titleMedium"
            style={{ color: theme.colors.onSurface, textAlign: 'center' }}
          >
            {t('wizard.companiesHouse.noResultsTitle')}
          </Text>
          <Text
            variant="bodyMedium"
            style={{
              color: theme.colors.onSurfaceVariant,
              textAlign: 'center',
              marginTop: theme.spacing.xs,
            }}
          >
            {t('wizard.companiesHouse.noResultsBody')}{' '}
            <Text
              accessibilityRole="link"
              onPress={() => navigation.navigate('WizardSelfEmployedDetails')}
              style={{
                color: theme.colors.primary,
                textDecorationLine: 'underline',
              }}
            >
              {t('wizard.companiesHouse.registerSelfEmployedLink')}
            </Text>
          </Text>
        </View>
      ) : null}

      {status === 'results' ? (
        <View>
          {results.map((item) => (
            <List.Item
              key={item.registrationNumber}
              title={item.companyName}
              description={`${item.registrationNumber} • ${t('wizard.companiesHouse.resultStatus', {
                status: item.companyStatus,
              })}`}
              left={(props) => <List.Icon {...props} icon="domain" />}
              onPress={() => handlePickResult(item)}
              disabled={isLoading || isSearching}
            />
          ))}
        </View>
      ) : null}

      {status === 'confirmed' && lookup ? (
        <View>
          <Text
            variant="bodyMedium"
            style={{
              color: theme.colors.onSurfaceVariant,
              marginTop: theme.spacing.sm,
              marginBottom: theme.spacing.xs,
            }}
          >
            {t('wizard.connectBusiness.foundOnCompaniesHouse')}
          </Text>
          <View
            style={[
              styles.confirmedCard,
              {
                borderColor: '#D7D7D8',
                padding: 20,
              },
            ]}
          >
            <View style={styles.cardHeader}>
              <View
                style={[
                  styles.cardIconWrap,
                  {
                    backgroundColor: theme.colors.primaryContainer,
                    marginRight: theme.spacing.sm,
                  },
                ]}
              >
                <Icon name="office-building-outline" size={22} color={theme.colors.primary} />
              </View>
              <Text
                variant="titleMedium"
                style={[styles.cardTitle, { color: theme.colors.onSurface }]}
              >
                {effectiveCompanyName}
              </Text>
            </View>

            <View>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {t('wizard.connectBusiness.businessTypeLabel')}
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                {t('wizard.connectBusiness.businessTypeLimitedCompany')}
              </Text>
            </View>

            {officersPreview.length > 0 ? (
              <View>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {t('wizard.connectBusiness.ownersLabel')}
                </Text>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                  {officersPreview}
                </Text>
              </View>
            ) : null}

            <View>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {t('wizard.connectBusiness.addressLabel')}
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                {effectiveAddress}
              </Text>
            </View>
          </View>
          <View style={[styles.inlineLinks, { marginTop: theme.spacing.md }]}>
            <Text
              accessibilityRole="link"
              onPress={() => {
                dispatch(setCompaniesHouseLookup(null));
                setStatus('idle');
                setResults([]);
              }}
              style={styles.inlineLinkText}
            >
              {t('wizard.connectBusiness.searchAgain')}
            </Text>
            <Text
              accessibilityRole="link"
              onPress={() => setEditModalVisible(true)}
              style={[styles.inlineLinkText, { marginLeft: theme.spacing.lg }]}
            >
              {t('wizard.connectBusiness.editDetails')}
            </Text>
          </View>
        </View>
      ) : null}

      {errorMessage ? (
        <HelperText type="error" visible>
          {errorMessage}
        </HelperText>
      ) : null}

      <EditCompanyModal
        visible={editModalVisible}
        initialName={effectiveCompanyName}
        initialAddress={effectiveAddress}
        onDismiss={() => setEditModalVisible(false)}
        onSave={(values) => {
          dispatch(patchCompanyOverrides(values));
          setEditModalVisible(false);
        }}
      />
    </FormScreenLayout>
  );
}

const styles = StyleSheet.create({
  notice: { alignItems: 'center' },
  confirmedCard: {
    borderWidth: 1,
    borderRadius: 5,
    gap: 25,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { fontWeight: '800' },
  inlineLinks: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inlineLinkText: {
    textDecorationLine: 'underline',
    fontWeight: '400',
    fontSize: 16,
    color: '#737373',
  },
});
