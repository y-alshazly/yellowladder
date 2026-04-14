import { HttpStatus, Injectable } from '@nestjs/common';
import { AuthorizationService } from '@yellowladder/backend-identity-authorization';
import { BusinessException } from '@yellowladder/backend-infra-database';
import {
  CatalogMenuAddonsErrors,
  CatalogShopsErrors,
  Permissions,
  type AuthenticatedUser,
} from '@yellowladder/shared-types';
import type {
  CreateMenuAddonOptionInput,
  UpdateMenuAddonOptionInput,
} from './menu-addon-options.repository';
import { MenuAddonOptionsRepository } from './menu-addon-options.repository';
import type { CreateMenuAddonInput, UpdateMenuAddonInput } from './menu-addons.repository';
import { MenuAddonsRepository } from './menu-addons.repository';

@Injectable()
export class MenuAddonsService {
  constructor(
    private readonly repository: MenuAddonsRepository,
    private readonly optionsRepository: MenuAddonOptionsRepository,
    private readonly authorizationService: AuthorizationService,
  ) {}

  // ---------------------------------------------------------------------------
  // MenuAddon (primary entity)
  // ---------------------------------------------------------------------------

  async createOne(user: AuthenticatedUser, input: Omit<CreateMenuAddonInput, 'companyId'>) {
    this.authorizationService.requirePermission(user, Permissions.MenuAddonsCreate);

    if (!user.companyId) {
      throw new BusinessException(
        CatalogShopsErrors.CompanyRequired,
        'User must belong to a company to create a menu addon',
        HttpStatus.FORBIDDEN,
      );
    }

    return this.repository.createOne({ ...input, companyId: user.companyId });
  }

  async getOne(user: AuthenticatedUser, id: string) {
    this.authorizationService.requirePermission(user, Permissions.MenuAddonsRead);

    const addon = await this.repository.findOne({ id });
    if (!addon) {
      throw new BusinessException(
        CatalogMenuAddonsErrors.MenuAddonNotFound,
        'Menu addon not found',
        HttpStatus.NOT_FOUND,
      );
    }
    return addon;
  }

  async getMany(
    user: AuthenticatedUser,
    query: { skip: number; take: number; menuItemId?: string },
  ) {
    this.authorizationService.requirePermission(user, Permissions.MenuAddonsRead);

    const where = query.menuItemId ? { menuItemId: query.menuItemId } : {};

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

  async updateOne(user: AuthenticatedUser, id: string, input: UpdateMenuAddonInput) {
    this.authorizationService.requirePermission(user, Permissions.MenuAddonsUpdate);

    const existing = await this.repository.findOne({ id });
    if (!existing) {
      throw new BusinessException(
        CatalogMenuAddonsErrors.MenuAddonNotFound,
        'Menu addon not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return this.repository.updateOne(id, input);
  }

  async deleteOne(user: AuthenticatedUser, id: string) {
    this.authorizationService.requirePermission(user, Permissions.MenuAddonsDelete);

    const existing = await this.repository.findOne({ id });
    if (!existing) {
      throw new BusinessException(
        CatalogMenuAddonsErrors.MenuAddonNotFound,
        'Menu addon not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return this.repository.deleteOne(id);
  }

  // ---------------------------------------------------------------------------
  // MenuAddonOption (secondary entity — qualified method names)
  // ---------------------------------------------------------------------------

  async createOption(
    user: AuthenticatedUser,
    menuAddonId: string,
    input: Omit<CreateMenuAddonOptionInput, 'companyId' | 'menuAddonId'>,
  ) {
    this.authorizationService.requirePermission(user, Permissions.MenuAddonsCreate);

    const addon = await this.repository.findOne({ id: menuAddonId });
    if (!addon) {
      throw new BusinessException(
        CatalogMenuAddonsErrors.MenuAddonNotFound,
        'Menu addon not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return this.optionsRepository.createOne({
      ...input,
      menuAddonId,
      companyId: addon.companyId,
    });
  }

  async getOptions(user: AuthenticatedUser, menuAddonId: string) {
    this.authorizationService.requirePermission(user, Permissions.MenuAddonsRead);

    const addon = await this.repository.findOne({ id: menuAddonId });
    if (!addon) {
      throw new BusinessException(
        CatalogMenuAddonsErrors.MenuAddonNotFound,
        'Menu addon not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const { items } = await this.optionsRepository.findMany({ menuAddonId }, 0, 1000, {
      sortOrder: 'asc',
    });
    return items;
  }

  async updateOption(user: AuthenticatedUser, optionId: string, input: UpdateMenuAddonOptionInput) {
    this.authorizationService.requirePermission(user, Permissions.MenuAddonsUpdate);

    const existing = await this.optionsRepository.findOne({ id: optionId });
    if (!existing) {
      throw new BusinessException(
        CatalogMenuAddonsErrors.MenuAddonOptionNotFound,
        'Menu addon option not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return this.optionsRepository.updateOne(optionId, input);
  }

  async deleteOption(user: AuthenticatedUser, optionId: string) {
    this.authorizationService.requirePermission(user, Permissions.MenuAddonsDelete);

    const existing = await this.optionsRepository.findOne({ id: optionId });
    if (!existing) {
      throw new BusinessException(
        CatalogMenuAddonsErrors.MenuAddonOptionNotFound,
        'Menu addon option not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return this.optionsRepository.deleteOne(optionId);
  }
}
