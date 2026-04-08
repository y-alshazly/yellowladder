// @ts-nocheck
// CANONICAL EXAMPLE: NestJS Service Pattern (Yellow Ladder)
// This is a reference file — not runnable code. Read before writing any new service.
//
// Key conventions demonstrated:
// 1. Service accepts named repository input types — NOT DTO classes, NOT raw Prisma types
// 2. Full CASL authorization flow in every method (5-method service flow)
// 3. Repository pattern — service never calls Prisma directly
// 4. Domain events for cross-domain writes via DomainEventPublisher
// 5. No manual companyId filtering — RLS handles it automatically via PrismaService Proxy
// 6. Shop scoping via CASL mergeConditionsIntoWhere (NOT manual where clauses)
// 7. Returns raw entity objects — controller calls toDto()
// 8. BusinessException with domain-specific error codes from shared/types (never raw NestJS exceptions)
// 9. `where: Record<string, unknown>` parameter for getOne/updateOne/deleteOne — enables CASL conditions
// 10. #region blocks to group related methods

import { HttpStatus, Injectable } from '@nestjs/common';
import { AppAbility, AuthorizationService } from '@yellowladder/backend-identity-authorization';
import {
  BusinessException,
  DomainEventPublisher,
} from '@yellowladder/backend-infra-database';
import {
  CatalogMenuItemsErrors,
  DomainEventNames,
  type MenuItemActivatedEvent,
} from '@yellowladder/shared-types';
import { GetMenuItemsQueryDto } from './dtos/get-menu-items-query.dto';
import {
  MenuItemsRepository,
  type CreateMenuItemInput,
  type UpdateMenuItemInput,
} from './menu-items.repository';

@Injectable()
export class MenuItemsService {
  constructor(
    private readonly repository: MenuItemsRepository,
    private readonly authorizationService: AuthorizationService,
    private readonly domainEventPublisher: DomainEventPublisher,
  ) {}

  //#region --- MenuItem CRUD (5-method CASL service flow) ----------------------------------------

  // Create flow: requirePermission → ensureFieldsPermitted → ensureConditionsMet → create → pickPermittedFields
  // Input type: named repository type (CreateMenuItemInput), NOT DTO class
  // companyId: passed from controller via @CurrentCompany(), added by repository
  // Note: companyId is enforced by RLS — we still pass it explicitly for the create operation
  async createOne(ability: AppAbility, companyId: string, dto: CreateMenuItemInput) {
    this.authorizationService.requirePermission(ability, 'Create', 'MenuItem');
    this.authorizationService.ensureFieldsPermitted(ability, dto, 'MenuItem', 'Create');
    this.authorizationService.ensureConditionsMet(ability, { ...dto, companyId }, 'MenuItem', 'Create');

    // Business rule validation — use BusinessException with domain error codes
    const existing = await this.repository.findOneByName(dto.nameEn);
    if (existing) {
      throw new BusinessException(
        CatalogMenuItemsErrors.NameAlreadyExists,
        `Menu item with name "${dto.nameEn}" already exists`,
        HttpStatus.CONFLICT,
        { nameEn: dto.nameEn },
      );
    }

    // Verify the referenced category exists in this company
    const category = await this.repository.findCategory(dto.categoryId);
    if (!category) {
      throw new BusinessException(
        CatalogMenuItemsErrors.CategoryNotFound,
        `Category "${dto.categoryId}" not found`,
        HttpStatus.BAD_REQUEST,
        { categoryId: dto.categoryId },
      );
    }

    const menuItem = await this.repository.createOne({ ...dto, companyId });

    return this.authorizationService.pickPermittedFields(ability, menuItem, 'MenuItem', 'Read');
  }

