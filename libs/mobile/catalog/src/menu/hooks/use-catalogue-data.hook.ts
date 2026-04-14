import {
  useGetCategoriesQuery,
  useGetMenuAddonsQuery,
  useGetMenuItemsQuery,
} from '@yellowladder/shared-api';
import {
  type GetCategoryResponse,
  type GetMenuAddonResponse,
  type GetMenuItemResponse,
} from '@yellowladder/shared-types';
import { useMemo, useState } from 'react';

export interface CatalogueData {
  categories: GetCategoryResponse[];
  menuItems: GetMenuItemResponse[];
  addons: GetMenuAddonResponse[];
  filteredItems: GetMenuItemResponse[];
  itemsByCategory: Map<string, GetMenuItemResponse[]>;
  addonsByItem: Map<string, GetMenuAddonResponse[]>;
  isLoading: boolean;
  searchQuery: string;
  setSearchQuery: (next: string) => void;
  searchVisible: boolean;
  setSearchVisible: (next: boolean) => void;
}

/**
 * Fetches all catalogue data (categories, menu items, addons) and derives
 * the search-filtered view plus per-category / per-item maps.
 */
export function useCatalogueData(): CatalogueData {
  const { data: categoriesData, isLoading: isCategoriesLoading } = useGetCategoriesQuery({});
  const { data: menuItemsData, isLoading: isItemsLoading } = useGetMenuItemsQuery({});
  const { data: addonsData } = useGetMenuAddonsQuery({});

  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const categories = useMemo(() => categoriesData?.data ?? [], [categoriesData]);
  const menuItems = useMemo(() => menuItemsData?.data ?? [], [menuItemsData]);
  const addons = useMemo(() => addonsData?.data ?? [], [addonsData]);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return menuItems;
    const query = searchQuery.toLowerCase();
    return menuItems.filter(
      (item: GetMenuItemResponse) =>
        item.nameEn.toLowerCase().includes(query) ||
        item.nameDe.toLowerCase().includes(query) ||
        item.nameFr.toLowerCase().includes(query),
    );
  }, [menuItems, searchQuery]);

  const itemsByCategory = useMemo(() => {
    const map = new Map<string, GetMenuItemResponse[]>();
    for (const item of filteredItems) {
      const existing = map.get(item.categoryId) ?? [];
      existing.push(item);
      map.set(item.categoryId, existing);
    }
    return map;
  }, [filteredItems]);

  const addonsByItem = useMemo(() => {
    const map = new Map<string, GetMenuAddonResponse[]>();
    for (const addon of addons) {
      const existing = map.get(addon.menuItemId) ?? [];
      existing.push(addon);
      map.set(addon.menuItemId, existing);
    }
    return map;
  }, [addons]);

  const isLoading = isCategoriesLoading || isItemsLoading;

  return {
    categories,
    menuItems,
    addons,
    filteredItems,
    itemsByCategory,
    addonsByItem,
    isLoading,
    searchQuery,
    setSearchQuery,
    searchVisible,
    setSearchVisible,
  };
}
