---
name: scaffold-web-lib
description: Scaffold a new web feature lib (React + MUI + RTK Query) for Yellow Ladder web-backoffice. One lib per backend domain, with sub-domain folders matching backend sub-modules.
argument-hint: <domain>
disable-model-invocation: true
allowed-tools: Bash(npx nx *), Read, Write, Edit, Glob
---

# Scaffold Web Feature Lib

Use this skill to create a new web feature lib at `libs/web/{domain}/`.

**Arguments:**
- `$1` — domain name (one of: `identity`, `catalog`, `ordering`, `payment`, `operations`, `integrations`)

**Pre-flight checks:**
- Confirm `libs/web/$1/` does not already exist
- Yellow Ladder web is **backoffice only** — no public web app exists
- Confirm `$1` matches one of the 6 backend domains

## Steps

1. **Generate the Nx lib:**
   ```bash
   npx nx g @nx/react:library libs/web/$1 \
     --tags="type:web,platform:web" \
     --bundler=vite \
     --no-interactive \
     --unitTestRunner=none
   ```
   `--unitTestRunner=none` because tests are deferred during the refactor.

2. **Clean up generated files:**
   - Remove the auto-generated demo component
   - Verify no `src/lib/` exists — flat `src/` only
   - Move any files from `src/lib/` to `src/`

3. **Create sub-domain folders** matching the backend sub-modules for `$1`:
   | Domain | Sub-domain folders |
   |---|---|
   | `identity` | `authentication/`, `users/`, `companies/`, `audit/` |
   | `catalog` | `categories/`, `menu-items/`, `menu-addons/`, `shops/`, `item-purchase-counts/` |
   | `ordering` | `carts/`, `orders/`, `kitchen/` |
   | `payment` | `stripe-accounts/`, `terminal/` |
   | `operations` | `discounts/`, `waste/` |
   | `integrations` | `accounting/`, `notifications/` (notifications settings UI) |

4. **Create the barrel** at `src/index.ts` that re-exports from each sub-domain folder.

5. **Verify `project.json` tags:**
   ```json
   {
     "tags": ["type:web", "platform:web"]
   }
   ```

6. **Verify `tsconfig.base.json` path** was added in alphabetical order:
   ```json
   "@yellowladder/web-$1": ["libs/web/$1/src/index.ts"]
   ```

## Conventions reminders

- **One lib per backend domain.** Don't split per sub-module — web is coarse-grained.
- **File naming:** `kebab-case` with type suffix (`menu-item-list.component.tsx`, `use-cart.hook.ts`, etc.)
- **No `src/lib/`** — flat `src/`
- **2+ files of the same suffix → group into a subdirectory** (e.g., `components/` when 2+ `.component.tsx` files exist)
- **MUI 7 only** — never Tailwind, never CSS modules
- **React Hook Form + Zod** for forms, schemas co-located as `{action}-{entity}.schema.ts`
- **`useTranslation()`** for all user-facing strings, ICU plurals for Arabic
- **CASL UI gating** via `<CanAction>` and `<CanField>` from `@yellowladder/shared-web-ui`
- **Locale-prefixed routes:** `/(en|ar)/...`

## Lib boundary enforcement

This lib may import from:
- `@yellowladder/shared-api`
- `@yellowladder/shared-store`
- `@yellowladder/shared-web-ui`
- `@yellowladder/shared-types`
- `@yellowladder/shared-utils`
- `@yellowladder/shared-i18n`

It may **NOT** import from:
- `@yellowladder/backend-*`
- `@yellowladder/mobile-*`
- `@yellowladder/shared-mobile-ui`

See `.claude/rules/web.md` §Lib Boundaries for the full rules.

## Hand-off

The `web-engineer` agent owns the implementation. Read `.claude/examples/canonical-component.tsx` and `.claude/examples/canonical-rtk-query-api.ts` before writing components.
