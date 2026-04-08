---
name: add-translations
description: Add translation keys to en.json and ar.json simultaneously, with ICU plural rules for Arabic.
argument-hint: <namespace.key> <english-text>
---

# Add Translations

Add a new translation key to both `en.json` and `ar.json` in `libs/shared/i18n/src/messages/`.

**Arguments:**
- `$1` — dot-notation key path (e.g., `catalog.menuItems.create`, `common.save`)
- `$2` — English text (the Arabic translation will be a placeholder marked `[MT]`)

## Pre-flight checks

1. Confirm `libs/shared/i18n/src/messages/en.json` and `ar.json` exist
2. Verify the key path doesn't already exist in either file

## Steps

1. **Parse the key path** into segments. Example: `catalog.menuItems.create` → `["catalog", "menuItems", "create"]`

2. **Read both JSON files.**

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

4. **Add the Arabic entry** at the same path with the `[MT]` marker (machine-translated placeholder):
   ```json
   {
     "catalog": {
       "menuItems": {
         "create": "[MT] إنشاء عنصر القائمة"
       }
     }
   }
   ```
   The `[MT]` prefix flags it for human review by a native Arabic speaker.

5. **For pluralized strings**, use ICU message format. Arabic has 6 plural forms:
   ```json
   {
     "catalog": {
       "menuItems": {
         "count": "{count, plural, one {# item} other {# items}}"
       }
     }
   }
   ```

   Arabic equivalent (all 6 forms):
   ```json
   {
     "catalog": {
       "menuItems": {
         "count": "[MT] {count, plural, =0 {لا يوجد عناصر} one {عنصر واحد} two {عنصران} few {# عناصر} many {# عنصراً} other {# عنصر}}"
       }
     }
   }
   ```

6. **Verify both files are valid JSON** after the edit.

7. **Show the added entries** for visibility.

## Conventions

- **Namespace by domain.** Top-level keys: `common`, `auth`, `catalog`, `ordering`, `payment`, `operations`, `integrations`, `errors`
- **camelCase segments** (`menuItems`, not `menu_items` or `menu-items`)
- **Both languages required** — never add a key to only one file
- **`[MT]` flag** for machine-translated Arabic — should be reviewed by a native speaker
- **ICU plural format** for any string that depends on a count
- **6 Arabic plural forms** (`zero`, `one`, `two`, `few`, `many`, `other`) — incomplete plural keys are flagged by `audit-translations`
- **Slugs are English-only** for URL stability — don't translate them

## Hard rules

- **Both `en.json` and `ar.json` updated in the same edit** — never one without the other
- **Valid JSON after edit** — no trailing commas, no comments
- **`[MT]` marker required for placeholder Arabic** — distinguishes machine-translated from human-translated
- **Keep keys alphabetically sorted within each namespace** for easier merging

## Hand-off

After adding translations:
- Run `audit-translations` skill to verify completeness
- Notify the appropriate engineer (`web-engineer` or `mobile-engineer`) so they can use `t('${namespace}.${key}')` in their components
- Flag the new `[MT]` Arabic entries for human review
