import {
  useCreateMenuAddonOptionMutation,
  useDeleteMenuAddonMutation,
  useDeleteMenuAddonOptionMutation,
  useGetMenuAddonByIdQuery,
  useUpdateMenuAddonOptionMutation,
} from '@yellowladder/shared-api';
import { useAppTheme, useDeviceClass, useToast } from '@yellowladder/shared-mobile-ui';
import type { GetMenuAddonOptionResponse } from '@yellowladder/shared-types';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  Button,
  Divider,
  IconButton,
  Modal,
  Portal,
  Text,
  TextInput,
} from 'react-native-paper';

/**
 * Predefined colour swatches for addon options. 18 colours matching the
 * design reference.
 */
const COLOR_SWATCHES = [
  '#C93636',
  '#D97706',
  '#CA8A04',
  '#16A34A',
  '#059669',
  '#0891B2',
  '#2563EB',
  '#4F46E5',
  '#7C3AED',
  '#9333EA',
  '#C026D3',
  '#DB2777',
  '#E11D48',
  '#78716C',
  '#57534E',
  '#44403C',
  '#1C1917',
  '#FFFFFF',
] as const;

export interface AddonDetailPanelProps {
  menuAddonId: string | null;
  onClose: () => void;
}

/**
 * Detail panel for editing a menu addon and its options. On tablets this
 * renders as a right-side panel (via absolute positioning from the parent).
 * On phones it renders as a full-screen modal via Paper Portal.
 *
 * Options are displayed as editable rows with colour swatch, name, price
 * modifier, and delete button.
 */
