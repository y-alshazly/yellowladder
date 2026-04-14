import { AppHeader, SearchBar, useAppTheme } from '@yellowladder/shared-mobile-ui';
import {
  type GetCategoryResponse,
  type GetMenuAddonResponse,
  type GetMenuItemResponse,
} from '@yellowladder/shared-types';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { Button, Divider, Icon, IconButton, Text } from 'react-native-paper';
import { AddonDetailPanel } from '../components/addon-detail-panel.component';
import { CatalogueEmptyState } from '../components/catalogue-empty-state.component';
import { CategoryAccordionHeader } from '../components/category-accordion-header.component';
import { TabletDraftProductRow } from '../components/draft-product-row/draft-product-row.tablet.component';
import { ProductTableHeader } from '../components/product-table-header.component';
import { ShopSelector } from '../components/shop-selector.component';
import { TabletProductRow } from '../components/tablet-product-row.component';
import type { CataloguePermissions } from '../hooks/use-catalogue-permissions.hook';
import type { DraftMenuItemState } from '../hooks/use-draft-menu-item.hook';
import { catalogueStyles as styles } from '../styles/catalogue.styles';

export interface CatalogueTabletLayoutProps {
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

  // Right-panel state
  selectedAddonId: string | null;
  onOpenAddon: (addonId: string) => void;
  onCloseAddon: () => void;

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
 * Tablet layout: master/detail with category accordions on the left and an
 * optional addon detail panel on the right when an addon is selected.
 */
export function CatalogueTabletLayout({
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
  selectedAddonId,
  onOpenAddon,
  onCloseAddon,
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
}: CatalogueTabletLayoutProps) {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const { canCreateCategory, canCreateItem, canEditItem, canDeleteItem } = permissions;
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const toggleCategory = useCallback((categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  }, []);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.tabletRoot}>
        {/* Main content area */}
        <View style={[styles.tabletMain, selectedAddonId ? styles.tabletMainWithPanel : null]}>
          <AppHeader
            title={t('catalog.title')}
            rightAction={
              <View style={styles.headerActions}>
                <ShopSelector selectedShopId={selectedShopId} onSelectShop={onSelectShop} />
                <IconButton icon="magnify" onPress={onToggleSearch} size={24} />
                {canCreateCategory ? (
                  <Button
                    mode="outlined"
                    icon="folder-plus"
                    onPress={onOpenAddCategory}
                    style={styles.headerButton}
                  >
                    {t('catalog.categories.addCategory')}
                  </Button>
                ) : null}
                {canCreateItem && categories.length > 0 ? (
                  <Button
                    mode="contained"
                    icon="plus"
                    onPress={() => {
                      const first = categories[0];
                      if (first) onStartCreateItem(first.id);
                    }}
                    style={styles.headerButton}
                  >
                    {t('catalog.addProduct')}
                  </Button>
                ) : null}
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

          <ScrollView
            contentContainerStyle={{ paddingBottom: theme.spacing.xxl }}
            keyboardShouldPersistTaps="handled"
          >
            {categories.length === 0 ? (
              <CatalogueEmptyState />
            ) : (
              categories.map((category: GetCategoryResponse) => {
                const isExpanded = expandedCategories.has(category.id);
                const items = itemsByCategory.get(category.id) ?? [];

                return (
                  <View key={category.id}>
                    <CategoryAccordionHeader
                      category={category}
                      isExpanded={isExpanded}
                      itemCount={items.length}
                      onToggle={() => toggleCategory(category.id)}
                      onEdit={() => onEditCategory(category)}
                      onDelete={() => onRequestDeleteCategory(category)}
                    />

                    <Divider />

                    {isExpanded ? (
                      <View>
                        <ProductTableHeader />

                        <Divider />

                        {items.map((item: GetMenuItemResponse) => (
                          <TabletProductRow
                            key={item.id}
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
                        ))}

                        {draftItem?.categoryId === category.id ? (
                          <TabletDraftProductRow
                            category={category}
                            name={draftItem.name}
                            price={draftItem.price}
                            onChangeName={onUpdateDraftName}
                            onChangePrice={onUpdateDraftPrice}
                            onCommit={onCommitDraftItem}
                            onCancel={onCancelDraftItem}
                          />
                        ) : null}

                        {canCreateItem ? (
                          <Pressable
                            onPress={() => onStartCreateItem(category.id)}
                            style={[
                              styles.addProductRow,
                              {
                                paddingHorizontal: theme.spacing.lg,
                                paddingVertical: theme.spacing.md,
                              },
                            ]}
                          >
                            <Icon source="plus" size={18} color={theme.colors.primary} />
                            <Text
                              variant="bodyMedium"
                              style={{ color: theme.colors.primary, marginLeft: 8 }}
                            >
                              {t('catalog.addProduct')}
                            </Text>
                          </Pressable>
                        ) : null}

                        <Divider />
                      </View>
                    ) : null}
                  </View>
                );
              })
            )}
          </ScrollView>
        </View>

        {/* Right panel for addon detail (tablet only) */}
        {selectedAddonId ? (
          <View style={styles.tabletPanel}>
            <AddonDetailPanel menuAddonId={selectedAddonId} onClose={onCloseAddon} />
          </View>
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}
