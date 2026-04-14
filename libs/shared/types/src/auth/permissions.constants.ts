/**
 * Flat permission strings in the form `{resource}:{action}`.
 * Declared as an `as const` object (no TypeScript enum per project rules).
 *
 * Resources are kebab-case plurals; actions are plain verbs.
 * Keep this list in sync with `RolePermissionRegistry` in
 * `backend-identity-authorization`.
 *
 * Feature 01–04 — extended by later features.
 */
export const Permissions = {
  // Users (self-service)
  UsersReadSelf: 'users:read-self',
  UsersUpdateSelf: 'users:update-self',
  UsersChangePasswordSelf: 'users:change-password-self',
  UsersUploadPhotoSelf: 'users:upload-photo-self',

  // Users (team management — Feature 02)
  UsersCreate: 'users:create',
  UsersRead: 'users:read',
  UsersUpdate: 'users:update',
  UsersDelete: 'users:delete',
  UsersManageRoles: 'users:manage-roles',
  UsersAssignShops: 'users:assign-shops',
  UsersResetPassword: 'users:reset-password',

  // Companies (create during onboarding, read own)
  CompaniesCreate: 'companies:create',
  CompaniesRead: 'companies:read',
  CompaniesUpdate: 'companies:update',

  // Companies House proxy
  CompaniesHouseSearch: 'companies-house:search',
  CompaniesHouseLookup: 'companies-house:lookup',

  // Reference data (authenticated read)
  BusinessTypesRead: 'business-types:read',
  BusinessCategoriesRead: 'business-categories:read',
  AnnualTurnoverBandsRead: 'annual-turnover-bands:read',
  PaymentMethodsRead: 'payment-methods:read',

  // Shops (Feature 03)
  ShopsCreate: 'shops:create',
  ShopsRead: 'shops:read',
  ShopsUpdate: 'shops:update',
  ShopsArchive: 'shops:archive',
  ShopsReorder: 'shops:reorder',

  // Categories (Feature 04)
  CategoriesCreate: 'categories:create',
  CategoriesRead: 'categories:read',
  CategoriesUpdate: 'categories:update',
  CategoriesDelete: 'categories:delete',
  CategoriesReorder: 'categories:reorder',

  // Menu Items (Feature 04)
  MenuItemsCreate: 'menu-items:create',
  MenuItemsRead: 'menu-items:read',
  MenuItemsUpdate: 'menu-items:update',
  MenuItemsDelete: 'menu-items:delete',

  // Menu Addons (Feature 04)
  MenuAddonsCreate: 'menu-addons:create',
  MenuAddonsRead: 'menu-addons:read',
  MenuAddonsUpdate: 'menu-addons:update',
  MenuAddonsDelete: 'menu-addons:delete',

  // Shop Overrides (Feature 04) — SHOP_MANAGER and above
  ShopCategoriesUpdate: 'shop-categories:update',
  ShopMenuItemsUpdate: 'shop-menu-items:update',
  ShopMenuAddonsUpdate: 'shop-menu-addons:update',
} as const;

export type Permission = (typeof Permissions)[keyof typeof Permissions];
