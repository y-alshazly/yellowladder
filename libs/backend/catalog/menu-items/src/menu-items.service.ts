import { HttpStatus, Injectable } from '@nestjs/common';
import { AuthorizationService } from '@yellowladder/backend-identity-authorization';
import { BusinessException } from '@yellowladder/backend-infra-database';
import {
  CatalogMenuItemsErrors,
  CatalogShopsErrors,
  Permissions,
  type AuthenticatedUser,
} from '@yellowladder/shared-types';
import type { CreateMenuItemInput, UpdateMenuItemInput } from './menu-items.repository';
import { MenuItemsRepository } from './menu-items.repository';

@Injectable()
export class MenuItemsService {
  constructor(
    private readonly repository: MenuItemsRepository,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async createOne(user: AuthenticatedUser, input: Omit<CreateMenuItemInput, 'sortOrder'>) {
    this.authorizationService.requirePermission(user, Permissions.MenuItemsCreate);

    if (!user.companyId) {
      throw new BusinessException(
        CatalogShopsErrors.CompanyRequired,
        'User must belong to a company to create a menu item',
        HttpStatus.FORBIDDEN,
      );
    }

    const existingCount = await this.repository.count({
      categoryId: input.categoryId,
    });

    return this.repository.createOne({
      ...input,
      companyId: user.companyId,
      sortOrder: existingCount,
    });
  }

  async getOne(user: AuthenticatedUser, id: string) {
    this.authorizationService.requirePermission(user, Permissions.MenuItemsRead);

    const menuItem = await this.repository.findOne({ id });
    if (!menuItem) {
      throw new BusinessException(
        CatalogMenuItemsErrors.MenuItemNotFound,
        'Menu item not found',
        HttpStatus.NOT_FOUND,
      );
    }
    return menuItem;
  }

  async getMany(
    user: AuthenticatedUser,
    query: { skip: number; take: number; categoryId?: string },
  ) {
    this.authorizationService.requirePermission(user, Permissions.MenuItemsRead);

    const where: { categoryId?: string; isActive?: boolean } = {};
    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }

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

  async updateOne(user: AuthenticatedUser, id: string, input: UpdateMenuItemInput) {
    this.authorizationService.requirePermission(user, Permissions.MenuItemsUpdate);

    const existing = await this.repository.findOne({ id });
    if (!existing) {
      throw new BusinessException(
        CatalogMenuItemsErrors.MenuItemNotFound,
        'Menu item not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return this.repository.updateOne(id, input);
  }

  async deleteOne(user: AuthenticatedUser, id: string) {
    this.authorizationService.requirePermission(user, Permissions.MenuItemsDelete);

    const existing = await this.repository.findOne({ id });
    if (!existing) {
      throw new BusinessException(
        CatalogMenuItemsErrors.MenuItemNotFound,
        'Menu item not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return this.repository.deleteOne(id);
  }
}
