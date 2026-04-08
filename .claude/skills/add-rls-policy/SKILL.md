---
name: add-rls-policy
description: Add Row-Level Security policies and role grants for a tenant-scoped table. Owned by database-engineer.
argument-hint: <table_name>
---

# Add RLS Policy

Append RLS policies and role grants for an existing tenant-scoped table.

**Owner:** `database-engineer` agent only.

**Argument:**
- `$1` — `table_name` in `snake_case` (e.g., `menu_item`, `cart`)

## Pre-flight checks

1. Read `libs/backend/infra/database/src/prisma/schema/*.prisma` to confirm the model has a `companyId` column
2. Confirm the model uses `@@map("$1")` so the snake_case table name matches
3. **Read `.claude/rules/pre-rls-blockers.md`** — if `$1` is `menu_item` or `category`, the blockers must be resolved BEFORE applying this policy
4. Check existing migrations to confirm RLS isn't already enabled on this table

## Steps

1. **Verify orphan resolution** (relevant if `companyId` was previously nullable):
   ```sql
   SELECT count(*) FROM $1 WHERE company_id IS NULL;
   ```
   If the count is non-zero, **STOP** and resolve orphans first.

2. **Confirm `companyId` is `NOT NULL`:**
   ```sql
   SELECT is_nullable FROM information_schema.columns
   WHERE table_name = '$1' AND column_name = 'company_id';
   ```
   If `YES`, **STOP** — apply `NOT NULL` constraint in the same migration as the RLS policy.

3. **Generate the migration** (or append to an existing pending migration):
   ```bash
   npx prisma migrate dev --name enable_rls_on_$1 --create-only
   ```

4. **Append the RLS SQL** to the generated migration file:

   **Standard pattern (most multi-tenant tables):**
   ```sql
   -- Enable RLS
   ALTER TABLE $1 ENABLE ROW LEVEL SECURITY;
   ALTER TABLE $1 FORCE ROW LEVEL SECURITY;

   -- Tenant isolation policy
   CREATE POLICY tenant_isolation ON $1
     FOR ALL
     TO app_tenant
     USING (company_id = current_setting('app.current_company')::uuid)
     WITH CHECK (company_id = current_setting('app.current_company')::uuid);

   -- Role grants
   GRANT SELECT ON $1 TO app_public;
   GRANT ALL ON $1 TO app_system;
   ```

   **Notes on the pattern:**
   - `FORCE ROW LEVEL SECURITY` ensures RLS applies even to the table owner — important defense in depth
   - `USING` (read filter) and `WITH CHECK` (write filter) both prevent cross-tenant operations
   - `app_tenant` already has `ALL` privileges granted at the role-creation migration
   - `app_public` only gets `SELECT` (read-only public access if needed)
   - `app_system` bypasses RLS via `BYPASSRLS` role attribute, set in the role-creation migration

5. **For shop-scoped tables, do NOT add a `shop_id` filter to RLS.** Shop scoping is a service-layer concern enforced by CASL, not a database concern. Adding shop-scoping to RLS would couple the policy to per-request user state, which RLS isn't designed for.

6. **Show the SQL preview** and ask the user to confirm before applying.

7. **Apply the migration:**
   ```bash
   npx prisma migrate deploy
   ```

8. **Verify the policy** is active:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = '$1';
   ```

## Audit checklist

Before declaring RLS active on `$1`:
- [ ] `company_id` is `NOT NULL`
- [ ] Zero orphan rows (rows with `company_id IS NULL`)
- [ ] RLS is enabled and forced
- [ ] Tenant isolation policy is in place
- [ ] Role grants are correct
- [ ] Tested with `SET LOCAL app.current_company = '...'` against a known company
- [ ] Tested without setting `app.current_company` — should return zero rows for `app_tenant`

## Hard rules

- **`company_id` only** — never include `shop_id` in RLS policies (see `.claude/rules/architecture.md` §Multi-Tenancy)
- **Pre-RLS blockers must be resolved** for `menu_item` and `category`
- **`FORCE ROW LEVEL SECURITY`** — always include this so the table owner is also subject to RLS

## Hand-off

After RLS is active, notify `backend-engineer` so they can:
- Verify their service methods work correctly with RLS enforcement
- Remove any manual `where: { companyId: ... }` filters (RLS now handles them)
- Run integration testing manually (no automated tests yet) to confirm queries return expected results
