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

export interface TabletProductRowProps {
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

export function TabletProductRow({
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
}: TabletProductRowProps) {
  const theme = useAppTheme();
  const { t } = useTranslation();
  const [localName, setLocalName] = useState(item.nameEn);
  const [localPrice, setLocalPrice] = useState(String(item.basePrice));
  const [categoryMenuVisible, setCategoryMenuVisible] = useState(false);

  const currentCategory = categories.find((c: GetCategoryResponse) => c.id === item.categoryId);

  return (
    <View
      style={[
        styles.tableRow,
        {
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.xs,
        },
      ]}
    >
      {/* Product name */}
      <View style={styles.colName}>
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
          style={styles.inlineInput}
          underlineColor="transparent"
          activeUnderlineColor={theme.colors.primary}
        />
      </View>

      {/* Category picker */}
      <View style={styles.colCategory}>
        <Menu
          visible={categoryMenuVisible}
          onDismiss={() => setCategoryMenuVisible(false)}
          anchor={
            <Pressable
              onPress={() => {
                if (canEdit) setCategoryMenuVisible(true);
              }}
              style={styles.categoryPicker}
            >
              <Text
                variant="bodyMedium"
                style={{ color: theme.colors.onSurface }}
                numberOfLines={1}
              >
                {currentCategory?.nameEn ?? t('catalog.noCategory')}
              </Text>
              {canEdit ? (
                <Icon source="chevron-down" size={16} color={theme.colors.onSurfaceVariant} />
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
      </View>

      {/* Base price */}
      <View style={styles.colPrice}>
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
          style={styles.inlineInput}
          left={<TextInput.Affix text="£" />}
          underlineColor="transparent"
          activeUnderlineColor={theme.colors.primary}
        />
      </View>

      {/* Addons chips */}
      <View style={styles.colAddons}>
        <AddonChipRow
          variant="tablet"
          menuItemId={item.id}
          addons={addons}
          canEdit={canEdit}
          onCreateAddon={onCreateAddon}
          onUpdateAddonName={onUpdateAddonName}
          onOpenAddon={onOpenAddon}
        />
      </View>

      {/* Delete action */}
      <View style={styles.colAction}>
        {canDelete ? (
          <IconButton
            icon="trash-can-outline"
            size={20}
            iconColor={theme.colors.error}
            onPress={() => onDelete(item.id)}
          />
        ) : null}
      </View>
    </View>
  );
}
