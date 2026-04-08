---
name: scaffold-mobile-lib
description: Scaffold a new mobile feature lib (React Native bare workflow + Paper + RTK Query) for Yellow Ladder mobile-backoffice. One lib per backend domain.
argument-hint: <domain>
disable-model-invocation: true
allowed-tools: Bash(npx nx *), Read, Write, Edit, Glob
---

# Scaffold Mobile Feature Lib

Use this skill to create a new mobile feature lib at `libs/mobile/{domain}/`.

**Arguments:**
- `$1` — domain name (one of: `identity`, `catalog`, `ordering`, `payment`, `operations`)

**Pre-flight checks:**
- Confirm `libs/mobile/$1/` does not already exist
- Yellow Ladder mobile is **backoffice only** — no public mobile app
- Mobile uses 5 domains (no `integrations` — Xero/email/notifications are backend-only)

## Steps

1. **Generate the Nx lib:**
   ```bash
   npx nx g @nx/react-native:library libs/mobile/$1 \
     --tags="type:mobile,platform:mobile" \
     --no-interactive \
     --unitTestRunner=none
   ```

2. **Clean up generated files:**
   - Remove demo component
   - Verify no `src/lib/` — flat `src/` only

3. **Create sub-domain folders** matching the backend sub-modules:
   | Domain | Sub-domain folders |
   |---|---|
   | `identity` | `authentication/`, `users/`, `companies/` |
   | `catalog` | `menu-items/`, `categories/`, `menu-addons/`, `shops/` |
   | `ordering` | `pos/`, `kitchen/` (POS is the primary mobile flow) |
   | `payment` | `terminal/` (Stripe Terminal Tap-to-Pay) |
   | `operations` | `discounts/`, `waste/` |

4. **Create the barrel** at `src/index.ts`.

5. **Verify `project.json` tags:**
   ```json
   {
     "tags": ["type:mobile", "platform:mobile"]
   }
   ```

6. **Verify `tsconfig.base.json` path:**
   ```json
   "@yellowladder/mobile-$1": ["libs/mobile/$1/src/index.ts"]
   ```

## Conventions reminders

- **One lib per backend domain.** Coarse-grained.
- **File naming:** kebab-case with suffix
  - `.screen.tsx` for React Navigation screens
  - `.component.tsx` for reusable components
  - `.hook.ts` for custom hooks
  - `.navigator.tsx` for navigators (one of the few default-export exceptions)
- **React Native Paper** for UI — never custom primitives
- **React Navigation 6** for routing
- **Online-only** — no SQLite, no offline state, no `@hot-updater/react-native`
- **`react-native-keychain`** for refresh token storage
- **`react-i18next`** for translations, `I18nManager.forceRTL(true)` for Arabic + reload
- **CASL UI gating** via `<CanAction>` and `<CanField>` from `@yellowladder/shared-mobile-ui`
- **Stripe Terminal** is the sole payment surface for mobile (Tap-to-Pay)

## Lib boundary enforcement

This lib may import from:
- `@yellowladder/shared-api`
- `@yellowladder/shared-store`
- `@yellowladder/shared-mobile-ui`
- `@yellowladder/shared-types`
- `@yellowladder/shared-utils`
- `@yellowladder/shared-i18n`

It may **NOT** import from:
- `@yellowladder/backend-*`
- `@yellowladder/web-*`
- `@yellowladder/shared-web-ui`

See `.claude/rules/mobile.md` §Lib Boundaries.

## Hand-off

The `mobile-engineer` agent owns the implementation. Read `.claude/examples/canonical-screen.tsx` for the screen pattern. Mention iOS + Android verification in any hand-off.
