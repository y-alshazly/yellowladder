---
name: add-translated-columns
description: Add translated column triples (nameEn/nameDe/nameFr, descriptionEn/descriptionDe/descriptionFr, etc.) to a Prisma model for all three supported locales (en, de, fr). Owned by database-engineer.
argument-hint: <ModelName> <field-base-name>
---

# Add Translated Columns

Add a trilingual set of `{base}En` / `{base}De` / `{base}Fr` columns to an existing Prisma model.

**Owner:** `database-engineer` agent only.

**Arguments:**

- `$1` — `ModelName` (PascalCase, e.g., `MenuItem`)
- `$2` — field base name (camelCase, e.g., `name`, `description`, `tagline`)

Result: adds `${2}En`, `${2}De`, and `${2}Fr` String fields, with `@map` for snake_case columns.

## Steps

1. **Find the Prisma model** using grep across `libs/backend/infra/database/src/prisma/schema/`:

   ```
   model $1 {
   ```

2. **Read the schema file** to understand the model and its existing fields.

3. **Add the translated columns (en/de/fr)** in the appropriate position (typically near other display-text fields):

   ```prisma
   ${2}En String @map("${2_snake}_en")
   ${2}De String @map("${2_snake}_de")
   ${2}Fr String @map("${2_snake}_fr")
   ```

   Where `${2_snake}` is the snake_case version of `$2` (e.g., `displayName` → `display_name`).

4. **All three languages are required** — never make any of them optional. Yellow Ladder content is trilingual at creation time.

5. **For longer text fields** (descriptions), use `String` (not `Text`) — Prisma maps `String` to `TEXT` automatically in PostgreSQL.

6. **Generate the migration:**

   ```bash
   npx prisma migrate dev --name add_${2}_en_de_fr_to_$1 --create-only
   ```

7. **Review the generated SQL.** It should be a simple `ALTER TABLE ... ADD COLUMN ...` for all three columns.

8. **For tables with existing rows:** the migration will fail because the new columns are `NOT NULL` without defaults. Either:
   - Add a temporary default (`DEFAULT ''` for all three, then drop the default in a follow-up migration)
   - Backfill the data manually before applying

9. **Show the SQL** to the user before applying.

10. **Update `shared/types`** interface for the model:

    ```typescript
    export interface GetMenuItemResponse {
      // ... existing fields
      ${2}En: string;
      ${2}De: string;
      ${2}Fr: string;
    }
    ```

11. **Hand off to `backend-engineer`** to:
    - Add the new fields to the repository's named input types
    - Update the request DTOs (`Create${1}Dto`, `Update${1}Dto`)
    - Update the response DTO (`Get${1}Dto`)
    - Update web/mobile forms (Zod schemas + components) — these are owned by `web-engineer` / `mobile-engineer`

## Conventions

- **Prisma field naming:** camelCase with `En` / `De` / `Fr` suffix (`nameEn`, `nameDe`, `nameFr`)
- **DB column naming:** snake_case with `_en` / `_de` / `_fr` suffix via `@map` (`name_en`, `name_de`, `name_fr`)
- **All three languages required** — no optional translated columns
- **Use separate columns**, not a JSON field — easier to query and index
- **Slugs are English-only** for URL stability — never `slugEn`/`slugDe`/`slugFr`
- **Currency formatting** is locale-aware (`Intl.NumberFormat`), not stored per locale

## Hand-off

Notify `backend-engineer`, `web-engineer`, and `mobile-engineer` (in parallel) that new translated fields exist. Each owns their layer's update:

- `backend-engineer`: repository, DTOs, controllers
- `web-engineer`: form fields, list/detail components, Zod schemas
- `mobile-engineer`: form fields, screens, Zod schemas
- `add-translations` skill: add UI labels for the new fields to `en.json`, `de.json`, and `fr.json`
