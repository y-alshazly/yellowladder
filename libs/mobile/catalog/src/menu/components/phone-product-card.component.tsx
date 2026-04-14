import { useAppTheme } from '@yellowladder/shared-mobile-ui';
import {
  type GetCategoryResponse,
  type GetMenuAddonResponse,
  type GetMenuItemResponse,
} from '@yellowladder/shared-types';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { Icon, IconButton, Menu, Text, TextInput } from 'react-native-paper';
import { catalogueStyles as styles } from '../styles/catalogue.styles';
import { AddonChipRow } from './addon-chip-row.component';

export interface PhoneProductCardProps {
  item: GetMenuItemResponse;
  categories: GetCategoryResponse[];
  addons: GetMenuAddonResponse[];
  canEdit: boolean;
  canDelete: boolean;
  onUpdateName: (id: string, name: string) => void;
  onUpdatePrice: (id: string, price: string) => void;
  onUpdateCategory: (id: string, categoryId: string) => void;
  onDelete: (id: string) => void;
  onCreateAddon: (menuItemId: string, name: string) => Promise<void> | void;
  onUpdateAddonName: (addonId: string, name: string) => Promise<void> | void;
  onOpenAddon: (addonId: string) => void;
}

export function PhoneProductCard({
  item,
  categories,
  addons,
  canEdit,
  canDelete,
  onUpdateName,
  onUpdatePrice,
  onUpdateCategory,
  onDelete,
  onCreateAddon,
  onUpdateAddonName,
  onOpenAddon,
}: PhoneProductCardProps) {
  const theme = useAppTheme();
  const { t } = useTranslation();
  const [localName, setLocalName] = useState(item.nameEn);
  const [localPrice, setLocalPrice] = useState(String(item.basePrice));
  const [categoryMenuVisible, setCategoryMenuVisible] = useState(false);

  const currentCategory = categories.find((c: GetCategoryResponse) => c.id === item.categoryId);

  return (
    <View style={styles.phoneProductSection}>
      {/* Top row: category trigger | name | price | trash */}
      <View style={styles.phoneProductTopRow}>
        <Menu
          visible={categoryMenuVisible}
          onDismiss={() => setCategoryMenuVisible(false)}
          anchor={
            <Pressable
              onPress={() => {
                if (canEdit) setCategoryMenuVisible(true);
              }}
              style={styles.phoneProductCategoryTrigger}
              accessibilityLabel={currentCategory?.nameEn ?? t('catalog.noCategory')}
            >
              {currentCategory?.emojiCode ? (
                <Text style={{ fontSize: 18 }}>{currentCategory.emojiCode}</Text>
              ) : currentCategory?.iconName ? (
                <Icon source={currentCategory.iconName} size={18} color={theme.colors.onSurface} />
              ) : (
                <Icon source="folder-outline" size={18} color={theme.colors.onSurfaceVariant} />
              )}
              {canEdit ? (
                <Icon source="chevron-down" size={14} color={theme.colors.onSurfaceVariant} />
              ) : null}
            </Pressable>
          }
        >
          {categories.map((cat: GetCategoryResponse) => (
            <Menu.Item
              key={cat.id}
              onPress={() => {
                setCategoryMenuVisible(false);
                if (cat.id !== item.categoryId) {
                  onUpdateCategory(item.id, cat.id);
                }
              }}
              title={cat.nameEn}
              leadingIcon={cat.id === item.categoryId ? 'check' : undefined}
            />
          ))}
        </Menu>

        <TextInput
          mode="flat"
          value={localName}
          onChangeText={setLocalName}
          onBlur={() => {
            if (localName !== item.nameEn) {
              onUpdateName(item.id, localName);
            }
          }}
          placeholder={t('catalog.menuItems.namePlaceholder')}
          dense
          editable={canEdit}
          style={[styles.phoneProductNameInput]}
          underlineColor="transparent"
          activeUnderlineColor={theme.colors.primary}
        />

        <TextInput
          mode="flat"
          value={localPrice}
          onChangeText={setLocalPrice}
          onBlur={() => {
            if (localPrice !== String(item.basePrice)) {
              onUpdatePrice(item.id, localPrice);
            }
          }}
          keyboardType="decimal-pad"
          dense
          editable={canEdit}
          style={styles.phoneProductPriceInput}
          left={<TextInput.Affix text="£" />}
          underlineColor="transparent"
          activeUnderlineColor={theme.colors.primary}
        />

        {canDelete ? (
          <IconButton
            icon="trash-can-outline"
            size={20}
            iconColor={theme.colors.error}
            onPress={() => onDelete(item.id)}
            style={styles.phoneProductTrashButton}
          />
        ) : null}
      </View>

      {/* Addons */}
      <View style={styles.phoneAddonsSection}>
        <Text
          variant="labelMedium"
          style={{ color: theme.colors.onSurfaceVariant, marginBottom: 8 }}
        >
          {t('catalog.menuItems.addons')}
        </Text>
        <AddonChipRow
          variant="phone"
          menuItemId={item.id}
          addons={addons}
          canEdit={canEdit}
          onCreateAddon={onCreateAddon}
          onUpdateAddonName={onUpdateAddonName}
          onOpenAddon={onOpenAddon}
        />
      </View>
    </View>
  );
}
