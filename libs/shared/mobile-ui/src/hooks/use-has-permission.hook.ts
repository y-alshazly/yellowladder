import { Permissions, UserRole, type Permission } from '@yellowladder/shared-types';

/**
 * Client-side replica of the backend RolePermissionRegistry. Maps each of the
 * 5 fixed roles to the flat set of permissions they hold.
 *
 * This MUST be kept in sync with the backend registry in
 * `backend-identity-authorization`. Client-side gating is UX only -- the
 * backend always re-checks permissions via `AuthorizationService`.
 */
const ROLE_PERMISSIONS: Record<string, ReadonlySet<Permission>> = {
  [UserRole.SuperAdmin]: new Set(Object.values(Permissions)),
  [UserRole.CompanyAdmin]: new Set<Permission>([
    // Inherits all SHOP_MANAGER permissions (which inherits EMPLOYEE)
    // Self-service
    Permissions.UsersReadSelf,
    Permissions.UsersUpdateSelf,
    Permissions.UsersChangePasswordSelf,
    Permissions.UsersUploadPhotoSelf,
    // Reference data
    Permissions.BusinessTypesRead,
    Permissions.BusinessCategoriesRead,
    Permissions.AnnualTurnoverBandsRead,
    Permissions.PaymentMethodsRead,
    // Shops
    Permissions.ShopsRead,
    Permissions.ShopsUpdate,
    Permissions.ShopsCreate,
    Permissions.ShopsArchive,
    Permissions.ShopsReorder,
    // Team management (read from SHOP_MANAGER, full CRUD from COMPANY_ADMIN)
    Permissions.UsersRead,
    Permissions.UsersCreate,
    Permissions.UsersUpdate,
    Permissions.UsersDelete,
    Permissions.UsersManageRoles,
    Permissions.UsersAssignShops,
    Permissions.UsersResetPassword,
    // Companies
    Permissions.CompaniesRead,
    Permissions.CompaniesCreate,
    Permissions.CompaniesUpdate,
    Permissions.CompaniesHouseSearch,
    Permissions.CompaniesHouseLookup,
    // Catalog — full CRUD
    Permissions.CategoriesRead,
    Permissions.CategoriesCreate,
    Permissions.CategoriesUpdate,
    Permissions.CategoriesDelete,
    Permissions.CategoriesReorder,
    Permissions.MenuItemsRead,
    Permissions.MenuItemsCreate,
    Permissions.MenuItemsUpdate,
    Permissions.MenuItemsDelete,
    Permissions.MenuAddonsRead,
    Permissions.MenuAddonsCreate,
    Permissions.MenuAddonsUpdate,
    Permissions.MenuAddonsDelete,
    // Shop overrides
    Permissions.ShopCategoriesUpdate,
    Permissions.ShopMenuItemsUpdate,
    Permissions.ShopMenuAddonsUpdate,
  ]),
  [UserRole.ShopManager]: new Set<Permission>([
    // Self-service
    Permissions.UsersReadSelf,
    Permissions.UsersUpdateSelf,
    Permissions.UsersChangePasswordSelf,
    Permissions.UsersUploadPhotoSelf,
    // Team management (read + limited update)
    Permissions.UsersRead,
    // Companies (read own)
    Permissions.CompaniesRead,
    // Reference data
    Permissions.BusinessTypesRead,
    Permissions.BusinessCategoriesRead,
    Permissions.AnnualTurnoverBandsRead,
    Permissions.PaymentMethodsRead,
    // Shops
    Permissions.ShopsRead,
    Permissions.ShopsUpdate,
    // Categories
    Permissions.CategoriesRead,
    // Menu Items
    Permissions.MenuItemsRead,
    // Menu Addons
    Permissions.MenuAddonsRead,
    // Shop Overrides
    Permissions.ShopCategoriesUpdate,
    Permissions.ShopMenuItemsUpdate,
    Permissions.ShopMenuAddonsUpdate,
  ]),
  [UserRole.Employee]: new Set<Permission>([
    // Self-service
    Permissions.UsersReadSelf,
    Permissions.UsersUpdateSelf,
    Permissions.UsersChangePasswordSelf,
    Permissions.UsersUploadPhotoSelf,
    // Reference data
    Permissions.BusinessTypesRead,
    Permissions.BusinessCategoriesRead,
    Permissions.AnnualTurnoverBandsRead,
    Permissions.PaymentMethodsRead,
    // Shops (read only)
    Permissions.ShopsRead,
    // Categories (read only)
    Permissions.CategoriesRead,
    // Menu Items (read only)
    Permissions.MenuItemsRead,
    // Menu Addons (read only)
    Permissions.MenuAddonsRead,
  ]),
  [UserRole.Customer]: new Set<Permission>([]),
};

/**
 * Pure function that checks whether a given user role holds a specific
 * permission. This replicates the backend `RolePermissionRegistry` logic
 * for client-side UI gating.
 *
 * Returns `false` when `userRole` is `null` (unauthenticated user).
 *
 * This does NOT access Redux or any React context -- callers are responsible
 * for reading the user role from the store and passing it in.
 */
export function hasPermissionForRole(userRole: string | null, permission: string): boolean {
  if (!userRole) return false;
  const permissions = ROLE_PERMISSIONS[userRole];
  if (!permissions) return false;
  return permissions.has(permission as Permission);
}
