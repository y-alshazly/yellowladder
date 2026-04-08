---
name: add-migration
description: Generate a Prisma migration and append RLS policies + role grants for tenant-scoped tables. Owned by database-engineer.
argument-hint: <migration-name>
allowed-tools: Bash(npx prisma *), Read, Write, Edit
---

# Add Migration

Generate a Prisma migration with `--create-only`, then append RLS SQL for any new tenant-scoped tables.

**Owner:** `database-engineer` agent only.

**Argument:**
- `$1` — migration name in `snake_case` (e.g., `add_otp_record`, `enable_rls_on_menu_item`)

## Pre-flight checks

1. Confirm there are pending schema changes in `libs/backend/infra/database/src/prisma/schema/*.prisma`
2. Read `.claude/rules/pre-rls-blockers.md` — if applying RLS to `MenuItem` or `Category`, the blockers MUST be resolved first
3. Run `npx prisma validate` to confirm the schema parses

## Steps

1. **Validate and format the schema:**
   ```bash
   npx prisma validate
   npx prisma format
   ```

2. **Generate the migration with `--create-only`** (does NOT apply it yet):
   ```bash
   npx prisma migrate dev --name $1 --create-only
   ```

3. **Read the generated SQL file** at `libs/backend/infra/database/src/prisma/migrations/{timestamp}_$1/migration.sql`

4. **Identify tenant-scoped tables** that need RLS by scanning the new SQL for `CREATE TABLE` statements and checking which models have `companyId` columns.

5. **Append RLS policy SQL** for each new tenant-scoped table:
   ```sql

   -- ============================================================================
   -- RLS Policies (appended manually after Prisma migration generation)
   -- ============================================================================

   ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

   CREATE POLICY tenant_isolation ON table_name
     FOR ALL
     TO app_tenant
     USING (company_id = current_setting('app.current_company')::uuid);

   GRANT SELECT ON table_name TO app_public;
   GRANT ALL ON table_name TO app_system;
   ```

6. **For platform-global tables** (no `companyId`), append the role grants without RLS:
   ```sql
   GRANT SELECT ON table_name TO app_public;
   GRANT ALL ON table_name TO app_tenant;
   GRANT ALL ON table_name TO app_system;
   ```

7. **Show the final migration SQL to the user** for review. Do NOT apply automatically.

8. **Apply only after explicit user approval:**
   ```bash
   npx prisma migrate deploy
   ```

9. **Generate the client:**
   ```bash
   npx prisma generate
   ```

## Hard rules

- **Cloud Run Job for production migrations** — never run `prisma migrate deploy` against production from a developer machine. Production migrations run as a Cloud Run Job, matching the legacy pattern. The `database-engineer` updates the migration job's container.
- **No destructive migrations without user approval** — column drops, type changes, table drops require an explicit confirmation and a rollback plan
- **Always run `prisma generate`** after applying a migration so the client stays in sync
- **RLS must be added in the same migration as the table** — splitting them creates a window where the table is unprotected
- **Pre-RLS blockers must be resolved** before applying RLS to `menu_item` or `category` (see `.claude/rules/pre-rls-blockers.md`)

## Migration safety checklist

Before applying any migration to a shared environment:
- [ ] User has reviewed the SQL
- [ ] Destructive changes (drops, type changes) have explicit approval
- [ ] RLS policies are in place for all new tenant-scoped tables
- [ ] Role grants are correct (`app_tenant`, `app_public`, `app_system`)
- [ ] If altering existing data, backfill SQL is included
- [ ] Rollback plan is documented
- [ ] Tested against a production snapshot (for non-trivial migrations)

## Hand-off

After the migration is applied:
- Print the list of changed tables/models so `backend-engineer` knows which repositories to update
- Note any breaking field changes that affect DTO contracts
