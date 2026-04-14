import { Permissions, type Permission } from './permissions.constants';
import { UserRole } from './user-role.constants';

/**
 * Single source of truth for role -> permissions mapping and the role
 * hierarchy. Consumed by the backend `RolePermissionRegistry` / service-layer
 * privilege-escalation checks AND by the mobile UI gating hooks. Keeping both
 * sides consuming from the same place eliminates drift.
 *
 * Rules:
 *   - `SUPER_ADMIN` implicitly holds EVERY permission. Consumers can either
 *     grant the full set (as done here) or short-circuit in code.
 *   - `COMPANY_ADMIN` inherits `SHOP_MANAGER` which inherits `EMPLOYEE`.
 *   - `CUSTOMER` is reserved — Yellow Ladder has no customer surface today.
 *
 * Adding a new permission is a code change here + the consumer (no DB migration).
 */

const EMPLOYEE_PERMISSIONS = [
  Permissions.UsersReadSelf,
  Permissions.UsersUpdateSelf,
  Permissions.UsersChangePasswordSelf,
  Permissions.UsersUploadPhotoSelf,
  Permissions.BusinessTypesRead,
  Permissions.BusinessCategoriesRead,
  Permissions.AnnualTurnoverBandsRead,
  Permissions.PaymentMethodsRead,
  Permissions.ShopsRead,
  Permissions.CategoriesRead,
  Permissions.MenuItemsRead,
  Permissions.MenuAddonsRead,
] as const satisfies readonly Permission[];

const SHOP_MANAGER_PERMISSIONS = [
  ...EMPLOYEE_PERMISSIONS,
  Permissions.CompaniesRead,
  Permissions.ShopsUpdate,
  Permissions.UsersRead,
  Permissions.ShopCategoriesUpdate,
  Permissions.ShopMenuItemsUpdate,
  Permissions.ShopMenuAddonsUpdate,
] as const satisfies readonly Permission[];

const COMPANY_ADMIN_PERMISSIONS = [
  ...SHOP_MANAGER_PERMISSIONS,
  Permissions.CompaniesCreate,
  Permissions.CompaniesUpdate,
  Permissions.CompaniesHouseSearch,
  Permissions.CompaniesHouseLookup,
  Permissions.UsersCreate,
  Permissions.UsersUpdate,
  Permissions.UsersDelete,
  Permissions.UsersManageRoles,
  Permissions.UsersAssignShops,
  Permissions.UsersResetPassword,
  Permissions.ShopsCreate,
  Permissions.ShopsArchive,
  Permissions.ShopsReorder,
  Permissions.CategoriesCreate,
  Permissions.CategoriesUpdate,
  Permissions.CategoriesDelete,
  Permissions.CategoriesReorder,
  Permissions.MenuItemsCreate,
  Permissions.MenuItemsUpdate,
  Permissions.MenuItemsDelete,
  Permissions.MenuAddonsCreate,
  Permissions.MenuAddonsUpdate,
  Permissions.MenuAddonsDelete,
] as const satisfies readonly Permission[];

/**
 * Flat list of every permission held by each role. `SUPER_ADMIN` implicitly
 * holds every permission (populated from `Object.values(Permissions)`), so
 * consumers can either iterate this list or short-circuit the check in code.
 */
export const RolePermissions = {
  [UserRole.SuperAdmin]: Object.values(Permissions) as readonly Permission[],
  [UserRole.CompanyAdmin]: COMPANY_ADMIN_PERMISSIONS,
  [UserRole.ShopManager]: SHOP_MANAGER_PERMISSIONS,
  [UserRole.Employee]: EMPLOYEE_PERMISSIONS,
  [UserRole.Customer]: [] as readonly Permission[],
} as const satisfies Readonly<Record<UserRole, readonly Permission[]>>;

/**
 * Role hierarchy — higher number outranks lower. Consumers use this for
 * privilege-escalation checks ("caller must outrank target") and for minimum-
 * role gating on the client.
 */
export const RoleHierarchy = {
  [UserRole.SuperAdmin]: 4,
  [UserRole.CompanyAdmin]: 3,
  [UserRole.ShopManager]: 2,
  [UserRole.Employee]: 1,
  [UserRole.Customer]: 0,
} as const satisfies Readonly<Record<UserRole, number>>;
