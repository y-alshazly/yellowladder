---
description: Mobile conventions for React Native libs and the mobile-backoffice app
alwaysApply: false
paths:
  - 'libs/mobile/**'
  - 'libs/shared/mobile-ui/**'
  - 'apps/mobile-backoffice/**'
  - 'libs/shared/i18n/**'
---

# Mobile Conventions (React Native + Paper)

## File Naming

Same `kebab-case.{suffix}.ts(x)` convention as web, with one addition:

| File Type | Suffix           | Example                       |
| --------- | ---------------- | ----------------------------- |
| Screen    | `.screen.tsx`    | `pos.screen.tsx`              |
| Component | `.component.tsx` | `order-row.component.tsx`     |
| Hook      | `.hook.ts`       | `use-stripe-terminal.hook.ts` |
| Navigator | `.navigator.tsx` | `root.navigator.tsx`          |
| Theme     | `.theme.ts`      | `paper.theme.ts`              |
| Provider  | `.provider.tsx`  | `paper.provider.tsx`          |

All other suffixes (`.schema.ts`, `.slice.ts`, `.api.ts`, etc.) are the same as web.

## General

- Same conventions as web where applicable (functional components, named exports, react-i18next, no `any`, no default exports — exception: React Navigation root navigators when the framework requires it).
- **React Native bare workflow** with `@nx/react-native`. **NOT Expo.**
- **React Navigation 6** for routing (not React Router).
- **React Native Paper** (Material Design 3) for UI components. **Replaces all custom UI primitives** that lived in the legacy `src/ui/` directory.

## UI Components (React Native Paper)

- Feature libs import standard components directly from `react-native-paper`. **No wrapper layer.**
- `shared/mobile-ui` provides: Paper theme configuration (MD3 with Yellow Ladder brand colors, fonts, roundness), `PaperProvider` setup, and custom composite components that don't exist in Paper (e.g., `OrderCard`, `KitchenTile`).
- **Paper components first.** Reach for `Button`, `TextInput`, `Card`, `List`, `DataTable`, `Chip`, etc. from `react-native-paper` before writing custom primitives.
- RTL is automatic — Paper reads `I18nManager.isRTL`. The app shell calls `I18nManager.forceRTL(true)` when locale is `ar`, then triggers a reload.
- Enable Paper's Babel plugin for tree-shaking to avoid bundling unused components.
- Requires `react-native-vector-icons` as a peer dependency.

## State Management

- Reuse RTK Query hooks and Redux slices from `shared/api` and `shared/store`. **Do not duplicate.**
- Forms use Zod for validation, same as web.
- **Refresh token in `react-native-keychain`.** Access token in-memory only.
- **Online-only.** No SQLite, no offline POS, no sync conflict resolution. Zustand-persisted preferences (auth token, language) are the only local state outside Redux.

## Navigation

- **React Navigation native stack** for the primary navigator.
- **Tab navigators** for major sections (POS, Kitchen, Menu, Settings).
- **Auth flow** lives outside the main navigator and conditionally renders based on auth state.
- **Deep linking** is configured in `apps/mobile-backoffice/src/navigation/linking.config.ts`.
- **Type-safe navigation** via `RootStackParamList` and `useNavigation<NativeStackNavigationProp<RootStackParamList>>`.

## Component Conventions

- **Function components only.**
- **Props interfaces** named `{Component}Props` and exported.
- **Theme tokens** for colors and spacing — never hardcode hex values or magic numbers.
- **Platform-specific code** uses `Platform.select()` or `.ios.tsx` / `.android.tsx` file extensions.
- **i18n keys** for every user-visible string. No hardcoded English/Arabic in components.

## Stripe Terminal Tap-to-Pay

- Stripe Terminal is the **sole mobile payment surface**. No card.io, no other gateways, no Paymob.
- Connection token endpoint: `POST /api/v1/payment/terminal/connection-token` returns a fresh Stripe connection token.
- Reader registration: each shop's terminal device(s) register under the company's Stripe Connect account via the backend.
- The Stripe Terminal SDK requires specific iOS Bluetooth and location permissions — **preserve them when migrating** native config from legacy.
- Online-only — Tap-to-Pay requires connectivity for every transaction.

## Native Config

