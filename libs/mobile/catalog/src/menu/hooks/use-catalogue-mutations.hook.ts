import {
  useCreateMenuAddonMutation,
  useCreateMenuItemMutation,
  useDeleteCategoryMutation,
  useDeleteMenuItemMutation,
  useUpdateMenuAddonMutation,
  useUpdateMenuItemMutation,
} from '@yellowladder/shared-api';
import { useToast } from '@yellowladder/shared-mobile-ui';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

export interface CreateMenuItemInput {
  categoryId: string;
  name: string;
  basePrice: number;
}

export interface CatalogueMutations {
  createMenuItemDraft: (input: CreateMenuItemInput) => Promise<void>;
  updateItemName: (itemId: string, nameEn: string) => Promise<void>;
  updateItemPrice: (itemId: string, priceText: string) => Promise<void>;
  updateItemCategory: (itemId: string, categoryId: string) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  createAddon: (menuItemId: string, name: string) => Promise<void>;
  updateAddonName: (addonId: string, name: string) => Promise<void>;
}

/**
 * All RTK Query mutations for the catalogue screen, each wrapped with
 * toast side effects and i18n error messages.
 *
 * NOTE: MVP multi-language behaviour. Backend `MenuItem` and `MenuAddon`
 * rows carry `nameEn` / `nameDe` / `nameFr` columns, but the mobile
 * catalogue currently exposes a single name input. Until the multi-language
 * editor ships, this hook copies the English input into `nameDe` and
 * `nameFr` so DE/FR users see the English name rather than an empty string.
 * Replace the copy-through with proper per-locale inputs when the editor
 * lands.
 */
export function useCatalogueMutations(): CatalogueMutations {
  const { t } = useTranslation();
  const { showSuccess, showError } = useToast();

  const [createMenuItem] = useCreateMenuItemMutation();
  const [updateMenuItem] = useUpdateMenuItemMutation();
  const [deleteMenuItem] = useDeleteMenuItemMutation();
  const [deleteCategoryMutation] = useDeleteCategoryMutation();
  const [createMenuAddon] = useCreateMenuAddonMutation();
  const [updateMenuAddon] = useUpdateMenuAddonMutation();

  const createMenuItemDraft = useCallback(
    async ({ categoryId, name, basePrice }: CreateMenuItemInput) => {
      try {
        await createMenuItem({
          categoryId,
          nameEn: name,
          nameDe: name,
          nameFr: name,
          basePrice,
          isDraft: true,
        }).unwrap();
        showSuccess(t('catalog.menuItems.created'));
      } catch {
        showError(t('common.somethingWentWrong'));
      }
    },
    [createMenuItem, showSuccess, showError, t],
  );

  const updateItemName = useCallback(
    async (itemId: string, nameEn: string) => {
      try {
        await updateMenuItem({
          id: itemId,
          body: { nameEn, nameDe: nameEn, nameFr: nameEn },
        }).unwrap();
        showSuccess(t('catalog.menuItems.updated'));
      } catch {
        showError(t('common.somethingWentWrong'));
      }
    },
    [updateMenuItem, showSuccess, showError, t],
  );

  const updateItemPrice = useCallback(
    async (itemId: string, priceText: string) => {
      const basePrice = parseFloat(priceText);
      if (isNaN(basePrice) || basePrice < 0) return;
      try {
        await updateMenuItem({
          id: itemId,
          body: { basePrice },
        }).unwrap();
        showSuccess(t('catalog.menuItems.priceUpdated'));
      } catch {
        showError(t('common.somethingWentWrong'));
      }
    },
    [updateMenuItem, showSuccess, showError, t],
  );

  const updateItemCategory = useCallback(
    async (itemId: string, categoryId: string) => {
      try {
        await updateMenuItem({
          id: itemId,
          body: { categoryId },
        }).unwrap();
        showSuccess(t('catalog.menuItems.updated'));
      } catch {
        showError(t('common.somethingWentWrong'));
      }
    },
    [updateMenuItem, showSuccess, showError, t],
  );

  const deleteItem = useCallback(
    async (id: string) => {
      try {
        await deleteMenuItem(id).unwrap();
        showSuccess(t('catalog.menuItems.deleted'));
      } catch {
        showError(t('common.somethingWentWrong'));
      }
    },
    [deleteMenuItem, showSuccess, showError, t],
  );

  const deleteCategory = useCallback(
    async (id: string) => {
      try {
        await deleteCategoryMutation(id).unwrap();
        showSuccess(t('catalog.categories.deleted'));
      } catch {
        showError(t('common.somethingWentWrong'));
      }
    },
    [deleteCategoryMutation, showSuccess, showError, t],
  );

  const createAddon = useCallback(
    async (menuItemId: string, name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      try {
        await createMenuAddon({
          menuItemId,
          nameEn: trimmed,
          nameDe: trimmed,
          nameFr: trimmed,
        }).unwrap();
        showSuccess(t('catalog.addons.created'));
      } catch {
        showError(t('common.somethingWentWrong'));
      }
    },
    [createMenuAddon, showSuccess, showError, t],
  );

  const updateAddonName = useCallback(
    async (addonId: string, name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      try {
        await updateMenuAddon({
          id: addonId,
          body: { nameEn: trimmed, nameDe: trimmed, nameFr: trimmed },
        }).unwrap();
        showSuccess(t('catalog.addons.updated'));
      } catch {
        showError(t('common.somethingWentWrong'));
      }
    },
    [updateMenuAddon, showSuccess, showError, t],
  );

  return {
    createMenuItemDraft,
    updateItemName,
    updateItemPrice,
    updateItemCategory,
    deleteItem,
    deleteCategory,
    createAddon,
    updateAddonName,
  };
}
