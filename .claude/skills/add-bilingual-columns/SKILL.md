---
name: add-bilingual-columns
description: Add bilingual column pairs (nameEn/nameAr, descriptionEn/descriptionAr, etc.) to a Prisma model. Owned by database-engineer.
argument-hint: <ModelName> <field-base-name>
---

# Add Bilingual Columns

Add a pair of `{base}En` / `{base}Ar` columns to an existing Prisma model.

**Owner:** `database-engineer` agent only.

**Arguments:**
- `$1` — `ModelName` (PascalCase, e.g., `MenuItem`)
- `$2` — field base name (camelCase, e.g., `name`, `description`, `tagline`)

Result: adds `${2}En` and `${2}Ar` String fields, with `@map` for snake_case columns.

## Steps

1. **Find the Prisma model** using grep across `libs/backend/infra/database/src/prisma/schema/`:
   ```
   model $1 {
   ```

2. **Read the schema file** to understand the model and its existing fields.

3. **Add the bilingual columns** in the appropriate position (typically near other display-text fields):
   ```prisma
   ${2}En String @map("${2_snake}_en")
   ${2}Ar String @map("${2_snake}_ar")
   ```
   Where `${2_snake}` is the snake_case version of `$2` (e.g., `displayName` → `display_name`).

4. **Both languages are required** — never make one optional. Yellow Ladder content is bilingual at creation time.

5. **For longer text fields** (descriptions), use `String` (not `Text`) — Prisma maps `String` to `TEXT` automatically in PostgreSQL.

6. **Generate the migration:**
   ```bash
   npx prisma migrate dev --name add_${2}_en_ar_to_$1 --create-only
   ```

7. **Review the generated SQL.** It should be a simple `ALTER TABLE ... ADD COLUMN ...` for both columns.

8. **For tables with existing rows:** the migration will fail because the new columns are `NOT NULL` without defaults. Either:
   - Add a temporary default (`DEFAULT ''` for both, then drop the default in a follow-up migration)
   - Backfill the data manually before applying

9. **Show the SQL** to the user before applying.

10. **Update `shared/types`** interface for the model:
    ```typescript
    export interface GetMenuItemResponse {
      // ... existing fields
      ${2}En: string;
      ${2}Ar: string;
    }
    ```

11. **Hand off to `backend-engineer`** to:
    - Add the new fields to the repository's named input types
    - Update the request DTOs (`Create${1}Dto`, `Update${1}Dto`)
    - Update the response DTO (`Get${1}Dto`)
    - Update web/mobile forms (Zod schemas + components) — these are owned by `web-engineer` / `mobile-engineer`

## Conventions

- **Prisma field naming:** camelCase with `En` / `Ar` suffix (`nameEn`, `nameAr`)
- **DB column naming:** snake_case with `_en` / `_ar` suffix via `@map` (`name_en`, `name_ar`)
- **Both languages required** — no optional bilingual columns
- **Use separate columns**, not a JSON field — easier to query and index
- **Slugs are English-only** for URL stability — never `slugEn`/`slugAr`
- **Currency formatting** is locale-aware (`Intl.NumberFormat`), not stored bilingually

## Hand-off

Notify `backend-engineer`, `web-engineer`, and `mobile-engineer` (in parallel) that new bilingual fields exist. Each owns their layer's update:
- `backend-engineer`: repository, DTOs, controllers
- `web-engineer`: form fields, list/detail components, Zod schemas
- `mobile-engineer`: form fields, screens, Zod schemas
- `add-translations` skill: add UI labels for the new fields to `en.json` and `ar.json`
