import { Injectable } from '@nestjs/common';
import { PrismaService } from '@yellowladder/backend-infra-database';

/**
 * Dedicated repository for the effective menu read query.
 *
 * Loads all company-level catalog entities and shop-level overrides in a
 * single parallel batch. This is a cross-cutting read across the Catalog
 * domain — intentionally queries multiple tables rather than routing through
 * individual sub-module repositories, because the effective menu is a
 * single atomic read that should not be decomposed into sequential fetches.
 */
@Injectable()
export class EffectiveMenuRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Load all data needed to compute the effective menu for a given shop.
   *
   * **RLS contract — DO NOT bypass.**
   *
   * This method deliberately filters only by `shopId` on the four shop-override
   * tables. Tenant isolation on `company_id` is enforced **exclusively** by the
   * PostgreSQL Row-Level Security policies attached to these tables, which read
   * `current_setting('app.current_company')::uuid` from the session state set
   * by `TenantContextMiddleware` + `PrismaService`'s tenant-scoped transaction.
   *
   * If you are extending this query:
   *   - Inject `PrismaService` (the default `app_tenant` client). Never inject
   *     `SystemPrismaService` here — it runs as the `app_system` role with
   *     `BYPASSRLS`, which would silently expose cross-tenant rows.
   *   - Do NOT drop into raw SQL — escalate to the `architect` if you think
   *     raw SQL is required.
   *   - Do NOT add an explicit `companyId` filter either: it is redundant
   *     (RLS already enforces it) and masks RLS misconfigurations in tests.
   *   - Every shop-scoped table touched here must have an active RLS policy
   *     of the form `company_id = current_setting('app.current_company')::uuid`.
   *     If you add a new table to the batch, verify its policy first.
   *
   * The `database-engineer` owns the RLS policies — coordinate with them
   * before removing or changing any filter here.
   */
  async loadEffectiveMenuData(shopId: string) {
    const [
      categories,
      menuItems,
      menuAddons,
      menuAddonOptions,
      shopCategories,
      shopMenuItems,
      shopMenuAddons,
      shopMenuAddonOptions,
    ] = await Promise.all([
      this.prisma.category.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      }),
      this.prisma.menuItem.findMany({
        where: { isActive: true, isDraft: false },
        orderBy: { sortOrder: 'asc' },
      }),
      this.prisma.menuAddon.findMany({
        orderBy: { sortOrder: 'asc' },
      }),
      this.prisma.menuAddonOption.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      }),
      this.prisma.shopCategory.findMany({
        where: { shopId },
      }),
      this.prisma.shopMenuItem.findMany({
        where: { shopId },
      }),
      this.prisma.shopMenuAddon.findMany({
        where: { shopId },
      }),
      this.prisma.shopMenuAddonOption.findMany({
        where: { shopId },
      }),
    ]);

    return {
      categories,
      menuItems,
      menuAddons,
      menuAddonOptions,
      shopCategories,
      shopMenuItems,
      shopMenuAddons,
      shopMenuAddonOptions,
    };
  }
}
