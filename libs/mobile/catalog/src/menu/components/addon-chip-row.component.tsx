import { useAppTheme } from '@yellowladder/shared-mobile-ui';
import { type GetMenuAddonResponse } from '@yellowladder/shared-types';
import { useTranslation } from 'react-i18next';
import { Pressable, TextInput as RNTextInput, View } from 'react-native';
import { Chip, Icon, Text } from 'react-native-paper';
import { useAddonInlineEdit } from '../hooks/use-addon-inline-edit.hook';
import { catalogueStyles as styles } from '../styles/catalogue.styles';

export type AddonChipRowVariant = 'tablet' | 'phone';

export interface AddonChipRowProps {
  variant: AddonChipRowVariant;
  menuItemId: string;
  addons: GetMenuAddonResponse[];
  canEdit: boolean;
  onCreateAddon: (menuItemId: string, name: string) => Promise<void> | void;
  onUpdateAddonName: (addonId: string, name: string) => Promise<void> | void;
  onOpenAddon: (addonId: string) => void;
}

/**
 * Shared horizontal chip row for menu-item addons. Renders Paper Chips on
 * tablet and bordered Pressables on phone. Inline add/rename behavior is
 * provided by `useAddonInlineEdit`.
 */
export function AddonChipRow({
  variant,
  menuItemId,
  addons,
  canEdit,
  onCreateAddon,
  onUpdateAddonName,
  onOpenAddon,
}: AddonChipRowProps) {
  const theme = useAppTheme();
  const { t } = useTranslation();
  const { addonEdit, setAddonName, commitAddonEdit, startAddonEdit } = useAddonInlineEdit({
    menuItemId,
    onCreateAddon,
    onUpdateAddonName,
  });

  const renderInlineInput = (placeholder?: string) => (
    <RNTextInput
      value={addonEdit?.name ?? ''}
      onChangeText={setAddonName}
      onBlur={commitAddonEdit}
      onEndEditing={commitAddonEdit}
      onSubmitEditing={commitAddonEdit}
      autoFocus
      returnKeyType="done"
      placeholder={placeholder}
      placeholderTextColor={placeholder ? theme.colors.onSurfaceVariant : undefined}
      style={[
        styles.phoneAddonInput,
        {
          borderColor: theme.colors.primary,
          color: theme.colors.onSurface,
        },
      ]}
    />
  );

  const addButton =
    variant === 'tablet' ? (
      <Chip
        icon="plus"
        onPress={() => startAddonEdit({ id: 'new', name: '', original: '' })}
        compact
        mode="outlined"
        style={styles.addonChip}
      >
        {t('catalog.menuItems.addAddon')}
      </Chip>
    ) : (
      <Pressable
        onPress={() => startAddonEdit({ id: 'new', name: '', original: '' })}
        style={[
          styles.phoneAddonAddBtn,
          {
            backgroundColor: theme.colors.surfaceVariant,
            borderColor: theme.colors.outlineVariant,
          },
        ]}
        accessibilityLabel={t('catalog.menuItems.addAddon')}
      >
        <Icon source="plus" size={18} color={theme.colors.onSurfaceVariant} />
      </Pressable>
    );

  const renderAddonChip = (addon: GetMenuAddonResponse) => {
    const isEditing = addonEdit?.id === addon.id;
    if (isEditing) {
      return <View key={addon.id}>{renderInlineInput()}</View>;
    }
    if (variant === 'tablet') {
      return (
        <Chip key={addon.id} onPress={() => onOpenAddon(addon.id)} compact style={styles.addonChip}>
          {addon.nameEn}
        </Chip>
      );
    }
    return (
      <Pressable
        key={addon.id}
        onPress={() => {
          if (canEdit) {
            startAddonEdit({ id: addon.id, name: addon.nameEn, original: addon.nameEn });
          } else {
            onOpenAddon(addon.id);
          }
        }}
        style={[styles.phoneAddonChip, { borderColor: theme.colors.outlineVariant }]}
      >
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
          {addon.nameEn}
        </Text>
      </Pressable>
    );
  };

  const isCreating = addonEdit?.id === 'new';
  const addSlot = canEdit
    ? isCreating
      ? renderInlineInput(t('catalog.addons.newAddon'))
      : addButton
    : null;

  const rowStyle = variant === 'tablet' ? styles.chipRow : styles.phoneAddonsRow;

  // Phone renders the add slot first, tablet renders it last.
  if (variant === 'phone') {
    return (
      <View style={rowStyle}>
        {addSlot}
        {addons.map(renderAddonChip)}
      </View>
    );
  }

  return (
    <View style={rowStyle}>
      {addons.map(renderAddonChip)}
      {addSlot}
    </View>
  );
}
