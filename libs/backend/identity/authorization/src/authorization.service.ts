import { ForbiddenException, Injectable } from '@nestjs/common';
import type { AuthenticatedUser, Permission } from '@yellowladder/shared-types';
import { UserRole } from '@yellowladder/shared-types';
import { RolePermissionRegistry } from './role-permission-registry';

/**
 * Central authorization facade injected by every domain service.
 *
 * Contracts:
 *   - `requirePermission(user, permission)` — throws `ForbiddenException` if
 *     the user's role does not hold the permission. Services call this as
 *     the FIRST LINE of every data-touching method.
 *   - `hasPermission(user, permission)` — boolean variant for conditional
 *     logic and field-level redaction decisions.
 *   - `scopeWhereToUserShops(user, baseWhere)` — appends `shopId IN [...]`
 *     for shop-bounded roles (`SHOP_MANAGER`, `EMPLOYEE`); no-op for
 *     `COMPANY_ADMIN` and `SUPER_ADMIN`. Feature 01 touches no shop-scoped
 *     data yet, but the helper is defined to keep domain services consistent.
 *   - `assertShopAccess(user, shopId)` — single-shop write gate.
 *   - `assertCompanyAccess(user, companyId)` — cross-company gate.
 */
@Injectable()
export class AuthorizationService {
  hasPermission(user: Pick<AuthenticatedUser, 'role'>, permission: Permission): boolean {
    if (user.role === UserRole.SuperAdmin) {
      return true;
    }
    const permissions = RolePermissionRegistry[user.role];
    return permissions?.has(permission) ?? false;
  }

  requirePermission(user: Pick<AuthenticatedUser, 'role'>, permission: Permission): void {
    if (!this.hasPermission(user, permission)) {
      throw new ForbiddenException({
        errorCode: 'IDENTITY.AUTHORIZATION.PERMISSION_DENIED',
        message: `Permission ${permission} is required`,
      });
    }
  }

  /**
   * Append shop-id scoping to a Prisma WHERE clause. No-op for
   * `COMPANY_ADMIN` and `SUPER_ADMIN`. Feature 01 does not write to any
   * shop-scoped model, so callers are unlikely — the helper is provided so
   * later features do not need to re-invent it.
   */
  scopeWhereToUserShops<TWhere extends { shopId?: unknown }>(
    user: Pick<AuthenticatedUser, 'role' | 'shopIds'>,
    baseWhere: TWhere,
  ): TWhere {
    if (user.role === UserRole.SuperAdmin || user.role === UserRole.CompanyAdmin) {
      return baseWhere;
    }
    return {
      ...baseWhere,
      shopId: { in: [...user.shopIds] },
    };
  }

  assertShopAccess(user: Pick<AuthenticatedUser, 'role' | 'shopIds'>, shopId: string): void {
    if (user.role === UserRole.SuperAdmin || user.role === UserRole.CompanyAdmin) {
      return;
    }
    if (!user.shopIds.includes(shopId)) {
      throw new ForbiddenException({
        errorCode: 'IDENTITY.AUTHORIZATION.SHOP_ACCESS_DENIED',
        message: `Shop ${shopId} is not accessible to the current user`,
      });
    }
  }

  assertCompanyAccess(
    user: Pick<AuthenticatedUser, 'role' | 'companyId'>,
    companyId: string,
  ): void {
    if (user.role === UserRole.SuperAdmin) {
      return;
    }
    if (user.companyId !== companyId) {
      throw new ForbiddenException({
        errorCode: 'IDENTITY.AUTHORIZATION.COMPANY_ACCESS_DENIED',
        message: `Company ${companyId} is not accessible to the current user`,
      });
    }
  }
}