export function AddonDetailPanel({ menuAddonId, onClose }: AddonDetailPanelProps) {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const { deviceClass } = useDeviceClass();
  const { showSuccess, showError } = useToast();
  const isPhone = deviceClass === 'phone';

  const { data: addon, isLoading } = useGetMenuAddonByIdQuery(menuAddonId ?? '', {
    skip: !menuAddonId,
  });

  const [createOption, { isLoading: isCreatingOption }] = useCreateMenuAddonOptionMutation();
  const [updateOption] = useUpdateMenuAddonOptionMutation();
  const [deleteOption] = useDeleteMenuAddonOptionMutation();
  const [deleteAddon, { isLoading: isDeletingAddon }] = useDeleteMenuAddonMutation();

  const [colorPickerOptionId, setColorPickerOptionId] = useState<string | null>(null);

  const handleAddOption = useCallback(async () => {
    if (!menuAddonId) return;
    try {
      await createOption({
        menuAddonId,
        body: {
          nameEn: '',
          nameDe: '',
          nameFr: '',
          priceModifier: 0,
        },
      }).unwrap();
    } catch {
      showError(t('common.somethingWentWrong'));
    }
  }, [menuAddonId, createOption, showError, t]);

  const handleUpdateOptionName = useCallback(
    async (optionId: string, nameEn: string) => {
      try {
        await updateOption({
          optionId,
          body: { nameEn, nameDe: nameEn, nameFr: nameEn },
        }).unwrap();
      } catch {
        showError(t('common.somethingWentWrong'));
      }
    },
    [updateOption, showError, t],
  );

  const handleUpdateOptionPrice = useCallback(
    async (optionId: string, priceText: string) => {
      const priceModifier = parseFloat(priceText);
      if (isNaN(priceModifier)) return;
      try {
        await updateOption({
          optionId,
          body: { priceModifier },
        }).unwrap();
      } catch {
        showError(t('common.somethingWentWrong'));
      }
    },
    [updateOption, showError, t],
  );

  const handleUpdateOptionColor = useCallback(
    async (optionId: string, colorHex: string) => {
      try {
        await updateOption({
          optionId,
          body: { colorHex },
        }).unwrap();
        setColorPickerOptionId(null);
      } catch {
        showError(t('common.somethingWentWrong'));
      }
    },
    [updateOption, showError, t],
  );

  const handleDeleteOption = useCallback(
    async (optionId: string) => {
      try {
        await deleteOption(optionId).unwrap();
      } catch {
        showError(t('common.somethingWentWrong'));
      }
    },
    [deleteOption, showError, t],
  );

  const handleDeleteAddon = useCallback(async () => {
    if (!menuAddonId) return;
    try {
      await deleteAddon(menuAddonId).unwrap();
      showSuccess(t('catalog.addons.delete'));
      onClose();
    } catch {
      showError(t('common.somethingWentWrong'));
    }
  }, [menuAddonId, deleteAddon, showSuccess, showError, t, onClose]);

  const panelContent = (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderLeftColor: isPhone ? undefined : theme.colors.outlineVariant,
          borderLeftWidth: isPhone ? 0 : 1,
        },
      ]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingHorizontal: theme.spacing.lg,
            paddingVertical: theme.spacing.md,
          },
        ]}
      >
        <Text variant="titleLarge" style={{ color: theme.colors.onSurface, flex: 1 }}>
          {addon?.nameEn ?? t('catalog.addons.title')}
        </Text>
        <IconButton icon="close" onPress={onClose} size={24} />
      </View>

      <Divider />

      {/* Content */}
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: theme.spacing.lg,
            paddingVertical: theme.spacing.md,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Options header */}
          <View style={[styles.optionHeaderRow, { marginBottom: theme.spacing.sm }]}>
            <Text
              variant="labelLarge"
              style={[styles.optionColorHeader, { color: theme.colors.onSurfaceVariant }]}
            >
              {t('catalog.addons.colour')}
            </Text>
            <Text
              variant="labelLarge"
              style={[styles.optionNameHeader, { color: theme.colors.onSurfaceVariant }]}
            >
              {t('catalog.addons.optionName')}
            </Text>
            <Text
              variant="labelLarge"
              style={[styles.optionPriceHeader, { color: theme.colors.onSurfaceVariant }]}
            >
              {t('catalog.addons.priceModification')}
            </Text>
            <View style={styles.optionActionHeader} />
          </View>

          <Divider style={{ marginBottom: theme.spacing.sm }} />

          {/* Option rows */}
          {addon?.options.map((option: GetMenuAddonOptionResponse) => (
            <OptionRow
              key={option.id}
              option={option}
              onUpdateName={handleUpdateOptionName}
              onUpdatePrice={handleUpdateOptionPrice}
              onDelete={handleDeleteOption}
              onColorPress={() => setColorPickerOptionId(option.id)}
            />
          ))}

          {/* Add row */}
          <Button
            mode="text"
            icon="plus"
            onPress={handleAddOption}
            loading={isCreatingOption}
            disabled={isCreatingOption}
            style={{ alignSelf: 'flex-start', marginTop: theme.spacing.sm }}
          >
            {t('catalog.menuItems.addAddon')}
          </Button>
        </ScrollView>
      )}

      {/* Footer */}
      <Divider />
      <View
        style={[
          styles.footer,
          {
            paddingHorizontal: theme.spacing.lg,
            paddingVertical: theme.spacing.md,
          },
        ]}
      >
        <Button
          mode="outlined"
          onPress={handleDeleteAddon}
          loading={isDeletingAddon}
          disabled={isDeletingAddon}
          textColor={theme.colors.error}
          style={[styles.deleteButton, { borderColor: theme.colors.error }]}
        >
          {t('catalog.addons.delete')}
        </Button>
        <Button mode="contained" onPress={onClose} style={styles.saveButton}>
          {t('common.save')}
        </Button>
      </View>

      {/* Colour picker modal */}
      {colorPickerOptionId ? (
        <Portal>
          <Modal
            visible={Boolean(colorPickerOptionId)}
            onDismiss={() => setColorPickerOptionId(null)}
            contentContainerStyle={[
              styles.colorPickerModal,
              {
                backgroundColor: theme.colors.surface,
                borderRadius: theme.roundness * 3,
                padding: theme.spacing.lg,
              },
            ]}
          >
            <Text
              variant="titleMedium"
              style={{ color: theme.colors.onSurface, marginBottom: theme.spacing.md }}
            >
              {t('catalog.addons.colour')}
            </Text>
            <View style={styles.colorGrid}>
              {COLOR_SWATCHES.map((color) => (
                <Pressable
                  key={color}
                  onPress={() => handleUpdateOptionColor(colorPickerOptionId, color)}
                  style={[
                    styles.colorSwatch,
                    {
                      backgroundColor: color,
                      borderColor:
                        color === '#FFFFFF' ? theme.colors.outlineVariant : 'transparent',
                      borderWidth: 1,
                    },
                  ]}
                />
              ))}
            </View>
          </Modal>
        </Portal>
      ) : null}
    </View>
  );

  if (!menuAddonId) return null;

  // On phones, wrap in a full-screen Portal modal
  if (isPhone) {
    return (
      <Portal>
        <Modal
          visible={Boolean(menuAddonId)}
          onDismiss={onClose}
          contentContainerStyle={styles.fullScreenModal}
        >
          {panelContent}
        </Modal>
      </Portal>
    );
  }

  // On tablets, render inline (parent handles positioning)
  return panelContent;
}

