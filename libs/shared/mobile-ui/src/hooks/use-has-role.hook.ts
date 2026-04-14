import { UserRole } from '@yellowladder/shared-types';

/**
 * Role hierarchy ordered from most privileged to least. Used to determine
 * whether a user meets a minimum role requirement.
 */
const ROLE_HIERARCHY: readonly UserRole[] = [
  UserRole.SuperAdmin,
  UserRole.CompanyAdmin,
  UserRole.ShopManager,
  UserRole.Employee,
  UserRole.Customer,
] as const;

function getRoleLevel(role: UserRole): number {
  const index = ROLE_HIERARCHY.indexOf(role);
  return index === -1 ? ROLE_HIERARCHY.length : index;
}

/**
 * Returns true if the given user role is at or above the specified minimum
 * role in the hierarchy. For example,
 * `meetsRoleRequirement(UserRole.CompanyAdmin, UserRole.ShopManager)` returns
 * true because COMPANY_ADMIN outranks SHOP_MANAGER.
 *
 * Returns false when `userRole` is null (unauthenticated user).
 *
 * This is a pure function — it does not access Redux or any React context.
 * Callers are responsible for reading the user role from the store and
 * passing it in.
 */
export function meetsRoleRequirement(userRole: UserRole | null, minimumRole: UserRole): boolean {
  if (!userRole) return false;
  return getRoleLevel(userRole) <= getRoleLevel(minimumRole);
}
