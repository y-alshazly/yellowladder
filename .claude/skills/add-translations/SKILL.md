---
name: add-translations
description: Add translation keys to en.json, de.json, and fr.json simultaneously, using ICU message format for interpolation and plurals.
argument-hint: <namespace.key> <english-text>
---

# Add Translations

Add a new translation key to `en.json`, `de.json`, and `fr.json` in `libs/shared/i18n/src/messages/`.

**Arguments:**

- `$1` — dot-notation key path (e.g., `catalog.menuItems.create`, `common.save`)
- `$2` — English text (German and French translations will be placeholders marked `[MT]`)

## Pre-flight checks

1. Confirm `libs/shared/i18n/src/messages/en.json`, `de.json`, and `fr.json` all exist
2. Verify the key path doesn't already exist in any of the three files

## Steps

1. **Parse the key path** into segments. Example: `catalog.menuItems.create` → `["catalog", "menuItems", "create"]`

2. **Read all three JSON files.**

3. **Add the English entry** at the correct nested path. Create intermediate objects if they don't exist:

   ```json
   {
     "catalog": {
       "menuItems": {
         "create": "Create menu item"
       }
     }
   }
   ```

4. **Add the German entry** at the same path with the `[MT]` marker (machine-translated placeholder):

   ```json
   {
     "catalog": {
       "menuItems": {
         "create": "[MT] Menüelement erstellen"
       }
     }
   }
   ```

5. **Add the French entry** at the same path with the `[MT]` marker:

   ```json
   {
     "catalog": {
       "menuItems": {
         "create": "[MT] Créer un élément de menu"
       }
     }
   }
   ```

   The `[MT]` prefix flags each entry for human review by a native speaker of that language.

6. **For pluralized strings**, use ICU message format. All three locales (en, de, fr) use the simple `{one, other}` plural pattern:

   ```json
   {
     "catalog": {
       "menuItems": {
         "count": "{count, plural, one {# item} other {# items}}"
       }
     }
   }
   ```

   German equivalent:

   ```json
   {
     "catalog": {
       "menuItems": {
         "count": "[MT] {count, plural, one {# Element} other {# Elemente}}"
       }
     }
   }
   ```

   French equivalent:

   ```json
   {
     "catalog": {
       "menuItems": {
         "count": "[MT] {count, plural, one {# élément} other {# éléments}}"
       }
     }
   }
   ```

   ICU message format still handles interpolation, gender, and nested plurals — use it for any variable content, not just counts.

7. **Verify all three files are valid JSON** after the edit.

8. **Show the added entries** for visibility.

## Conventions

- **Namespace by domain.** Top-level keys: `common`, `auth`, `catalog`, `ordering`, `payment`, `operations`, `integrations`, `errors`
- **camelCase segments** (`menuItems`, not `menu_items` or `menu-items`)
- **All three languages required** — never add a key to only one or two files
- **`[MT]` flag** for machine-translated German and French — should be reviewed by native speakers
- **ICU message format** for any string with interpolation, plurals, or gender
- **Simple `{one, other}` plural forms** — all three locales use this pattern; no legacy multi-form plural rules
- **Slugs are English-only** for URL stability — don't translate them

## Hard rules

- **All three of `en.json`, `de.json`, and `fr.json` updated in the same edit** — never a subset
- **Valid JSON after edit** — no trailing commas, no comments
- **`[MT]` marker required for placeholder German and French** — distinguishes machine-translated from human-translated
- **Keep keys alphabetically sorted within each namespace** for easier merging

## Hand-off

After adding translations:

- Run `audit-translations` skill to verify completeness across all three catalogs
- Notify the appropriate engineer (`web-engineer` or `mobile-engineer`) so they can use `t('${namespace}.${key}')` in their components
- Flag the new `[MT]` German and French entries for human review
