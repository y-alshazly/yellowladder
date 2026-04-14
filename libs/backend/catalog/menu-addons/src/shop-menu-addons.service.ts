import { HttpStatus, Injectable } from '@nestjs/common';
import { AuthorizationService } from '@yellowladder/backend-identity-authorization';
import { BusinessException } from '@yellowladder/backend-infra-database';
import {
  CatalogMenuAddonsErrors,
  CatalogShopOverridesErrors,
  Permissions,
  type AuthenticatedUser,
} from '@yellowladder/shared-types';
import { MenuAddonOptionsRepository } from './menu-addon-options.repository';
import { MenuAddonsRepository } from './menu-addons.repository';
import type { ShopMenuAddonOptionOverrideFields } from './shop-menu-addon-options.repository';
import { ShopMenuAddonOptionsRepository } from './shop-menu-addon-options.repository';
import type { ShopMenuAddonOverrideFields } from './shop-menu-addons.repository';
import { ShopMenuAddonsRepository } from './shop-menu-addons.repository';

@Injectable()
export class ShopMenuAddonsService {
  constructor(
    private readonly repository: ShopMenuAddonsRepository,
    private readonly optionsRepository: ShopMenuAddonOptionsRepository,
    private readonly menuAddonsRepository: MenuAddonsRepository,
    private readonly menuAddonOptionsRepository: MenuAddonOptionsRepository,
    private readonly authorizationService: AuthorizationService,
  ) {}

  // ---------------------------------------------------------------------------
  // ShopMenuAddon overrides
  // ---------------------------------------------------------------------------

  async getMany(user: AuthenticatedUser, shopId: string, query: { skip: number; take: number }) {
    this.authorizationService.requirePermission(user, Permissions.MenuAddonsRead);
    this.authorizationService.assertShopAccess(user, shopId);

    const where = this.authorizationService.scopeWhereToUserShops(user, { shopId });

    const { items, total } = await this.repository.findMany(where, query.skip, query.take, {
      createdAt: 'desc',
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

  async createOrUpdateOne(
    user: AuthenticatedUser,
    shopId: string,
    menuAddonId: string,
    input: ShopMenuAddonOverrideFields,
  ) {
    this.authorizationService.requirePermission(user, Permissions.ShopMenuAddonsUpdate);
    this.authorizationService.assertShopAccess(user, shopId);

    if (!user.companyId) {
      throw new BusinessException(
        CatalogMenuAddonsErrors.MenuAddonNotFound,
        'User must belong to a company',
        HttpStatus.FORBIDDEN,
      );
    }

    // Verify the parent addon exists
    const addon = await this.menuAddonsRepository.findOne({ id: menuAddonId });
    if (!addon) {
      throw new BusinessException(
        CatalogMenuAddonsErrors.MenuAddonNotFound,
        'Menu addon not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return this.repository.upsertOne(shopId, menuAddonId, user.companyId, input);
  }

  async deleteOne(user: AuthenticatedUser, shopId: string, menuAddonId: string) {
    this.authorizationService.requirePermission(user, Permissions.ShopMenuAddonsUpdate);
    this.authorizationService.assertShopAccess(user, shopId);

    const existing = await this.repository.findOne({ shopId, menuAddonId });
    if (!existing) {
      throw new BusinessException(
        CatalogShopOverridesErrors.ShopMenuAddonNotFound,
        'Shop menu addon override not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return this.repository.deleteByShopAndAddon(shopId, menuAddonId);
  }

  // ---------------------------------------------------------------------------
  // ShopMenuAddonOption overrides
  // ---------------------------------------------------------------------------

  async createOrUpdateOption(
    user: AuthenticatedUser,
    shopId: string,
    menuAddonOptionId: string,
    input: ShopMenuAddonOptionOverrideFields,
  ) {
    this.authorizationService.requirePermission(user, Permissions.ShopMenuAddonsUpdate);
    this.authorizationService.assertShopAccess(user, shopId);

    if (!user.companyId) {
      throw new BusinessException(
        CatalogMenuAddonsErrors.MenuAddonOptionNotFound,
        'User must belong to a company',
        HttpStatus.FORBIDDEN,
      );
    }

    // Verify the parent option exists
    const option = await this.menuAddonOptionsRepository.findOne({ id: menuAddonOptionId });
    if (!option) {
      throw new BusinessException(
        CatalogMenuAddonsErrors.MenuAddonOptionNotFound,
        'Menu addon option not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return this.optionsRepository.upsertOne(shopId, menuAddonOptionId, user.companyId, input);
  }

  async deleteOption(user: AuthenticatedUser, shopId: string, menuAddonOptionId: string) {
    this.authorizationService.requirePermission(user, Permissions.ShopMenuAddonsUpdate);
    this.authorizationService.assertShopAccess(user, shopId);

    const existing = await this.optionsRepository.findOne({ shopId, menuAddonOptionId });
    if (!existing) {
      throw new BusinessException(
        CatalogShopOverridesErrors.ShopMenuAddonOptionNotFound,
        'Shop menu addon option override not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return this.optionsRepository.deleteByShopAndOption(shopId, menuAddonOptionId);
  }
}