  // Read one flow: requirePermission → mergeConditionsIntoWhere → findOne → pickPermittedFields
  // IMPORTANT: accepts `where: Record<string, unknown>` — NOT `id: string`
  // Controller passes `{ id }` — mergeConditionsIntoWhere adds CASL conditions to the WHERE
  async getOne(ability: AppAbility, where: Record<string, unknown>) {
    this.authorizationService.requirePermission(ability, 'Read', 'MenuItem');

    const mergedWhere = this.authorizationService.mergeConditionsIntoWhere(
      ability,
      'Read',
      'MenuItem',
      where,
    );

    const menuItem = await this.repository.findOne(mergedWhere);
    if (!menuItem) {
      throw new BusinessException(
        CatalogMenuItemsErrors.MenuItemNotFound,
        'Menu item not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return this.authorizationService.pickPermittedFields(ability, menuItem, 'MenuItem', 'Read');
  }

  // List flow: requirePermission → buildPrismaQuery (or hand-built) → mergeConditionsIntoWhere → findMany → pickPermittedFields
  async getMany(ability: AppAbility, query: GetMenuItemsQueryDto) {
    this.authorizationService.requirePermission(ability, 'Read', 'MenuItem');

    const baseWhere = this.buildWhereFromQuery(query);

    const where = this.authorizationService.mergeConditionsIntoWhere(
      ability,
      'Read',
      'MenuItem',
      baseWhere,
    );

    const { items, total } = await this.repository.findMany(
      where,
      query.skip,
      query.take,
      this.buildOrderByFromQuery(query),
    );

    const data = items.map((item) =>
      this.authorizationService.pickPermittedFields(ability, item, 'MenuItem', 'Read'),
    );

    return {
      data,
      meta: {
        total,
        take: query.take,
        skip: query.skip,
        hasNextPage: query.skip + query.take < total,
        hasPreviousPage: query.skip > 0,
      },
    };
  }

  // Update flow: requirePermission → mergeConditionsIntoWhere → fetch → ensureFieldsPermitted → update → pickPermittedFields
  // IMPORTANT: accepts `where: Record<string, unknown>` — NOT `id: string`
  // Uses existing.id when calling repository.updateOne — safe after access verification
  async updateOne(ability: AppAbility, where: Record<string, unknown>, dto: UpdateMenuItemInput) {
    this.authorizationService.requirePermission(ability, 'Update', 'MenuItem');

    const mergedWhere = this.authorizationService.mergeConditionsIntoWhere(
      ability,
      'Update',
      'MenuItem',
      where,
    );

    const existing = await this.repository.findOne(mergedWhere);
    if (!existing) {
      throw new BusinessException(
        CatalogMenuItemsErrors.MenuItemNotFound,
        'Menu item not found',
        HttpStatus.NOT_FOUND,
      );
    }

    this.authorizationService.ensureFieldsPermitted(ability, dto, 'MenuItem', 'Update');

    const updated = await this.repository.updateOne(existing.id, dto);

    return this.authorizationService.pickPermittedFields(ability, updated, 'MenuItem', 'Read');
  }

  // Delete flow: requirePermission → mergeConditionsIntoWhere → fetch → delete
  // No pickPermittedFields needed — void return
  async deleteOne(ability: AppAbility, where: Record<string, unknown>): Promise<void> {
    this.authorizationService.requirePermission(ability, 'Delete', 'MenuItem');

    const mergedWhere = this.authorizationService.mergeConditionsIntoWhere(
      ability,
      'Delete',
      'MenuItem',
      where,
    );

    const existing = await this.repository.findOne(mergedWhere);
    if (!existing) {
      throw new BusinessException(
        CatalogMenuItemsErrors.MenuItemNotFound,
        'Menu item not found',
        HttpStatus.NOT_FOUND,
      );
    }

    await this.repository.deleteOne(existing.id);
  }
  //#endregion

  //#region --- Status Transitions ----------------------------------------------------------------

  // Status transitions: validate current state, dedicated repository method, publish domain event
  async activate(ability: AppAbility, where: Record<string, unknown>) {
    this.authorizationService.requirePermission(ability, 'Update', 'MenuItem');

    const mergedWhere = this.authorizationService.mergeConditionsIntoWhere(
      ability,
      'Update',
      'MenuItem',
      where,
    );

    const existing = await this.repository.findOne(mergedWhere);
    if (!existing) {
      throw new BusinessException(
        CatalogMenuItemsErrors.MenuItemNotFound,
        'Menu item not found',
        HttpStatus.NOT_FOUND,
      );
    }

    if (existing.isActive) {
      // Idempotent — already active, just return
      return this.authorizationService.pickPermittedFields(ability, existing, 'MenuItem', 'Read');
    }

    const activated = await this.repository.activate(existing.id);

    // Cross-domain write via domain event — never import cross-domain services
    const event: MenuItemActivatedEvent = {
      menuItemId: activated.id,
      companyId: activated.companyId,
      activatedAt: new Date(),
    };
    await this.domainEventPublisher.publish(DomainEventNames.MenuItemActivated, event);

    return this.authorizationService.pickPermittedFields(ability, activated, 'MenuItem', 'Read');
  }
  //#endregion

  //#region --- Private Helpers -------------------------------------------------------------------

  private buildWhereFromQuery(query: GetMenuItemsQueryDto) {
    const where: Record<string, unknown> = {};
    if (query.search) {
      where.OR = [
        { nameEn: { contains: query.search, mode: 'insensitive' } },
        { nameAr: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }
    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }
    return where;
  }

  private buildOrderByFromQuery(query: GetMenuItemsQueryDto) {
    return { [query.sortBy ?? 'createdAt']: query.sortOrder ?? 'desc' };
  }
  //#endregion
}
