// @ts-nocheck
// CANONICAL EXAMPLE: NestJS Service Pattern (Yellow Ladder)
// This is a reference file — not runnable code. Read before writing any new service.
//
// Key conventions demonstrated:
// 1. Service accepts named repository input types — NOT DTO classes, NOT raw Prisma types
// 2. 4-step RBAC authorization flow in every method:
//      requirePermission → scopeWhereToUserShops (or assertShopAccess) → repository → return
// 3. Service signature takes `user: AuthenticatedUser` — NOT `ability`
// 4. Repository pattern — service never calls Prisma directly
// 5. Domain events for cross-domain writes via DomainEventPublisher
// 6. No manual companyId filtering — RLS handles it automatically via PrismaService Proxy
// 7. Shop scoping via AuthorizationService.scopeWhereToUserShops (no-op for COMPANY_ADMIN/SUPER_ADMIN)
// 8. Returns raw entity objects — controller calls toDto()
// 9. BusinessException with domain-specific error codes from shared/types (never raw NestJS exceptions)
// 10. Field-level redaction is explicit per-role code (no ensureFieldsPermitted / pickPermittedFields)
// 11. #region blocks to group related methods

import { HttpStatus, Injectable } from '@nestjs/common';
import { AuthorizationService } from '@yellowladder/backend-identity-authorization';
import { BusinessException, DomainEventPublisher } from '@yellowladder/backend-infra-database';
import {
  AuthenticatedUser,
  CatalogMenuItemsErrors,
  DomainEventNames,
  Permissions,
  Role,
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

  //#region --- MenuItem CRUD (4-step RBAC service flow) ------------------------------------------

  // Create flow: requirePermission → (optional field redaction per role) → repository.createOne → return
  // Input type: named repository type (CreateMenuItemInput), NOT DTO class
  // companyId: passed from controller via @CurrentUser(), added by repository
  // Note: companyId is enforced by RLS — we still pass it explicitly for the create operation
  async createOne(user: AuthenticatedUser, dto: CreateMenuItemInput) {
    this.authorizationService.requirePermission(user, Permissions.MenuItemsCreate);

    // Explicit per-role field redaction (no CASL field permissions).
    // EMPLOYEE cannot set basePrice — silently strip it so Managers/Admins can still create.
    if (user.role === Role.EMPLOYEE) {
      delete dto.basePrice;
    }

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

    return this.repository.createOne({ ...dto, companyId: user.companyId });
  }

  // Read one flow: requirePermission → scopeWhereToUserShops → findOne → return
  // IMPORTANT: accepts `where: Prisma.MenuItemWhereInput` — NOT `id: string`
  // Controller passes `{ id }`; scopeWhereToUserShops appends `shopId IN [...]` for shop-bounded roles.
  async getOne(user: AuthenticatedUser, where: Record<string, unknown>) {
    this.authorizationService.requirePermission(user, Permissions.MenuItemsRead);

    const scopedWhere = this.authorizationService.scopeWhereToUserShops(user, where);

    const menuItem = await this.repository.findOne(scopedWhere);
    if (!menuItem) {
      throw new BusinessException(
        CatalogMenuItemsErrors.MenuItemNotFound,
        'Menu item not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return menuItem;
  }

  // List flow: requirePermission → buildWhereFromQuery → scopeWhereToUserShops → findMany → return
  async getMany(user: AuthenticatedUser, query: GetMenuItemsQueryDto) {
    this.authorizationService.requirePermission(user, Permissions.MenuItemsRead);

    const baseWhere = this.buildWhereFromQuery(query);

    // scopeWhereToUserShops is a no-op for COMPANY_ADMIN / SUPER_ADMIN;
    // for SHOP_MANAGER / EMPLOYEE it appends `shopId: { in: user.shopIds }`.
    const where = this.authorizationService.scopeWhereToUserShops(user, baseWhere);

    const { items, total } = await this.repository.findMany(
      where,
      query.skip,
      query.take,
      this.buildOrderByFromQuery(query),
    );

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

  // Update flow: requirePermission → scopeWhereToUserShops → fetch → (optional field redaction) → updateOne → return
  // IMPORTANT: accepts `where: Prisma.MenuItemWhereInput` — NOT `id: string`
  // Uses existing.id when calling repository.updateOne — safe after shop-scoped access check.
  async updateOne(
    user: AuthenticatedUser,
    where: Record<string, unknown>,
    dto: UpdateMenuItemInput,
  ) {
    this.authorizationService.requirePermission(user, Permissions.MenuItemsUpdate);

    const scopedWhere = this.authorizationService.scopeWhereToUserShops(user, where);

    const existing = await this.repository.findOne(scopedWhere);
    if (!existing) {
      throw new BusinessException(
        CatalogMenuItemsErrors.MenuItemNotFound,
        'Menu item not found',
        HttpStatus.NOT_FOUND,
      );
    }

    // Explicit per-role field redaction. EMPLOYEE cannot change price.
    if (user.role === Role.EMPLOYEE) {
      delete dto.basePrice;
    }

    return this.repository.updateOne(existing.id, dto);
  }

  // Delete flow: requirePermission → scopeWhereToUserShops → fetch → delete
  async deleteOne(user: AuthenticatedUser, where: Record<string, unknown>): Promise<void> {
    this.authorizationService.requirePermission(user, Permissions.MenuItemsDelete);

    const scopedWhere = this.authorizationService.scopeWhereToUserShops(user, where);

    const existing = await this.repository.findOne(scopedWhere);
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
  async activate(user: AuthenticatedUser, where: Record<string, unknown>) {
    this.authorizationService.requirePermission(user, Permissions.MenuItemsUpdate);

    const scopedWhere = this.authorizationService.scopeWhereToUserShops(user, where);

    const existing = await this.repository.findOne(scopedWhere);
    if (!existing) {
      throw new BusinessException(
        CatalogMenuItemsErrors.MenuItemNotFound,
        'Menu item not found',
        HttpStatus.NOT_FOUND,
      );
    }

    if (existing.isActive) {
      // Idempotent — already active, just return
      return existing;
    }

    const activated = await this.repository.activate(existing.id);

    // Cross-domain write via domain event — never import cross-domain services
    const event: MenuItemActivatedEvent = {
      menuItemId: activated.id,
      companyId: activated.companyId,
      activatedAt: new Date(),
    };
    await this.domainEventPublisher.publish(DomainEventNames.MenuItemActivated, event);

    return activated;
  }
  //#endregion

  //#region --- Shop-Targeted Action Example ------------------------------------------------------

  // When an action targets a SPECIFIC shop (passed in URL or body), use assertShopAccess
  // instead of scopeWhereToUserShops. This throws ForbiddenException if the user cannot
  // access that shop. It's a no-op for COMPANY_ADMIN / SUPER_ADMIN.
  async assignToShop(user: AuthenticatedUser, menuItemId: string, shopId: string) {
    this.authorizationService.requirePermission(user, Permissions.MenuItemsUpdate);
    this.authorizationService.assertShopAccess(user, shopId);

    // ... perform the assignment via repository
    return this.repository.assignToShop(menuItemId, shopId);
  }
  //#endregion

  //#region --- Private Helpers -------------------------------------------------------------------

  private buildWhereFromQuery(query: GetMenuItemsQueryDto) {
    const where: Record<string, unknown> = {};
    if (query.search) {
      where.OR = [
        { nameEn: { contains: query.search, mode: 'insensitive' } },
        { nameDe: { contains: query.search, mode: 'insensitive' } },
        { nameFr: { contains: query.search, mode: 'insensitive' } },
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
