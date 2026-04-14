import {
  DeleteConfirmDialog,
  SafeScreen,
  useAppTheme,
  useDeviceClass,
  useToast,
} from '@yellowladder/shared-mobile-ui';
import { type GetCategoryResponse } from '@yellowladder/shared-types';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { AddCategoryModal } from './components/add-category-modal.component';
import { AddonDetailPanel } from './components/addon-detail-panel.component';
import { useCatalogueData } from './hooks/use-catalogue-data.hook';
import { useCatalogueMutations } from './hooks/use-catalogue-mutations.hook';
import { useCataloguePermissions } from './hooks/use-catalogue-permissions.hook';
import { useDraftMenuItem } from './hooks/use-draft-menu-item.hook';
import { CataloguePhoneLayout } from './layouts/catalogue-phone.layout';
import { CatalogueTabletLayout } from './layouts/catalogue-tablet.layout';
import { catalogueStyles as styles } from './styles/catalogue.styles';

/**
 * Main catalogue management screen. Picks the layout based on device class
 * and wires shared hooks (data, mutations, draft state, permissions) plus
 * shared modals (add/edit category, addon detail on phone, delete confirms).
 *
 * - TABLET: Accordion sections with DataTable-like product rows. Addon detail
 *   as a right side panel (rendered inside the tablet layout).
 * - PHONE: FlatList with category section headers and product cards. Addon
 *   detail as a full-screen modal (rendered at the screen level).
 */
export function CatalogueScreen() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const { deviceClass } = useDeviceClass();
  const { showError } = useToast();
  const isPhone = deviceClass === 'phone';

  const permissions = useCataloguePermissions();
  const data = useCatalogueData();
  const mutations = useCatalogueMutations();
  const draft = useDraftMenuItem(mutations.createMenuItemDraft);

  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  const [addCategoryVisible, setAddCategoryVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<GetCategoryResponse | null>(null);
  const [selectedAddonId, setSelectedAddonId] = useState<string | null>(null);
  const [pendingDeleteItemId, setPendingDeleteItemId] = useState<string | null>(null);
  const [pendingDeleteCategory, setPendingDeleteCategory] = useState<GetCategoryResponse | null>(
    null,
  );

  const handleRequestDeleteCategory = useCallback(
    (category: GetCategoryResponse) => {
      const categoryItems = data.itemsByCategory.get(category.id);
      if (categoryItems && categoryItems.length > 0) {
        showError(t('catalog.categories.hasMenuItems'));
        return;
      }
      setPendingDeleteCategory(category);
    },
    [data.itemsByCategory, showError, t],
  );

  const handleConfirmDeleteCategory = useCallback(async () => {
    if (!pendingDeleteCategory) return;
    const category = pendingDeleteCategory;
    setPendingDeleteCategory(null);
    await mutations.deleteCategory(category.id);
  }, [pendingDeleteCategory, mutations]);

  const handleConfirmDeleteItem = useCallback(async () => {
    if (!pendingDeleteItemId) return;
    const id = pendingDeleteItemId;
    setPendingDeleteItemId(null);
    await mutations.deleteItem(id);
  }, [pendingDeleteItemId, mutations]);

  if (data.isLoading) {
    return (
      <SafeScreen noPadding>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeScreen>
    );
  }

  // Props common to BOTH layouts.
  const commonLayoutProps = {
    categories: data.categories,
    itemsByCategory: data.itemsByCategory,
    addonsByItem: data.addonsByItem,
    permissions,
    searchVisible: data.searchVisible,
    onToggleSearch: () => data.setSearchVisible(!data.searchVisible),
    searchQuery: data.searchQuery,
    onChangeSearch: data.setSearchQuery,
    selectedShopId,
    onSelectShop: setSelectedShopId,
    onOpenAddon: setSelectedAddonId,
    onOpenAddCategory: () => setAddCategoryVisible(true),
    onEditCategory: setEditingCategory,
    onRequestDeleteCategory: handleRequestDeleteCategory,
    onUpdateItemName: mutations.updateItemName,
    onUpdateItemPrice: mutations.updateItemPrice,
    onUpdateItemCategory: mutations.updateItemCategory,
    onRequestDeleteItem: setPendingDeleteItemId,
    onCreateAddon: mutations.createAddon,
    onUpdateAddonName: mutations.updateAddonName,
    draftItem: draft.draftItem,
    onStartCreateItem: draft.startCreateItem,
    onUpdateDraftName: draft.updateDraftName,
    onUpdateDraftPrice: draft.updateDraftPrice,
    onCommitDraftItem: draft.commitDraftItem,
    onCancelDraftItem: draft.cancelDraftItem,
  };

  return (
    <SafeScreen noPadding>
      {isPhone ? (
        <CataloguePhoneLayout {...commonLayoutProps} />
      ) : (
        <CatalogueTabletLayout
          {...commonLayoutProps}
          selectedAddonId={selectedAddonId}
          onCloseAddon={() => setSelectedAddonId(null)}
        />
      )}

      <AddCategoryModal
        visible={addCategoryVisible || Boolean(editingCategory)}
        onDismiss={() => {
          setAddCategoryVisible(false);
          setEditingCategory(null);
        }}
        editCategory={editingCategory}
      />

      {/* Phone full-screen addon detail modal — tablet renders its own panel. */}
      {isPhone ? (
        <AddonDetailPanel menuAddonId={selectedAddonId} onClose={() => setSelectedAddonId(null)} />
      ) : null}

      <DeleteConfirmDialog
        visible={pendingDeleteItemId !== null}
        title={t('catalog.menuItems.confirmDeleteTitle')}
        message={t('catalog.menuItems.confirmDeleteMessage')}
        onConfirm={handleConfirmDeleteItem}
        onCancel={() => setPendingDeleteItemId(null)}
      />

      <DeleteConfirmDialog
        visible={pendingDeleteCategory !== null}
        title={t('catalog.categories.confirmDeleteTitle')}
        message={t('catalog.categories.confirmDeleteMessage', {
          name: pendingDeleteCategory?.nameEn ?? '',
        })}
        onConfirm={handleConfirmDeleteCategory}
        onCancel={() => setPendingDeleteCategory(null)}
      />
    </SafeScreen>
  );
}
