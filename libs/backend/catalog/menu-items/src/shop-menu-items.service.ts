import { HttpStatus, Injectable } from '@nestjs/common';
import { AuthorizationService } from '@yellowladder/backend-identity-authorization';
import { BusinessException } from '@yellowladder/backend-infra-database';
import {
  CatalogMenuItemsErrors,
  CatalogShopOverridesErrors,
  CatalogShopsErrors,
  Permissions,
  type AuthenticatedUser,
} from '@yellowladder/shared-types';
import { MenuItemsRepository } from './menu-items.repository';
import type { ShopMenuItemOverrideFields } from './shop-menu-items.repository';
import { ShopMenuItemsRepository } from './shop-menu-items.repository';

@Injectable()
export class ShopMenuItemsService {
  constructor(
    private readonly repository: ShopMenuItemsRepository,
    private readonly menuItemsRepository: MenuItemsRepository,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async getMany(user: AuthenticatedUser, shopId: string, query: { skip: number; take: number }) {
    this.authorizationService.requirePermission(user, Permissions.MenuItemsRead);
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

  async createOrUpdate(
    user: AuthenticatedUser,
    shopId: string,
    menuItemId: string,
    input: ShopMenuItemOverrideFields,
  ) {
    this.authorizationService.requirePermission(user, Permissions.ShopMenuItemsUpdate);
    this.authorizationService.assertShopAccess(user, shopId);

    if (!user.companyId) {
      throw new BusinessException(
        CatalogShopsErrors.CompanyRequired,
        'User must belong to a company',
        HttpStatus.FORBIDDEN,
      );
    }

    // Verify the parent menu item exists
    const menuItem = await this.menuItemsRepository.findOne({ id: menuItemId });
    if (!menuItem) {
      throw new BusinessException(
        CatalogMenuItemsErrors.MenuItemNotFound,
        'Menu item not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return this.repository.upsertOne(shopId, menuItemId, user.companyId, input);
  }

  async deleteOne(user: AuthenticatedUser, shopId: string, menuItemId: string) {
    this.authorizationService.requirePermission(user, Permissions.ShopMenuItemsUpdate);
    this.authorizationService.assertShopAccess(user, shopId);

    const existing = await this.repository.findOne({ shopId, menuItemId });
    if (!existing) {
      throw new BusinessException(
        CatalogShopOverridesErrors.ShopMenuItemNotFound,
        'Shop menu item override not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return this.repository.deleteOne(existing.id);
  }
}
