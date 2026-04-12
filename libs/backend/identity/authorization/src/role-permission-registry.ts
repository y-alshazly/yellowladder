import { Permissions, UserRole, type Permission } from '@yellowladder/shared-types';

/**
 * Hard-coded mapping of the 5 fixed user tiers to the flat set of permissions
 * each role holds. There is no `Role` / `Policy` table system — adding a new
 * permission is a code change to this file plus the consumer service.
 *
 * Rules:
 *   - `SUPER_ADMIN` implicitly holds EVERY permission (enforced in
 *     `AuthorizationService.hasPermission` rather than by listing every
 *     permission here, so the registry stays terse).
 *   - `COMPANY_ADMIN` is the default admin for a merchant. During Feature 01
 *     onboarding the newly-registered user is already flagged
 *     `COMPANY_ADMIN` — see `AuthenticationService.register`.
 *   - `SHOP_MANAGER` inherits `EMPLOYEE` + shop-management additions (none in
 *     Feature 01).
 *   - `EMPLOYEE` can read their own profile but nothing else in Feature 01.
 *   - `CUSTOMER` is reserved — Yellow Ladder has no customer surface today.
 *
 * Note: Feature 01 only cares about the Identity permissions. Catalog /
 * Ordering / Operations permissions will be appended by those features.
 */

const EMPLOYEE_PERMISSIONS: readonly Permission[] = [
  Permissions.UsersReadSelf,
  Permissions.UsersUpdateSelf,
  Permissions.UsersChangePasswordSelf,
  Permissions.UsersUploadPhotoSelf,
  Permissions.BusinessTypesRead,
  Permissions.BusinessCategoriesRead,
  Permissions.AnnualTurnoverBandsRead,
  Permissions.PaymentMethodsRead,
];

const SHOP_MANAGER_PERMISSIONS: readonly Permission[] = [
  ...EMPLOYEE_PERMISSIONS,
  Permissions.CompaniesRead,
];

const COMPANY_ADMIN_PERMISSIONS: readonly Permission[] = [
  ...SHOP_MANAGER_PERMISSIONS,
  Permissions.CompaniesCreate,
  Permissions.CompaniesUpdate,
  Permissions.CompaniesHouseSearch,
  Permissions.CompaniesHouseLookup,
];

export const RolePermissionRegistry: Readonly<Record<string, ReadonlySet<Permission>>> = {
  [UserRole.SuperAdmin]: new Set<Permission>(Object.values(Permissions)),
  [UserRole.CompanyAdmin]: new Set(COMPANY_ADMIN_PERMISSIONS),
  [UserRole.ShopManager]: new Set(SHOP_MANAGER_PERMISSIONS),
  [UserRole.Employee]: new Set(EMPLOYEE_PERMISSIONS),
  [UserRole.Customer]: new Set<Permission>(),
};
