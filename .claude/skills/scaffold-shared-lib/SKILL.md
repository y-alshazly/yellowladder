---
name: scaffold-shared-lib
description: Scaffold a new shared TypeScript lib for Yellow Ladder. Determines correct Nx tags from a lookup table.
argument-hint: <name>
disable-model-invocation: true
allowed-tools: Bash(npx nx *), Read, Write, Edit, Glob
---

# Scaffold Shared Lib

Use this skill to create a new shared lib at `libs/shared/{name}/`.

**Arguments:**
- `$1` — lib name (one of the 7 known shared libs, or a new one if explicitly approved by the architect)

## Tag lookup table

| Name | type tag | platform tag | Notes |
|---|---|---|---|
| `types` | `type:types` | `platform:any` | TypeScript interfaces, single source of truth, **zero deps** |
| `utils` | `type:util` | `platform:any` | Currency (GBP), date/timezone, phone, slugs. Depends only on `shared/types` |
| `api` | `type:data-access` | `platform:any` | RTK Query slices. **Cannot import backend libs** |
| `store` | `type:data-access` | `platform:any` | Redux client-state slices |
| `i18n` | `type:i18n` | `platform:any` | react-i18next config, en.json, ar.json, ICU plurals |
| `web-ui` | `type:web-ui` | `platform:web` | MUI theme, RTL config, composite components |
| `mobile-ui` | `type:mobile-ui` | `platform:mobile` | Paper theme, PaperProvider, composite components |

**Pre-flight checks:**
- Look up `$1` in the table above. If not present, **STOP** and confirm with the user (and the `architect` agent).
- Confirm `libs/shared/$1/` does not already exist.

## Steps

1. **Generate the Nx lib** with the appropriate tags from the table:
   ```bash
   npx nx g @nx/js:library libs/shared/$1 \
     --tags="type:TYPE,platform:PLATFORM" \
     --no-interactive \
     --unitTestRunner=none
   ```
   Replace `TYPE` and `PLATFORM` with the values from the table.

2. **Clean up:**
   - Remove demo files
   - Verify no `src/lib/` — flat `src/` only

3. **Create the barrel** at `src/index.ts`.

4. **For `web-ui` / `mobile-ui` libs only:** create a `src/theme/` directory and a `src/providers/` directory if they will hold theme/provider files.

5. **Verify `project.json` tags** match the table.

6. **Verify `tsconfig.base.json` path** in alphabetical order:
   ```json
   "@yellowladder/shared-$1": ["libs/shared/$1/src/index.ts"]
   ```

## Hard rules

- **`shared/types` has zero dependencies** — never import from any other lib
- **`shared/utils` only depends on `shared/types`**
- **`shared/api` cannot import backend libs** — only `shared/types` and `shared/utils`
- **`shared/web-ui` is web-only** — cannot be imported by mobile or backend
- **`shared/mobile-ui` is mobile-only** — cannot be imported by web or backend
- **No tests scaffolded** — tests are deferred

## Hand-off

If the new lib is `types`, `utils`, or `i18n`, the relevant engineer agents will populate it. For `web-ui` / `mobile-ui`, the `web-engineer` / `mobile-engineer` will set up the theme. For `api` / `store`, the `web-engineer` will set up the RTK Query slices.
