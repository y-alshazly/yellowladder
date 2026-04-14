import { HttpStatus, Injectable } from '@nestjs/common';
import { AuthorizationService } from '@yellowladder/backend-identity-authorization';
import { BusinessException } from '@yellowladder/backend-infra-database';
import {
  CatalogCategoriesErrors,
  CatalogShopsErrors,
  Permissions,
  type AuthenticatedUser,
} from '@yellowladder/shared-types';
import type { CreateCategoryInput, UpdateCategoryInput } from './categories.repository';
import { CategoriesRepository } from './categories.repository';

@Injectable()
export class CategoriesService {
  constructor(
    private readonly repository: CategoriesRepository,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async createOne(user: AuthenticatedUser, input: Omit<CreateCategoryInput, 'sortOrder'>) {
    this.authorizationService.requirePermission(user, Permissions.CategoriesCreate);

    if (!user.companyId) {
      throw new BusinessException(
        CatalogShopsErrors.CompanyRequired,
        'User must belong to a company to create a category',
        HttpStatus.FORBIDDEN,
      );
    }

    const existingCount = await this.repository.count({});

    return this.repository.createOne({
      ...input,
      companyId: user.companyId,
      sortOrder: existingCount,
    });
  }

  async getOne(user: AuthenticatedUser, id: string) {
    this.authorizationService.requirePermission(user, Permissions.CategoriesRead);

    const category = await this.repository.findOne({ id });
    if (!category) {
      throw new BusinessException(
        CatalogCategoriesErrors.CategoryNotFound,
        'Category not found',
        HttpStatus.NOT_FOUND,
      );
    }
    return category;
  }

  async getMany(
    user: AuthenticatedUser,
    query: { skip: number; take: number; sortOrder?: 'asc' | 'desc' },
  ) {
    this.authorizationService.requirePermission(user, Permissions.CategoriesRead);

    const where = {};
    const { items, total } = await this.repository.findMany(where, query.skip, query.take, {
      sortOrder: query.sortOrder ?? 'asc',
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

  async updateOne(user: AuthenticatedUser, id: string, input: UpdateCategoryInput) {
    this.authorizationService.requirePermission(user, Permissions.CategoriesUpdate);

    const existing = await this.repository.findOne({ id });
    if (!existing) {
      throw new BusinessException(
        CatalogCategoriesErrors.CategoryNotFound,
        'Category not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return this.repository.updateOne(id, input);
  }

  async deleteOne(user: AuthenticatedUser, id: string) {
    this.authorizationService.requirePermission(user, Permissions.CategoriesDelete);

    const existing = await this.repository.findOne({ id });
    if (!existing) {
      throw new BusinessException(
        CatalogCategoriesErrors.CategoryNotFound,
        'Category not found',
        HttpStatus.NOT_FOUND,
      );
    }

    // Check if this category has menu items referencing it
    const menuItemCount = await this.repository.count({
      id,
      menuItems: { some: {} },
    });
    if (menuItemCount > 0) {
      throw new BusinessException(
        CatalogCategoriesErrors.HasMenuItems,
        'Cannot delete a category that has menu items. Remove or reassign the menu items first.',
        HttpStatus.CONFLICT,
      );
    }

    return this.repository.deleteOne(id);
  }

  async reorderCategories(user: AuthenticatedUser, categoryIds: string[]) {
    this.authorizationService.requirePermission(user, Permissions.CategoriesReorder);

    // Fetch all categories visible to the user (company-scoped via RLS)
    const { items: visibleCategories } = await this.repository.findMany({}, 0, 1000, {
      sortOrder: 'asc',
    });

    const visibleIds = new Set(visibleCategories.map((category) => category.id));
    const inputIds = new Set(categoryIds);

    // Verify no duplicates in the input list
    if (categoryIds.length !== inputIds.size) {
      throw new BusinessException(
        CatalogCategoriesErrors.InvalidReorderList,
        'Reorder list contains duplicate category IDs',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Verify the input set matches the visible categories exactly
    const hasExtraIds = categoryIds.some((id) => !visibleIds.has(id));
    const hasMissingIds = visibleCategories.some((category) => !inputIds.has(category.id));

    if (hasExtraIds || hasMissingIds) {
      throw new BusinessException(
        CatalogCategoriesErrors.InvalidReorderList,
        'Reorder list must contain exactly the categories visible to the user',
        HttpStatus.BAD_REQUEST,
      );
    }

    const updates = categoryIds.map((id, index) => ({ id, sortOrder: index }));
    await this.repository.updateManySortOrder(updates);
  }
}
