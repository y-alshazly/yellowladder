---
name: add-prisma-model
description: Add a new Prisma model to a domain schema file with snake_case mapping, UUID id, timestamps, and tenancy columns. Owned by database-engineer.
argument-hint: <ModelName> [--global]
---

# Add Prisma Model

Add a new Prisma model to the appropriate domain schema file in `libs/backend/infra/database/src/prisma/schema/`.

**Owner:** `database-engineer` agent only. Other agents must NOT use this skill — they describe the schema change and hand off.

**Arguments:**
- `$1` — `ModelName` in PascalCase (e.g., `MenuItem`, `OtpRecord`)
- `--global` (optional flag) — model is platform-global (no `companyId`/`shopId`)

## Pre-flight checks

1. Read `.claude/rules/domain-model.md` to determine which domain owns this entity.
2. Read `.claude/rules/architecture.md` §Multi-Tenancy to confirm tenancy rules.
3. Read `.claude/rules/pre-rls-blockers.md` — if the model is `MenuItem` or `Category`, **STOP** and resolve the blockers first.
4. Identify the target schema file:
   - Identity entities → `identity.prisma`
   - Catalog entities (incl. `Shop`) → `catalog.prisma`
   - Ordering entities → `ordering.prisma`
   - Payment entities → `payment.prisma`
   - Operations entities → `operations.prisma`
   - Integrations entities → `integrations.prisma`
   - **No `config.prisma`** — config enums go in `identity.prisma` alongside `Company`

## Steps

1. **Read the existing schema file** to understand current models and their patterns.

2. **Determine tenancy:**
   - Default: multi-tenant with `companyId`
   - Shop-scoped: also include `shopId`
   - `--global` flag: no tenancy columns (auth tables, log entries, config enums)

3. **Add the model** to the schema file with these required fields:

   **Multi-tenant template:**
   ```prisma
   model NewModel {
     id        String   @id @default(uuid()) @db.Uuid
     companyId String   @map("company_id") @db.Uuid
     // ... domain-specific fields ...
     createdAt DateTime @default(now()) @map("created_at")
     updatedAt DateTime @updatedAt @map("updated_at")

     company Company @relation(fields: [companyId], references: [id])

     @@map("new_model")
     @@index([companyId])
   }
   ```

   **Shop-scoped template** (additionally):
   ```prisma
     shopId String @map("shop_id") @db.Uuid
     shop   Shop   @relation(fields: [shopId], references: [id])

     @@index([shopId])
   ```

   **Platform-global template (`--global` flag):**
   ```prisma
   model NewModel {
     id        String   @id @default(uuid()) @db.Uuid
     // ... fields ...
     createdAt DateTime @default(now()) @map("created_at")
     updatedAt DateTime @updatedAt @map("updated_at")

     @@map("new_model")
   }
   ```

4. **Field naming conventions:**
   - Prisma field: `camelCase` (e.g., `menuItemId`)
   - DB column: `snake_case` via `@map("menu_item_id")`
   - Always use `@@map` and `@map` to preserve legacy snake_case naming from Tappd

5. **Monetary fields:** use `Int` (pence), never `Float` or `Decimal`. GBP £15.00 = `1500`.

6. **Run `npx prisma format`** to normalize formatting.

7. **Print the migration SQL preview** but do NOT apply it yet:
   ```bash
   npx prisma migrate dev --name add_${MODEL_SNAKE_CASE} --create-only
   ```

8. **For multi-tenant models:** append RLS policy SQL to the generated migration file. Use the `add-rls-policy` skill or insert manually:
   ```sql
   ALTER TABLE new_model ENABLE ROW LEVEL SECURITY;
   CREATE POLICY tenant_isolation ON new_model
     FOR ALL TO app_tenant
     USING (company_id = current_setting('app.current_company')::uuid);
   GRANT SELECT ON new_model TO app_public;
   GRANT ALL ON new_model TO app_system;
   ```

9. **Hand-off note for `backend-engineer`:** describe the new model, the named input types they should add to the repository, and any relations that affect existing services.

## Hard rules

- **Use the multi-file schema** — do NOT create a new `schema.prisma` file
- **Always preserve legacy table names** via `@@map` (Yellow Ladder migration principle)
- **Never use `enum` in Prisma** — if you need a status, use a `String` field with comments documenting valid values, OR use a config lookup table in `identity.prisma`
- **Never make `companyId` nullable** — see `.claude/rules/pre-rls-blockers.md` for why
- **Don't apply the migration** until the user has reviewed the SQL preview

## Hand-off

After the model is added and migration SQL reviewed, hand off to `backend-engineer` to:
- Add the named input types to the repository
- Implement service methods
- Wire up the controller and DTOs
- Update `shared/types` interfaces
