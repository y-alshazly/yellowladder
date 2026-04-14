import { FormTextField, useAppTheme } from '@yellowladder/shared-mobile-ui';
import { useState } from 'react';
import { type Control } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { Icon, Text, TextInput } from 'react-native-paper';
import type { StoreFormValues } from './store-form.schema';

export interface StoreFormFieldsProps {
  control: Control<StoreFormValues>;
  /** Current city value (watched externally so we can toggle disclosure). */
  city: string;
  onClearAddress: () => void;
  /** Commits the typed search term to the form's `city` field. */
  onSelectCity: (name: string) => void;
}

/**
 * Name + address form fields shared by Add Store and Edit Store screens.
 *
 * Address uses progressive disclosure: while no city is selected we show a
 * single "Find Address…" search input backed by LOCAL state. Only when the
 * user submits/blurs with a non-empty value do we commit it to the form's
 * `city` field — which then flips the layout to the expanded view (chip +
 * Street + Postcode). Binding the search input directly to `city` would
 * unmount it after the first keystroke (because the layout switches),
 * making it appear uneditable.
 */
export function StoreFormFields({
  control,
  city,
  onClearAddress,
  onSelectCity,
}: StoreFormFieldsProps) {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const [searchDraft, setSearchDraft] = useState('');

  const hasSelectedAddress = city.trim().length > 0;
  const labelColor = theme.colors.onSurfaceVariant;

  const commitSearch = (): void => {
    const trimmed = searchDraft.trim();
    if (!trimmed) return;
    onSelectCity(trimmed);
    setSearchDraft('');
  };

  return (
    <View>
      <FormTextField
        control={control}
        name="name"
        label={t('stores.storeName')}
        placeholder={t('stores.namePlaceholder')}
      />

      <Text style={[styles.sectionLabel, { color: labelColor, marginTop: theme.spacing.sm }]}>
        {t('stores.address')}
      </Text>

      {hasSelectedAddress ? (
        <>
          <View style={[styles.selectedChip, { borderColor: theme.colors.outlineVariant }]}>
            <Icon source="map-marker-outline" size={18} color={theme.colors.onSurfaceVariant} />
            <Text
              variant="bodyMedium"
              style={[styles.selectedChipLabel, { color: theme.colors.onSurface }]}
              numberOfLines={1}
            >
              {city}
            </Text>
            <Pressable
              onPress={onClearAddress}
              accessibilityRole="button"
              accessibilityLabel={t('common.clear')}
              hitSlop={8}
            >
              <Icon source="trash-can-outline" size={18} color={theme.colors.onSurfaceVariant} />
            </Pressable>
          </View>

          <FormTextField control={control} name="addressLine1" label={t('stores.street')} />

          <FormTextField
            control={control}
            name="postcode"
            label={t('stores.postcode')}
            autoCapitalize="characters"
          />
        </>
      ) : (
        <TextInput
          mode="outlined"
          value={searchDraft}
          onChangeText={setSearchDraft}
          onSubmitEditing={commitSearch}
          onBlur={commitSearch}
          returnKeyType="done"
          placeholder={t('stores.findAddressPlaceholder')}
          left={<TextInput.Icon icon="magnify" />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
  },
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  selectedChipLabel: {
    flex: 1,
    marginHorizontal: 10,
    fontWeight: '500',
  },
});
