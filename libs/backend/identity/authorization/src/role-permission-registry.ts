import { RolePermissions, UserRole, type Permission } from '@yellowladder/shared-types';

/**
 * Backend-facing view of the role-to-permission mapping. The canonical data
 * lives in `@yellowladder/shared-types` under `RolePermissions` so that the
 * backend `AuthorizationService` and the mobile UI gating hooks stay in sync
 * automatically. This file just adapts the readonly array form into the
 * `ReadonlySet<Permission>` the service uses for O(1) lookups.
 *
 * Rules:
 *   - `SUPER_ADMIN` implicitly holds EVERY permission (short-circuited in
 *     `AuthorizationService.hasPermission`; the registry still lists the full
 *     set for completeness).
 *   - Adding a new permission is a code change to the shared registry plus
 *     the consumer service.
 */
export const RolePermissionRegistry: Readonly<Record<UserRole, ReadonlySet<Permission>>> = {
  [UserRole.SuperAdmin]: new Set<Permission>(RolePermissions[UserRole.SuperAdmin]),
  [UserRole.CompanyAdmin]: new Set<Permission>(RolePermissions[UserRole.CompanyAdmin]),
  [UserRole.ShopManager]: new Set<Permission>(RolePermissions[UserRole.ShopManager]),
  [UserRole.Employee]: new Set<Permission>(RolePermissions[UserRole.Employee]),
  [UserRole.Customer]: new Set<Permission>(RolePermissions[UserRole.Customer]),
};
