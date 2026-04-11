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

> **Scope reminder:** `apps/mobile-backoffice` is the **sole active frontend** for Yellow Ladder. It runs on **phones AND tablets** (iPad, Android tablets) and the UI must be **fully responsive** across all device classes and orientations. The POS and Kitchen Display screens are tablet-primary. See §Responsive Layout below.

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
- **LTR only.** Yellow Ladder supports `en`, `de`, `fr`. Do NOT call `I18nManager.forceRTL` or read `I18nManager.isRTL`. Paper's built-in RTL handling stays dormant because the app never runs in RTL mode.
- Enable Paper's Babel plugin for tree-shaking to avoid bundling unused components.
- Requires `react-native-vector-icons` as a peer dependency.

## State Management

- Reuse RTK Query hooks and Redux slices from `shared/api` and `shared/store`. **Do not duplicate.**
- Forms use Zod for validation, same as web.
- **Refresh token in `react-native-keychain`.** Access token in-memory only.
- **Online-only.** No SQLite, no offline POS, no sync conflict resolution. Persisted preferences (auth token, selected locale from `en`/`de`/`fr`) live in `AsyncStorage` / `react-native-keychain` — not Zustand, not MMKV, not Redux-persist.

## Navigation

- **React Navigation native stack** for the primary navigator.
- **Device-aware root navigator:** phones use a **bottom tab navigator** for major sections (POS, Kitchen, Menu, Settings); tablets use a **permanent drawer navigator** (drawer is always visible on tablets, collapsible on phones). The choice is made once at mount time based on device class from `useDeviceClass()` (see §Responsive Layout).
- **Auth flow** lives outside the main navigator and conditionally renders based on auth state.
- **Deep linking** is configured in `apps/mobile-backoffice/src/navigation/linking.config.ts`.
- **Type-safe navigation** via `RootStackParamList` and `useNavigation<NativeStackNavigationProp<RootStackParamList>>`.

## Responsive Layout (Phone + Tablet)

`apps/mobile-backoffice` targets four device classes and both orientations. The UI MUST render correctly on every combination.

### Device Classes and Breakpoints

Breakpoints are based on the smallest dimension (`min(width, height)`):

| Device class   | smallest dimension | Typical devices                  | Primary layout                         |
| -------------- | ------------------ | -------------------------------- | -------------------------------------- |
| `phone`        | `< 600`            | iPhone, small Android phones     | Single column, bottom tabs             |
| `tablet`       | `600` – `899`      | iPad mini, 8–10" Android tablets | Two-column where useful, drawer nav    |
| `large-tablet` | `≥ 900`            | iPad Pro, 12"+ Android tablets   | Full tablet layout, multi-pane allowed |

Orientation is derived from `width > height` at render time.

### Canonical Hook

`useDeviceClass()` (in `libs/shared/mobile-ui/src/hooks/`) returns `{ deviceClass, orientation, width, height }` by wrapping `useWindowDimensions()`. Use it — do NOT call `Dimensions.get()` (non-reactive) or check `Platform.isPad` (iOS-only).

```tsx
import { useDeviceClass } from '@yellowladder/shared-mobile-ui';

function PosScreen() {
  const { deviceClass, orientation } = useDeviceClass();
  if (deviceClass === 'phone') return <PosPhoneLayout />;
  return <PosTabletLayout orientation={orientation} />;
}
```

### Layout Rules

- **Never hardcode pixel widths.** Use flex, `%`, or tokens from the Paper theme. Hardcoded widths break on the next device class.
- **Tablet-primary screens** (POS, Kitchen Display, Orders, Waste list) MUST be designed tablet-first in Figma and degrade to a single-column phone layout. The tablet layout is the reference; the phone layout is the fallback.
- **Phone-primary screens** (Login, OTP, Profile, Settings forms) use a single column that stretches to fit tablet with max-width padding so form fields don't become absurdly wide.
- **Master-detail pattern on tablets:** list-and-edit flows (e.g., Team members, Discounts, Categories) render as a split view on tablets (list left, detail right) and fall back to stack navigation on phones.
- **Modals vs full-screen:** forms open as modals on tablets (centered overlay with max-width) and as full-screen stack screens on phones. Use the Paper `Modal` / `Dialog` or React Navigation's `presentation: 'modal'` accordingly.
- **Safe area:** wrap every screen in `<SafeAreaView>` from `react-native-safe-area-context`. Respect notches, Dynamic Island, and Android system bars.
- **Keyboard handling:** forms use `KeyboardAvoidingView` (`behavior="padding"` on iOS, `"height"` on Android).
- **Orientation:** both portrait and landscape are supported everywhere. Test both. Tablet landscape is the **default** orientation for POS, Kitchen Display, and Orders list.

