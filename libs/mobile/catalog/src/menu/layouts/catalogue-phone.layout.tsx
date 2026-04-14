import { AppHeader, SearchBar, useAppTheme } from '@yellowladder/shared-mobile-ui';
import {
  type GetCategoryResponse,
  type GetMenuAddonResponse,
  type GetMenuItemResponse,
} from '@yellowladder/shared-types';
import { useTranslation } from 'react-i18next';
import { FlatList, KeyboardAvoidingView, Platform, View } from 'react-native';
import { Button, Card, Divider, FAB, IconButton } from 'react-native-paper';
import { CategorySectionHeader } from '../components/category-section-header.component';
import { PhoneDraftProductRow } from '../components/draft-product-row/draft-product-row.phone.component';
import { PhoneProductCard } from '../components/phone-product-card.component';
import { ShopSelector } from '../components/shop-selector.component';
import type { CataloguePermissions } from '../hooks/use-catalogue-permissions.hook';
import type { DraftMenuItemState } from '../hooks/use-draft-menu-item.hook';
import { catalogueStyles as styles } from '../styles/catalogue.styles';

export interface CataloguePhoneLayoutProps {
  // Data
  categories: GetCategoryResponse[];
  itemsByCategory: Map<string, GetMenuItemResponse[]>;
  addonsByItem: Map<string, GetMenuAddonResponse[]>;

  // Permissions
  permissions: CataloguePermissions;

  // Search
  searchVisible: boolean;
  onToggleSearch: () => void;
  searchQuery: string;
  onChangeSearch: (next: string) => void;

  // Shop selector
  selectedShopId: string | null;
  onSelectShop: (shopId: string | null) => void;

  // Addon detail (modal lives at screen level)
  onOpenAddon: (addonId: string) => void;

  // Add category
  onOpenAddCategory: () => void;
  onEditCategory: (category: GetCategoryResponse) => void;
  onRequestDeleteCategory: (category: GetCategoryResponse) => void;

  // Item handlers
  onUpdateItemName: (id: string, name: string) => void;
  onUpdateItemPrice: (id: string, price: string) => void;
  onUpdateItemCategory: (id: string, categoryId: string) => void;
  onRequestDeleteItem: (id: string) => void;

  // Addon handlers
  onCreateAddon: (menuItemId: string, name: string) => Promise<void> | void;
  onUpdateAddonName: (addonId: string, name: string) => Promise<void> | void;

  // Draft item
  draftItem: DraftMenuItemState | null;
  onStartCreateItem: (categoryId: string) => void;
  onUpdateDraftName: (next: string) => void;
  onUpdateDraftPrice: (next: string) => void;
  onCommitDraftItem: () => Promise<void> | void;
  onCancelDraftItem: () => void;
}

/**
 * Phone layout: single column FlatList with section headers per category,
 * inline product cards, and a FAB for adding categories. The addon detail
 * is rendered as a full-screen modal (handled by `AddonDetailPanel`).
 */
export function CataloguePhoneLayout({
  categories,
  itemsByCategory,
  addonsByItem,
  permissions,
  searchVisible,
  onToggleSearch,
  searchQuery,
  onChangeSearch,
  selectedShopId,
  onSelectShop,
  onOpenAddon,
  onOpenAddCategory,
  onEditCategory,
  onRequestDeleteCategory,
  onUpdateItemName,
  onUpdateItemPrice,
  onUpdateItemCategory,
  onRequestDeleteItem,
  onCreateAddon,
  onUpdateAddonName,
  draftItem,
  onStartCreateItem,
  onUpdateDraftName,
  onUpdateDraftPrice,
  onCommitDraftItem,
  onCancelDraftItem,
}: CataloguePhoneLayoutProps) {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const { canCreateCategory, canCreateItem, canEditItem, canDeleteItem } = permissions;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <AppHeader
        title={t('catalog.title')}
        rightAction={
          <View style={styles.headerActions}>
            <ShopSelector selectedShopId={selectedShopId} onSelectShop={onSelectShop} />
            <IconButton icon="magnify" onPress={onToggleSearch} size={24} />
          </View>
        }
      />

      {searchVisible ? (
        <SearchBar
          value={searchQuery}
          onChange={onChangeSearch}
          placeholder={t('catalog.search')}
        />
      ) : null}

      <Divider />

      <FlatList
        data={categories}
        keyExtractor={(item: GetCategoryResponse) => item.id}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{
          paddingHorizontal: theme.spacing.lg,
          paddingBottom: 80,
        }}
        renderItem={({ item: category }: { item: GetCategoryResponse }) => {
          const items = itemsByCategory.get(category.id) ?? [];
          return (
            <View style={{ marginTop: theme.spacing.lg }}>
              <CategorySectionHeader
                category={category}
                onEdit={() => onEditCategory(category)}
                onDelete={() => onRequestDeleteCategory(category)}
              />

              {items.length > 0 || draftItem?.categoryId === category.id ? (
                <Card
                  mode="outlined"
                  style={[styles.phoneProductsCard, { marginTop: theme.spacing.sm }]}
                >
                  {items.map((item: GetMenuItemResponse, idx: number) => (
                    <View key={item.id}>
                      {idx > 0 ? <Divider /> : null}
                      <PhoneProductCard
                        item={item}
                        categories={categories}
                        addons={addonsByItem.get(item.id) ?? []}
                        canEdit={canEditItem}
                        canDelete={canDeleteItem}
                        onUpdateName={onUpdateItemName}
                        onUpdatePrice={onUpdateItemPrice}
                        onUpdateCategory={onUpdateItemCategory}
                        onDelete={onRequestDeleteItem}
                        onCreateAddon={onCreateAddon}
                        onUpdateAddonName={onUpdateAddonName}
                        onOpenAddon={onOpenAddon}
                      />
                    </View>
                  ))}
                  {draftItem?.categoryId === category.id ? (
                    <View>
                      {items.length > 0 ? <Divider /> : null}
                      <PhoneDraftProductRow
                        category={category}
                        name={draftItem.name}
                        price={draftItem.price}
                        onChangeName={onUpdateDraftName}
                        onChangePrice={onUpdateDraftPrice}
                        onCommit={onCommitDraftItem}
                        onCancel={onCancelDraftItem}
                      />
                    </View>
                  ) : null}
                </Card>
              ) : null}

              {canCreateItem ? (
                <Button
                  mode="text"
                  icon="plus"
                  onPress={() => onStartCreateItem(category.id)}
                  style={{ alignSelf: 'flex-start', marginTop: theme.spacing.xs }}
                >
                  {t('catalog.addProduct')}
                </Button>
              ) : null}
            </View>
          );
        }}
      />

      {canCreateCategory ? (
        <View style={styles.fabContainer}>
          <FAB
            icon="folder-plus"
            onPress={onOpenAddCategory}
            style={[styles.fab, { backgroundColor: theme.colors.primaryContainer }]}
          />
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}
