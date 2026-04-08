---
name: audit-translations
description: Scan components for missing translation keys and find orphaned keys in en.json/ar.json. Read-only audit.
argument-hint: [domain]
disable-model-invocation: true
allowed-tools: Read, Grep, Glob
---

# Audit Translations

Scan the codebase for missing or orphaned translation keys. Read-only — does not modify any files.

**Argument:**
- `$1` (optional) — domain to scope the audit (e.g., `catalog`, `ordering`). If omitted, audits all domains.

## Pre-flight checks

1. Confirm `libs/shared/i18n/src/messages/en.json` and `ar.json` exist
2. Determine scan scope:
   - If `$1` provided: `libs/web/$1/`, `libs/mobile/$1/`
   - Otherwise: `libs/web/`, `libs/mobile/`

## Steps

1. **Read both translation files** and extract all key paths.

2. **Extract all `t('...')` and `t("...")` calls** from the scoped source files using grep:
   ```
   t\(['"]([\w.]+)['"]
   ```
   Also catch `useTranslation` patterns and any dynamic `t(${...})` calls (these can't be statically verified, so flag them as warnings).

3. **Compute three sets of findings:**

   **Missing translations** — keys used in code but not present in `en.json` or `ar.json`:
   - ERROR severity
   - List the file:line where the missing key is used
   - For each missing key, suggest the namespace it should live under

   **Orphaned keys** — keys present in JSON files but not used in any code:
   - WARNING severity
   - List the JSON file path and key
   - Note: dynamic keys (`t(\`${prefix}.${suffix}\`)`) may produce false positives

   **Translation quality issues:**
   - INFO severity
   - Keys with `[MT]` prefix in Arabic (machine-translated, needs human review)
   - English plural strings with no corresponding Arabic ICU plural forms
   - Arabic plural strings missing one of the 6 forms (`zero`, `one`, `two`, `few`, `many`, `other`)
   - Mismatched ICU placeholders between en and ar (e.g., `{count}` in en, `{numbers}` in ar)

4. **Output a structured report:**

   ```
   # Translation Audit ${1 ?? "(all)"}

   ## Missing Translations (ERROR)
   - `catalog.menuItems.create` — used in libs/web/catalog/src/menu-items/menu-item-form.component.tsx:42
     Suggested location: en.json → catalog.menuItems
   - `ordering.kitchen.snapshot` — used in libs/mobile/ordering/src/kitchen/kitchen.screen.tsx:18
     ...

   ## Orphaned Keys (WARNING)
   - `common.legacyButton` — defined in en.json:104, ar.json:104, no usage found
     (Note: dynamic keys may produce false positives)

   ## Quality Issues (INFO)
   - `[MT]` Arabic entries pending human review:
     - catalog.menuItems.create
     - catalog.menuItems.delete
     ...
   - Incomplete Arabic plurals (missing forms):
     - catalog.menuItems.count: missing 'two', 'few', 'many'
     ...

   ## Summary
   - Missing: 3
   - Orphaned: 5
   - Quality issues: 12
   - Files scanned: 47
   - Total keys in en.json: 234
   - Total keys in ar.json: 234
   ```

## Hard rules

- **READ-ONLY** — never modify `en.json`, `ar.json`, or any source files
- **Never auto-delete orphaned keys** — they may be referenced dynamically
- **Always check both `en.json` and `ar.json`** — keys present in only one file are a bug

## Hand-off

After the audit:
- Use `add-translations` skill to add missing keys
- Manually review `[MT]` Arabic entries with a native speaker
- For orphaned keys, confirm they're not used dynamically before deleting