- **iOS:** edit `apps/mobile-backoffice/ios/MobileClient/Info.plist`, `Podfile`, capabilities. Run `pod install` after Podfile changes.
- **Android:** edit `apps/mobile-backoffice/android/app/src/main/AndroidManifest.xml`, `build.gradle`, `proguard-rules.pro`.
- **Permissions:** add to both Info.plist (`NS*UsageDescription`) and AndroidManifest.xml.
- **Fastlane** lanes live in `apps/mobile-backoffice/fastlane/Fastfile`.
- **No `@hot-updater/react-native`.** All releases via Fastlane.
- **Don't add native dependencies casually.** Each new native lib means iOS pod install, Android Gradle sync, and potential signing/build issues.

## Lib Structure

Mobile libs are coarse — one lib per backend domain. Same sub-domain folder and conditional grouping convention as web.

```text
libs/mobile/ordering/src/
  index.ts                                # Barrel re-exports from sub-domain folders
  pos/
    screens/                              # 2+ screens → grouped
      pos.screen.tsx
      order-summary.screen.tsx
    use-cart.hook.ts                      # Single hook → flat
  kitchen/
    kitchen.screen.tsx                    # Single screen → flat
    kitchen-tile.component.tsx            # Single component → flat
    use-kitchen-socket.hook.ts            # Single hook → flat
```

## Authorization UI (CASL)

Mobile uses the same CASL authorization pattern as web. The user's ability is synced via `useAbilitySync` hook (periodic polling + app foreground refetch). Two components from `@yellowladder/shared-mobile-ui` gate UI elements.

The 5 user tiers (`SUPER_ADMIN`, `COMPANY_ADMIN`, `SHOP_MANAGER`, `EMPLOYEE`, `CUSTOMER`) determine which actions and fields are available.

### `CanAction` — Action Buttons

Wraps buttons. Hides the child by default if the user lacks permission. Use `mode="disable"` on submit buttons inside forms.

```tsx
import { CanAction } from '@yellowladder/shared-mobile-ui';

<CanAction action="Create" subject="Order">
  <Button onPress={handleCreate}>{t('ordering.create')}</Button>
</CanAction>

<CanAction action="Update" subject="MenuItem" mode="disable">
  <Button onPress={handleSave}>{t('common.save')}</Button>
</CanAction>
```

### `CanField` — Form Fields

Wraps individual form fields. Disables the field if the user lacks permission for that field.

```tsx
import { CanField } from '@yellowladder/shared-mobile-ui';

<CanField action="Update" subject="MenuItem" field="basePrice">
  <TextInput
    label={t('catalog.menuItems.basePrice')}
    value={basePrice}
    onChangeText={setBasePrice}
  />
</CanField>;
```

### Rules

- Every action button in backoffice screens must be wrapped in `<CanAction>`.
- Every form field in backoffice forms must be wrapped in `<CanField>`.
- Action and subject names match the backend CASL action/resource names exactly.
- For forms that serve both create and edit, use `action={isEdit ? 'Update' : 'Create'}`.

## Realtime (Kitchen WebSocket)

The mobile kitchen view connects to the backend `KitchenGateway` via Socket.io with the JWT access token in the auth handshake. Same protocol as web. The 15-second snapshot tick is a fallback — primary updates come from per-event WebSocket emits.

The WebSocket client lives in a hook in `mobile-ordering` and dispatches updates into a Redux slice in `shared/store`.

## i18n

- When creating new UI, add both `en.json` and `ar.json` entries in the same pass.
- Arabic has 6 plural forms. Use ICU message format.
- Same translation files as web: `libs/shared/i18n/src/messages/en.json` and `ar.json`.
- RTL toggle: `I18nManager.forceRTL(true)` for Arabic, then app reload via `Updates` (or manual restart). Handled by the `LocaleProvider` in the app shell.

## Lib Boundaries

Mobile feature libs may import from:

- `libs/shared/api/`
- `libs/shared/store/`
- `libs/shared/mobile-ui/`
- `libs/shared/types/`
- `libs/shared/utils/`
- `libs/shared/i18n/`

They may **NOT** import from:

- `libs/backend/*`
- `libs/web/*`
- `libs/shared/web-ui/`

## Things Yellow Ladder Mobile Does NOT Do

- **No offline POS.** Requires connectivity.
- **No SQLite.** No `react-native-sqlite-storage`.
- **No Apple Wallet `.pkpass` generation.** Yellow Ladder does not issue passes.
- **No QR code generation for tickets.** Yellow Ladder is a POS, not a ticketing platform.
- **No `@hot-updater/react-native`.** Dropped from legacy.
- **No Expo.** Bare workflow only.
- **No tests during the refactor.** Testing is deferred.
