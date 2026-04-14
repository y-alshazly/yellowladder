import { Injectable } from '@nestjs/common';
import { AuthorizationService } from '@yellowladder/backend-identity-authorization';
import {
  Permissions,
  type AuthenticatedUser,
  type EffectiveCategory,
  type EffectiveMenuAddon,
  type EffectiveMenuAddonOption,
  type EffectiveMenuItem,
  type GetEffectiveMenuResponse,
} from '@yellowladder/shared-types';
import { EffectiveMenuRepository } from './effective-menu.repository';

@Injectable()
export class EffectiveMenuService {
  constructor(
    private readonly repository: EffectiveMenuRepository,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async getEffectiveMenu(
    user: AuthenticatedUser,
    shopId: string,
  ): Promise<GetEffectiveMenuResponse> {
    this.authorizationService.requirePermission(user, Permissions.MenuItemsRead);
    // assertShopAccess validates the user can access this specific shop.
    // Individual data queries below use the asserted shopId directly —
    // scopeWhereToUserShops is unnecessary after a successful assertion.
    this.authorizationService.assertShopAccess(user, shopId);

    // Step 1: Load all company-level entities and shop overrides in parallel
    const {
      categories,
      menuItems,
      menuAddons,
      menuAddonOptions,
      shopCategories,
      shopMenuItems,
      shopMenuAddons,
      shopMenuAddonOptions,
    } = await this.repository.loadEffectiveMenuData(shopId);

    // Step 2: Build lookup maps for O(1) override access
    const shopCategoryMap = new Map(shopCategories.map((sc) => [sc.categoryId, sc]));
    const shopMenuItemMap = new Map(shopMenuItems.map((smi) => [smi.menuItemId, smi]));
    const shopMenuAddonMap = new Map(shopMenuAddons.map((sma) => [sma.menuAddonId, sma]));
    const shopMenuAddonOptionMap = new Map(
      shopMenuAddonOptions.map((smao) => [smao.menuAddonOptionId, smao]),
    );

    // Build parent-to-children maps
    const menuItemsByCategory = new Map<string, typeof menuItems>();
    for (const item of menuItems) {
      const existing = menuItemsByCategory.get(item.categoryId) ?? [];
      existing.push(item);
      menuItemsByCategory.set(item.categoryId, existing);
    }

    const addonsByMenuItem = new Map<string, typeof menuAddons>();
    for (const addon of menuAddons) {
      const existing = addonsByMenuItem.get(addon.menuItemId) ?? [];
      existing.push(addon);
      addonsByMenuItem.set(addon.menuItemId, existing);
    }

    const optionsByAddon = new Map<string, typeof menuAddonOptions>();
    for (const option of menuAddonOptions) {
      const existing = optionsByAddon.get(option.menuAddonId) ?? [];
      existing.push(option);
      optionsByAddon.set(option.menuAddonId, existing);
    }

    // Step 3: Merge and build effective menu
    const effectiveCategories: EffectiveCategory[] = [];

    for (const category of categories) {
      const shopCat = shopCategoryMap.get(category.id);

      // If the shop override explicitly deactivates this category, skip it
      if (shopCat?.isActive === false) {
        continue;
      }

      const effectiveItems: EffectiveMenuItem[] = [];
      const categoryItems = menuItemsByCategory.get(category.id) ?? [];

      for (const item of categoryItems) {
        const shopItem = shopMenuItemMap.get(item.id);

        // If the shop override explicitly deactivates this item, skip it
        if (shopItem?.isActive === false) {
          continue;
        }

        const effectiveAddons: EffectiveMenuAddon[] = [];
        const itemAddons = addonsByMenuItem.get(item.id) ?? [];

        for (const addon of itemAddons) {
          const shopAddon = shopMenuAddonMap.get(addon.id);

          const effectiveOptions: EffectiveMenuAddonOption[] = [];
          const addonOptions = optionsByAddon.get(addon.id) ?? [];

          for (const option of addonOptions) {
            const shopOption = shopMenuAddonOptionMap.get(option.id);

            // If the shop override explicitly deactivates this option, skip it
            if (shopOption?.isActive === false) {
              continue;
            }

            effectiveOptions.push({
              id: option.id,
              overrideId: shopOption?.id ?? null,
              nameEn: shopOption?.nameEn ?? option.nameEn,
              nameDe: shopOption?.nameDe ?? option.nameDe,
              nameFr: shopOption?.nameFr ?? option.nameFr,
              priceModifier:
                shopOption?.priceModifier !== null && shopOption?.priceModifier !== undefined
                  ? Number(shopOption.priceModifier)
                  : Number(option.priceModifier),
              colorHex: shopOption?.colorHex ?? option.colorHex,
              sortOrder: shopOption?.sortOrder ?? option.sortOrder,
              isActive: shopOption?.isActive ?? option.isActive,
            });
          }

          // Sort options by effective sortOrder
          effectiveOptions.sort((a, b) => a.sortOrder - b.sortOrder);

          effectiveAddons.push({
            id: addon.id,
            overrideId: shopAddon?.id ?? null,
            nameEn: shopAddon?.nameEn ?? addon.nameEn,
            nameDe: shopAddon?.nameDe ?? addon.nameDe,
            nameFr: shopAddon?.nameFr ?? addon.nameFr,
            isMultiSelect: shopAddon?.isMultiSelect ?? addon.isMultiSelect,
            isRequired: shopAddon?.isRequired ?? addon.isRequired,
            maxSelections: shopAddon?.maxSelections ?? addon.maxSelections,
            sortOrder: shopAddon?.sortOrder ?? addon.sortOrder,
            options: effectiveOptions,
          });
        }

        // Sort addons by effective sortOrder
        effectiveAddons.sort((a, b) => a.sortOrder - b.sortOrder);

        effectiveItems.push({
          id: item.id,
          overrideId: shopItem?.id ?? null,
          categoryId: item.categoryId,
          nameEn: shopItem?.nameEn ?? item.nameEn,
          nameDe: shopItem?.nameDe ?? item.nameDe,
          nameFr: shopItem?.nameFr ?? item.nameFr,
          descriptionEn: item.descriptionEn,
          descriptionDe: item.descriptionDe,
          descriptionFr: item.descriptionFr,
          basePrice:
            shopItem?.basePrice !== null && shopItem?.basePrice !== undefined
              ? Number(shopItem.basePrice)
              : Number(item.basePrice),
          imageUrl: item.imageUrl,
          isActive: shopItem?.isActive ?? item.isActive,
          isDraft: item.isDraft,
          sortOrder: shopItem?.sortOrder ?? item.sortOrder,
          addons: effectiveAddons,
        });
      }

      // Sort items by effective sortOrder
      effectiveItems.sort((a, b) => a.sortOrder - b.sortOrder);

      effectiveCategories.push({
        id: category.id,
        overrideId: shopCat?.id ?? null,
        nameEn: shopCat?.nameEn ?? category.nameEn,
        nameDe: shopCat?.nameDe ?? category.nameDe,
        nameFr: shopCat?.nameFr ?? category.nameFr,
        iconName: category.iconName,
        emojiCode: category.emojiCode,
        sortOrder: shopCat?.sortOrder ?? category.sortOrder,
        isActive: shopCat?.isActive ?? category.isActive,
        isNew: shopCat?.isNew ?? false,
        menuItems: effectiveItems,
      });
    }

    // Sort categories by effective sortOrder
    effectiveCategories.sort((a, b) => a.sortOrder - b.sortOrder);

    return {
      shopId,
      categories: effectiveCategories,
    };
  }
}
