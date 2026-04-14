import { HttpStatus, Injectable } from '@nestjs/common';
import { AuthorizationService } from '@yellowladder/backend-identity-authorization';
import { BusinessException, type Prisma } from '@yellowladder/backend-infra-database';
import {
  CatalogShopsErrors,
  Permissions,
  UserRole,
  type AuthenticatedUser,
} from '@yellowladder/shared-types';
import type { CreateShopInput, UpdateShopInput } from './shops.repository';
import { ShopsRepository } from './shops.repository';

@Injectable()
export class ShopsService {
  constructor(
    private readonly repository: ShopsRepository,
    private readonly authorizationService: AuthorizationService,
  ) {}

  /**
   * For Shop queries, the standard `scopeWhereToUserShops` doesn't apply
   * because Shop IS the entity being scoped (it has `id`, not `shopId`).
   * This helper adds `id IN user.shopIds` for shop-bounded roles.
   */
  private scopeShopWhere(
    user: Pick<AuthenticatedUser, 'role' | 'shopIds'>,
    baseWhere: Prisma.ShopWhereInput,
  ): Prisma.ShopWhereInput {
    if (user.role === UserRole.SuperAdmin || user.role === UserRole.CompanyAdmin) {
      return baseWhere;
    }
    return {
      ...baseWhere,
      id: { in: [...user.shopIds] },
    };
  }

  /**
   * Narrow `user.companyId` from `string | null` to `string`. Rejects
   * pre-onboarding users — without this, a bare PK lookup combined with
   * `assertShopAccess` (which no-ops for COMPANY_ADMIN / SUPER_ADMIN) would
   * leave the query guarded by RLS alone. Belt-and-braces.
   */
  private assertUserHasCompany(
    user: AuthenticatedUser,
  ): asserts user is AuthenticatedUser & { companyId: string } {
    if (!user.companyId) {
      throw new BusinessException(
        CatalogShopsErrors.CompanyRequired,
        'User must belong to a company to manage shops',
        HttpStatus.FORBIDDEN,
      );
    }
  }

  async createOne(
    user: AuthenticatedUser,
    input: Omit<CreateShopInput, 'companyId' | 'isMain' | 'sortOrder'>,
  ) {
    this.authorizationService.requirePermission(user, Permissions.ShopsCreate);
    this.assertUserHasCompany(user);

    const existingCount = await this.repository.count({ companyId: user.companyId });
    const isFirst = existingCount === 0;

    return this.repository.createOne({
      ...input,
      companyId: user.companyId,
      isMain: isFirst,
      sortOrder: existingCount,
    });
  }

  async getOne(user: AuthenticatedUser, id: string) {
    this.authorizationService.requirePermission(user, Permissions.ShopsRead);

    const where = this.scopeShopWhere(user, { id });
    const shop = await this.repository.findOne(where);
    if (!shop) {
      throw new BusinessException(
        CatalogShopsErrors.ShopNotFound,
        'Shop not found',
        HttpStatus.NOT_FOUND,
      );
    }
    return shop;
  }

  async getMany(
    user: AuthenticatedUser,
    query: { skip: number; take: number; includeArchived?: boolean },
  ) {
    this.authorizationService.requirePermission(user, Permissions.ShopsRead);

    const baseWhere: Prisma.ShopWhereInput = query.includeArchived ? {} : { isArchived: false };
    const where = this.scopeShopWhere(user, baseWhere);

    const { items, total } = await this.repository.findMany(where, query.skip, query.take, {
      sortOrder: 'asc',
    });

    return {
      data: items,
      meta: {
        total,
        take: query.take,
        skip: query.skip,
        hasNextPage: query.skip + query.take < total,
        hasPreviousPage: query.skip > 0,
      },
    };
  }

  async updateOne(user: AuthenticatedUser, id: string, input: UpdateShopInput) {
    this.authorizationService.requirePermission(user, Permissions.ShopsUpdate);
    this.assertUserHasCompany(user);
    this.authorizationService.assertShopAccess(user, id);

    // Explicit `companyId` scope — belt-and-braces alongside RLS. The bare
    // PK lookup would otherwise rely on RLS alone, because
    // `assertShopAccess` no-ops for COMPANY_ADMIN / SUPER_ADMIN.
    const existing = await this.repository.findOne({ id, companyId: user.companyId });
    if (!existing) {
      throw new BusinessException(
        CatalogShopsErrors.ShopNotFound,
        'Shop not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return this.repository.updateOne(id, input);
  }

  async archiveOne(user: AuthenticatedUser, id: string) {
    this.authorizationService.requirePermission(user, Permissions.ShopsArchive);
    this.assertUserHasCompany(user);
    this.authorizationService.assertShopAccess(user, id);

    const shop = await this.repository.findOne({ id, companyId: user.companyId });
    if (!shop) {
      throw new BusinessException(
        CatalogShopsErrors.ShopNotFound,
        'Shop not found',
        HttpStatus.NOT_FOUND,
      );
    }
    if (shop.isMain) {
      throw new BusinessException(
        CatalogShopsErrors.CannotArchiveMainShop,
        'Cannot archive the main shop',
        HttpStatus.CONFLICT,
      );
    }
    if (shop.isArchived) {
      throw new BusinessException(
        CatalogShopsErrors.ShopAlreadyArchived,
        'Shop is already archived',
        HttpStatus.CONFLICT,
      );
    }

    return this.repository.updateOne(id, { isArchived: true });
  }

  async unarchiveOne(user: AuthenticatedUser, id: string) {
    this.authorizationService.requirePermission(user, Permissions.ShopsArchive);
    this.assertUserHasCompany(user);
    this.authorizationService.assertShopAccess(user, id);

    const shop = await this.repository.findOne({ id, companyId: user.companyId });
    if (!shop) {
      throw new BusinessException(
        CatalogShopsErrors.ShopNotFound,
        'Shop not found',
        HttpStatus.NOT_FOUND,
      );
    }
    if (!shop.isArchived) {
      throw new BusinessException(
        CatalogShopsErrors.ShopNotArchived,
        'Shop is not archived',
        HttpStatus.CONFLICT,
      );
    }

    return this.repository.updateOne(id, { isArchived: false });
  }

  async reorderShops(user: AuthenticatedUser, shopIds: string[]) {
    this.authorizationService.requirePermission(user, Permissions.ShopsReorder);

    // Fetch all shops visible to the user to validate the reorder list
    const where = this.scopeShopWhere(user, {});
    const { items: visibleShops } = await this.repository.findMany(where, 0, 1000, {
      sortOrder: 'asc',
    });

    const visibleIds = new Set(visibleShops.map((shop) => shop.id));
    const inputIds = new Set(shopIds);

    // Verify no duplicates in the input list
    if (shopIds.length !== inputIds.size) {
      throw new BusinessException(
        CatalogShopsErrors.InvalidReorderList,
        'Reorder list contains duplicate shop IDs',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Verify the input set matches the user's visible shops exactly
    const hasExtraIds = shopIds.some((id) => !visibleIds.has(id));
    const hasMissingIds = visibleShops.some((shop) => !inputIds.has(shop.id));

    if (hasExtraIds || hasMissingIds) {
      throw new BusinessException(
        CatalogShopsErrors.InvalidReorderList,
        'Reorder list must contain exactly the shops visible to the user',
        HttpStatus.BAD_REQUEST,
      );
    }

    const updates = shopIds.map((id, index) => ({ id, sortOrder: index }));
    await this.repository.updateManySortOrder(updates);
  }
}
