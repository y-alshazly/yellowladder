import { HttpStatus, Injectable } from '@nestjs/common';
import { AuthorizationService } from '@yellowladder/backend-identity-authorization';
import { BusinessException } from '@yellowladder/backend-infra-database';
import {
  CatalogCategoriesErrors,
  CatalogShopOverridesErrors,
  CatalogShopsErrors,
  Permissions,
  type AuthenticatedUser,
} from '@yellowladder/shared-types';
import { CategoriesRepository } from './categories.repository';
import type { ShopCategoryOverrideFields } from './shop-categories.repository';
import { ShopCategoriesRepository } from './shop-categories.repository';

@Injectable()
export class ShopCategoriesService {
  constructor(
    private readonly repository: ShopCategoriesRepository,
    private readonly categoriesRepository: CategoriesRepository,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async getMany(user: AuthenticatedUser, shopId: string) {
    this.authorizationService.requirePermission(user, Permissions.CategoriesRead);
    this.authorizationService.assertShopAccess(user, shopId);

    const where = this.authorizationService.scopeWhereToUserShops(user, { shopId });

    return this.repository.findMany(where);
  }

  async createOrUpdate(
    user: AuthenticatedUser,
    shopId: string,
    categoryId: string,
    input: ShopCategoryOverrideFields,
  ) {
    this.authorizationService.requirePermission(user, Permissions.ShopCategoriesUpdate);
    this.authorizationService.assertShopAccess(user, shopId);

    if (!user.companyId) {
      throw new BusinessException(
        CatalogShopsErrors.CompanyRequired,
        'User must belong to a company',
        HttpStatus.FORBIDDEN,
      );
    }

    // Verify the parent category exists
    const category = await this.categoriesRepository.findOne({ id: categoryId });
    if (!category) {
      throw new BusinessException(
        CatalogCategoriesErrors.CategoryNotFound,
        'Category not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return this.repository.upsertOne(shopId, categoryId, user.companyId, input);
  }

  async deleteOne(user: AuthenticatedUser, shopId: string, categoryId: string) {
    this.authorizationService.requirePermission(user, Permissions.ShopCategoriesUpdate);
    this.authorizationService.assertShopAccess(user, shopId);

    const existing = await this.repository.findOne({ shopId, categoryId });
    if (!existing) {
      throw new BusinessException(
        CatalogShopOverridesErrors.ShopCategoryNotFound,
        'Shop category override not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return this.repository.deleteOne(shopId, categoryId);
  }
}