// ---------- Option Row sub-component ----------

interface OptionRowProps {
  option: GetMenuAddonOptionResponse;
  onUpdateName: (id: string, name: string) => void;
  onUpdatePrice: (id: string, price: string) => void;
  onDelete: (id: string) => void;
  onColorPress: () => void;
}

function OptionRow({
  option,
  onUpdateName,
  onUpdatePrice,
  onDelete,
  onColorPress,
}: OptionRowProps) {
  const theme = useAppTheme();
  const [localName, setLocalName] = useState(option.nameEn);
  const [localPrice, setLocalPrice] = useState(String(option.priceModifier));

  return (
    <View style={[styles.optionRow, { marginBottom: theme.spacing.sm }]}>
      {/* Colour swatch */}
      <Pressable
        onPress={onColorPress}
        style={[
          styles.colorSwatchSmall,
          {
            backgroundColor: option.colorHex ?? theme.colors.outlineVariant,
            borderColor: theme.colors.outlineVariant,
          },
        ]}
      />

      {/* Option name */}
      <TextInput
        mode="outlined"
        value={localName}
        onChangeText={setLocalName}
        onBlur={() => {
          if (localName !== option.nameEn) {
            onUpdateName(option.id, localName);
          }
        }}
        placeholder="..."
        dense
        style={styles.optionNameInput}
      />

      {/* Price modifier */}
      <TextInput
        mode="outlined"
        value={localPrice}
        onChangeText={setLocalPrice}
        onBlur={() => {
          if (localPrice !== String(option.priceModifier)) {
            onUpdatePrice(option.id, localPrice);
          }
        }}
        keyboardType="decimal-pad"
        dense
        style={styles.optionPriceInput}
        left={<TextInput.Affix text="\u00A3" />}
      />

      {/* Delete */}
      <IconButton icon="delete-outline" size={20} onPress={() => onDelete(option.id)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionColorHeader: {
    width: 48,
  },
  optionNameHeader: {
    flex: 1,
  },
  optionPriceHeader: {
    width: 100,
    textAlign: 'right',
  },
  optionActionHeader: {
    width: 40,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  colorSwatchSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
  },
  optionNameInput: {
    flex: 1,
  },
  optionPriceInput: {
    width: 100,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  deleteButton: {
    borderRadius: 8,
  },
  saveButton: {
    borderRadius: 8,
  },
  colorPickerModal: {
    alignSelf: 'center',
    width: 280,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorSwatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  fullScreenModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    margin: 0,
    backgroundColor: '#FFFFFF',
  },
});
