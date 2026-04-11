---
name: audit-translations
description: Scan components for missing translation keys and find orphaned keys across en.json, de.json, and fr.json. Read-only audit.
argument-hint: [domain]
disable-model-invocation: true
allowed-tools: Read, Grep, Glob
---

# Audit Translations

Scan the codebase for missing or orphaned translation keys across all three locale catalogs. Read-only — does not modify any files.

**Argument:**

- `$1` (optional) — domain to scope the audit (e.g., `catalog`, `ordering`). If omitted, audits all domains.

## Pre-flight checks

1. Confirm `libs/shared/i18n/src/messages/en.json`, `de.json`, and `fr.json` all exist
2. Determine scan scope:
   - If `$1` provided: `libs/web/$1/`, `libs/mobile/$1/`
   - Otherwise: `libs/web/`, `libs/mobile/`

## Steps

1. **Read all three translation files** (`en.json`, `de.json`, `fr.json`) and extract all key paths from each.

2. **Extract all `t('...')` and `t("...")` calls** from the scoped source files using grep:

   ```
   t\(['"]([\w.]+)['"]
   ```

   Also catch `useTranslation` patterns and any dynamic `t(${...})` calls (these can't be statically verified, so flag them as warnings).

3. **Compute three sets of findings:**

   **Missing translations** — keys used in code but missing from one or more of `en.json`, `de.json`, `fr.json`:
   - ERROR severity
   - List the file:line where the missing key is used
   - Name which of the three catalogs the key is missing from
   - For each missing key, suggest the namespace it should live under

   **Orphaned keys** — keys present in one or more JSON files but not used in any code:
   - WARNING severity
   - List the JSON file path and key
   - Note: dynamic keys (`t(\`${prefix}.${suffix}\`)`) may produce false positives

   **Cross-catalog consistency issues** — a key exists in some catalogs but not others (a bug even if the key is used in code, because one locale will break):
   - ERROR severity
   - List which catalogs contain the key and which don't

   **Translation quality issues:**
   - INFO severity
   - Keys with `[MT]` prefix in `de.json` or `fr.json` (machine-translated, needs human review)
   - English plural strings with no corresponding ICU plural form in `de.json` or `fr.json`
   - Mismatched ICU placeholders across the three locales (e.g., `{count}` in en, `{numbers}` in de)

4. **Output a structured report:**

   ```
   # Translation Audit ${1 ?? "(all)"}

   ## Missing Translations (ERROR)
   - `catalog.menuItems.create` — used in libs/web/catalog/src/menu-items/menu-item-form.component.tsx:42
     Missing from: en.json, de.json, fr.json
     Suggested location: catalog.menuItems
   - `ordering.kitchen.snapshot` — used in libs/mobile/ordering/src/kitchen/kitchen.screen.tsx:18
     Missing from: fr.json
     ...

   ## Cross-catalog Inconsistencies (ERROR)
   - `common.save` — present in en.json, de.json; MISSING from fr.json

   ## Orphaned Keys (WARNING)
   - `common.legacyButton` — defined in en.json:104, de.json:104, fr.json:104, no usage found
     (Note: dynamic keys may produce false positives)

   ## Quality Issues (INFO)
   - `[MT]` entries pending human review:
     - de.json → catalog.menuItems.create
     - fr.json → catalog.menuItems.create
     - de.json → catalog.menuItems.delete
     ...

   ## Summary
   - Missing: 3
   - Cross-catalog inconsistencies: 1
   - Orphaned: 5
   - Quality issues: 12
   - Files scanned: 47
   - Total keys in en.json: 234
   - Total keys in de.json: 233
   - Total keys in fr.json: 234
   ```

## Hard rules

- **READ-ONLY** — never modify `en.json`, `de.json`, `fr.json`, or any source files
- **Never auto-delete orphaned keys** — they may be referenced dynamically
- **Always check all three of `en.json`, `de.json`, and `fr.json`** — a key present in only a subset is a bug
- **Total key count should match across all three catalogs** — any divergence is an ERROR

## Hand-off

After the audit:

- Use `add-translations` skill to add missing keys across all three catalogs
- Manually review `[MT]` German and French entries with native speakers
- For orphaned keys, confirm they're not used dynamically before deleting
