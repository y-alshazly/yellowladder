---
description: Mandatory data cleanup tasks that MUST complete before Row-Level Security can be rolled out. Time-limited concerns specific to the Tappd → Yellow Ladder migration.
alwaysApply: true
---

# Pre-RLS Rollout Blockers

This file documents data integrity issues in the legacy Tappd schema that **must be resolved before Row-Level Security policies can be applied to Yellow Ladder**. These are not optional cleanup — applying RLS over the current data state will silently break the application.

**Owner:** `database-engineer` (executes the cleanup) + `architect` (validates the approach).

**Status:** OPEN. This file should be deleted once both blockers are resolved and verified in the staging database.

---

## Blocker 1 — `MenuItem.companyId` is nullable

### Why this blocks RLS

PostgreSQL RLS policies of the form:

```sql
CREATE POLICY tenant_isolation ON menu_item
  FOR ALL TO app_tenant
  USING (company_id = current_setting('app.current_company')::uuid);
```

evaluate to `NULL` (not `false`) when `company_id IS NULL`. RLS treats `NULL` as **"policy did not match"**, which makes the row **invisible to every tenant query and unreachable for writes through `app_tenant`**. Any orphan rows in `menu_item` with `company_id IS NULL` become un-readable and un-writable through the application's primary database role — they effectively vanish from the system the moment RLS is enabled.

This is not a theoretical concern. The legacy `menu_item` table allows orphans today.

### Mandatory fix sequence

These four steps **must happen in the same migration** as the RLS policy. Splitting them across migrations creates a window where the application is broken.

1. **Audit orphans.** Run before any cleanup:

   ```sql
   SELECT count(*) FROM menu_item WHERE company_id IS NULL;
   ```

   Surface the count to the user. **STOP and confirm** the cleanup strategy before proceeding.

2. **Resolve orphans.** Each orphan needs a product decision — there are three options, and the user must pick one (or specify a per-row strategy):
   - **Backfill via linked Shop:** If the orphan `MenuItem` is referenced by any `ShopMenuItem`, infer the company from that shop's `company_id` and backfill.
   - **Backfill via audit log:** Look up the original creator from the legacy audit trail and use their company.
   - **Hard-delete:** Drop the orphan rows. Acceptable only if the user confirms the data is genuinely abandoned.

   **STATUS: BLOCKED on user product decision.** Do not proceed with the migration until this is resolved.

3. **Apply `NOT NULL` constraint** in the same migration as the RLS policy:

   ```sql
   ALTER TABLE menu_item ALTER COLUMN company_id SET NOT NULL;
   ```

4. **Add a recurrence guard.** Add a constraint to prevent future orphans:
   ```sql
   -- Example: ensure (company_id, name) is unique within a company,
   -- which forces every insert to specify a company.
   CREATE UNIQUE INDEX menu_item_company_id_name_idx ON menu_item (company_id, name);
   ```
   The exact constraint depends on the entity's natural key. Confirm with the architect.

### Audit checklist

Before declaring this blocker resolved:

- [ ] Run `SELECT count(*) FROM menu_item WHERE company_id IS NULL` in production-snapshot DB. Result must be `0`.
- [ ] `\d menu_item` shows `company_id` as `NOT NULL`.
- [ ] RLS policy is in place and verified by querying as `app_tenant` with `SET LOCAL app.current_company` set to a known company.
- [ ] Recurrence guard constraint is in place.

---

## Blocker 2 — `Category.shop_id` nullable + `ShopCategory` table = redundant override mechanisms

### The problem

The legacy schema supports two parallel mechanisms for shop-specific categories:

1. **Nullable `shop_id` on `Category`** — A row in `category` with `shop_id` set means "this category exists only at this shop." A row with `shop_id IS NULL` means "this category exists at the company level."
2. **`ShopCategory` override table** — A row in `shop_category` references a company-level `Category` and overrides specific fields (name, sort order, visibility) for one shop.

These are dual-purpose overloading. **Pick one.** Operating both leaves the schema ambiguous, the service layer branchy, and the RLS policies harder to reason about.

### Recommendation: Keep `ShopCategory`. Drop nullable `shop_id` from `Category`.

**Why:**

- **Schema clarity.** `Category` becomes purely a company-level entity. `ShopCategory` is purely a per-shop layer. Self-documenting.
- **Uniform inheritance semantics.** All four override tables (`ShopCategory`, `ShopMenuItem`, `ShopMenuAddon`, `ShopMenuAddonOption`) work the same way.
- **The `isNew` flag handles "shop-specific from scratch."** A `ShopCategory` with `isNew = true` and a freshly-created parent `Category` covers the case the nullable column was solving.
- **Eliminates a schema branch in RLS.** Without nullable `shop_id`, the `Category` RLS policy is the simple `company_id` form — no special-casing.
- **Eliminates a query branch in services.** "What categories does this shop see?" becomes a single query (`SELECT category JOIN shop_category WHERE shop_id = ?`) instead of a `UNION` of company-level + shop-level rows.

### Mandatory fix sequence

These steps must happen **before RLS is applied to `category`**.

1. **Audit existing shop-scoped categories.**

   ```sql
   SELECT count(*) FROM category WHERE shop_id IS NOT NULL;
   ```

   Surface the count.

2. **Migrate each shop-scoped Category to a ShopCategory.** For every row in `category` where `shop_id IS NOT NULL`:
   - Create a corresponding `Category` row at the company level (no `shop_id`) with the same fields.
   - Create a `ShopCategory` row referencing the new company-level `Category` with `is_new = true` and `shop_id` set to the original value.
   - Delete the original shop-scoped `Category` row (or update it in place, depending on the safer transactional approach).
   - Document the mapping for auditing.

3. **Drop `shop_id` from `Category`.**

   ```sql
   ALTER TABLE category DROP COLUMN shop_id;
   ```

4. **Update service code** that reads `Category.shop_id`. Search for all references and replace with the union-via-`ShopCategory` query pattern.

### Audit checklist

Before declaring this blocker resolved:

- [ ] `SELECT count(*) FROM category WHERE shop_id IS NOT NULL` returns `0` (run before the column drop).
- [ ] Every formerly-shop-scoped `Category` has a matching `ShopCategory` with `is_new = true`.
- [ ] `category.shop_id` column no longer exists.
- [ ] No service-layer code references `Category.shop_id`.
- [ ] RLS policy on `category` uses the simple `company_id` form (no `shop_id` branch).

---

## Operational Notes

- Both blockers must be resolved in the **same migration epoch** as the RLS rollout. Do not enable RLS on any multi-tenant table until orphan cleanup and `Category` deduplication are complete.
- The `database-engineer` agent owns execution. The `architect` agent validates the approach and signs off on the migration plan.
- These cleanups are likely candidates for a Cloud Run Job (matching the existing migration pattern), since they may take time on a large dataset.
- Test the cleanup against a production snapshot before running it in any shared environment.
- Document the resolution in an ADR (`docs/adr/0011-rls-rollout-prerequisites.md` or similar) for posterity.

## Open items blocking resolution

- **Blocker 1 → User decision needed.** Backfill strategy for orphan `MenuItem` rows: backfill from linked Shop, backfill from audit log, hard-delete, or per-row review. Pick one before the database-engineer can proceed.
- **Blocker 2 → No user input required**, but the `database-engineer` should write the migration script and circulate it for review before execution.
