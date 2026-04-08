// @ts-nocheck
// CANONICAL EXAMPLE: NestJS Repository Pattern (Yellow Ladder)
// This is a reference file — not runnable code. Read before writing any new repository.
//
// Key conventions demonstrated:
// 1. Named input types exported (CreateMenuItemInput, UpdateMenuItemInput) — Omit<> of Prisma unchecked input
// 2. Include/select objects as module-level constants for reuse and type inference
// 3. PrismaService for tenant-scoped queries — RLS handles company_id automatically
// 4. findOne(where: Prisma.MenuItemWhereInput) — accepts full WHERE for CASL mergeConditionsIntoWhere pass-through
// 5. findMany(where, skip, take, orderBy) — explicitly typed parameters (not a params object)
// 6. Use Prisma.InputJsonValue for JSON fields (never `as never`)
// 7. Status transition methods are dedicated (e.g., activate(), deactivate()) — not generic update
// 8. #region blocks to organize methods
// 9. No `unknown`, no `as any`, no `as never` casts — use Prisma's generated types
// 10. Service code calls toInput() before passing to repository — repository accepts the named type

import { Injectable } from '@nestjs/common';
import { Prisma, PrismaService } from '@yellowladder/backend-infra-database';

// --- Named input types (exported for service and DTO use) ---
// These are Omit<> of the Prisma unchecked input, removing auto-managed fields.

export type CreateMenuItemInput = Omit<
  Prisma.MenuItemUncheckedCreateInput,
  'id' | 'createdAt' | 'updatedAt'
>;

export type UpdateMenuItemInput = Omit<
  Prisma.MenuItemUncheckedUpdateInput,
  'id' | 'companyId' | 'createdAt' | 'updatedAt'
>;

// --- Include constants (reusable across methods) ---

const MENU_ITEM_INCLUDE = {
  category: true,
  addons: { include: { options: true } },
} satisfies Prisma.MenuItemInclude;

@Injectable()
export class MenuItemsRepository {
  constructor(private readonly prisma: PrismaService) {}

  //#region --- MenuItem CRUD ---------------------------------------------------------------------

  // findOne accepts a full WhereInput so CASL mergeConditionsIntoWhere can pass conditions through
  async findOne(where: Prisma.MenuItemWhereInput) {
    return this.prisma.menuItem.findFirst({
      where,
      include: MENU_ITEM_INCLUDE,
    });
  }

  // findMany takes explicit parameters — not a single options object — so the call signature
  // is unambiguous from the service's perspective.
  async findMany(
    where: Prisma.MenuItemWhereInput,
    skip: number,
    take: number,
    orderBy: Prisma.MenuItemOrderByWithRelationInput | Prisma.MenuItemOrderByWithRelationInput[],
  ) {
    const [items, total] = await Promise.all([
      this.prisma.menuItem.findMany({
        where,
        skip,
        take,
        orderBy,
        include: MENU_ITEM_INCLUDE,
      }),
      this.prisma.menuItem.count({ where }),
    ]);
    return { items, total };
  }

  // Alternate-key lookup
  async findOneByName(nameEn: string) {
    return this.prisma.menuItem.findFirst({
      where: { nameEn },
    });
  }

  // Cross-domain helper (read-only) — Catalog reads from itself; this is intra-domain
  async findCategory(categoryId: string) {
    return this.prisma.category.findFirst({
      where: { id: categoryId },
    });
  }

  async createOne(input: CreateMenuItemInput) {
    return this.prisma.menuItem.create({
      data: input,
      include: MENU_ITEM_INCLUDE,
    });
  }

  // updateOne accepts an `id` (already verified by the service) and the typed update input
  async updateOne(id: string, input: UpdateMenuItemInput) {
    return this.prisma.menuItem.update({
      where: { id },
      data: input,
      include: MENU_ITEM_INCLUDE,
    });
  }

  async deleteOne(id: string): Promise<void> {
    await this.prisma.menuItem.delete({ where: { id } });
  }

  // Status transitions are dedicated methods, not generic updateOne calls.
  // This makes the intent explicit and the service-layer call more readable.
  async activate(id: string) {
    return this.prisma.menuItem.update({
      where: { id },
      data: { isActive: true },
      include: MENU_ITEM_INCLUDE,
    });
  }

  async deactivate(id: string) {
    return this.prisma.menuItem.update({
      where: { id },
      data: { isActive: false },
      include: MENU_ITEM_INCLUDE,
    });
  }
  //#endregion

  //#region --- Bulk Operations (only when needed) ------------------------------------------------

  // Bulk create example — only add when there's a real use case
  async createMany(inputs: CreateMenuItemInput[]) {
    return this.prisma.$transaction(
      inputs.map((input) =>
        this.prisma.menuItem.create({
          data: input,
          include: MENU_ITEM_INCLUDE,
        }),
      ),
    );
  }
  //#endregion
}

// NOTE on PrismaService:
// - PrismaService is the default tenant-scoped client. Its Proxy automatically wraps every
//   operation in a transaction with `SET LOCAL app.current_company = '{uuid}'` set from
//   TenantContextStore. RLS enforces company_id without any application-layer filtering.
// - For SUPER_ADMIN operations (when SystemPrismaService is introduced), inject SystemPrismaService
//   instead — but only in services where AuthorizationService.requirePermission() verifies the
//   SUPER_ADMIN ability first. See .claude/rules/architecture.md §Multi-Tenancy.
// - NEVER use $queryRawUnsafe with user input. RLS does not protect raw SQL.