### Native Config for Tablets

- **iOS:** `Info.plist` must set `UIDeviceFamily` to `[1, 2]` (iPhone + iPad) or remove the key for universal. Enable orientation entries for portrait AND landscape left/right in `UISupportedInterfaceOrientations` and `UISupportedInterfaceOrientations~ipad`.
- **Android:** `AndroidManifest.xml` Activity must declare `android:screenOrientation="unspecified"` (or `fullSensor`) and `android:resizeableActivity="true"`. Add `<supports-screens android:largeScreens="true" android:xlargeScreens="true" />`.
- **Do NOT lock the app to portrait only.** POS users rotate their tablets.

## Component Conventions

- **Function components only.**
- **Props interfaces** named `{Component}Props` and exported.
- **Theme tokens** for colors and spacing — never hardcode hex values or magic numbers.
- **Platform-specific code** uses `Platform.select()` or `.ios.tsx` / `.android.tsx` file extensions.
- **i18n keys** for every user-visible string. No hardcoded English/German/French in components — use `useTranslation()`.

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

## Authorization UI (RBAC)

Mobile uses the same RBAC model as web. The user's `role` + flattened `permissions: Permission[]` list comes from the `/api/v1/auth/me` endpoint and is stored in the shared Redux auth slice (`@yellowladder/shared-store`). A single component — `HasPermission` — and its hook counterpart — `useHasPermission` — from `@yellowladder/shared-mobile-ui` gate UI elements. Permission strings are imported from `@yellowladder/shared-types` (`Permissions` const object, identical to web and backend).

The 5 user tiers (`SUPER_ADMIN`, `COMPANY_ADMIN`, `SHOP_MANAGER`, `EMPLOYEE`, `CUSTOMER`) determine which permissions the user holds.

### `HasPermission` — Gating Any Element

Wraps any child element. Hides by default if the user lacks the permission; switch to `mode="disable"` to keep the element visible but inert (useful for submit buttons inside forms).

```tsx
import { HasPermission } from '@yellowladder/shared-mobile-ui';
import { Permissions } from '@yellowladder/shared-types';

<HasPermission permission={Permissions.OrdersCreate}>
  <Button onPress={handleCreate}>{t('ordering.create')}</Button>
</HasPermission>

<HasPermission permission={Permissions.MenuItemsUpdate} mode="disable">
  <Button onPress={handleSave}>{t('common.save')}</Button>
</HasPermission>
```

### Field-Level Gating

No automatic helper — use the imperative hook:

```tsx
import { useHasPermission } from '@yellowladder/shared-mobile-ui';
import { Permissions } from '@yellowladder/shared-types';

const canEditPrice = useHasPermission(Permissions.MenuItemsUpdatePrice);

<TextInput
  label={t('catalog.menuItems.basePrice')}
  value={basePrice}
  editable={canEditPrice}
  onChangeText={setBasePrice}
/>;
```

### Rules

- Every action button in backoffice screens must be wrapped in `<HasPermission>`.
- Permission strings come from the shared `Permissions` const — never hardcode `'menu-items:create'`.
- For forms that serve both create and edit, compute the required permission once at the top of the component.
- **Client gating is UX only.** It hides buttons the user cannot use; it never grants access. The backend always re-checks the same permission via `AuthorizationService.requirePermission()`.

## Realtime (Kitchen WebSocket)

The mobile kitchen view connects to the backend `KitchenGateway` via Socket.io with the JWT access token in the auth handshake. Same protocol as web. The 15-second snapshot tick is a fallback — primary updates come from per-event WebSocket emits.

The WebSocket client lives in a hook in `mobile-ordering` and dispatches updates into a Redux slice in `shared/store`.

## i18n

- When creating new UI, add `en.json`, `de.json`, and `fr.json` entries **in the same commit**. The `audit-translations` skill validates every key exists in all three catalogs.
- Plural rules for `en`, `de`, `fr` are the simple `{one, other}` ICU pattern. ICU message format is still used for interpolation, gender, and nested plurals.
- Same translation files as web: `libs/shared/i18n/src/messages/en.json`, `de.json`, `fr.json`.
- **LTR only.** Do NOT call `I18nManager.forceRTL` or branch on `I18nManager.isRTL`. The app never runs in RTL mode.

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
