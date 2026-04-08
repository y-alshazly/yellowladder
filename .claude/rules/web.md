---
description: Web conventions for React + MUI libs and the web-backoffice app
alwaysApply: false
paths:
  - 'libs/web/**'
  - 'libs/shared/web-ui/**'
  - 'libs/shared/api/**'
  - 'libs/shared/store/**'
  - 'apps/web-backoffice/**'
  - 'libs/shared/i18n/**'
---

# Web Conventions (React + MUI)

## File Naming

All files use `kebab-case.{suffix}.ts(x)`:

| File Type           | Suffix           | Example                       |
| ------------------- | ---------------- | ----------------------------- |
| Component           | `.component.tsx` | `menu-item-list.component.tsx`|
| Hook                | `.hook.ts`       | `use-cart.hook.ts`            |
| Zod schema          | `.schema.ts`     | `create-menu-item.schema.ts`  |
| RTK Query API slice | `.api.ts`        | `catalog.api.ts`              |
| Redux slice         | `.slice.ts`      | `cart.slice.ts`               |
| Route               | `.route.tsx`     | `menu-items-list.route.tsx`   |
| Provider            | `.provider.tsx`  | `rtl-cache.provider.tsx`      |
| Theme               | `.theme.ts`      | `mui.theme.ts`                |
| Utility             | `.util.ts`       | `format-currency.util.ts`     |
| Types               | `.types.ts`      | `cart.types.ts`               |
| Constants           | `.constants.ts`  | `order-status.constants.ts`   |

## UI Components (MUI 7)

- Feature libs import standard components directly from `@mui/material`. **No wrapper layer.**
- `shared/web-ui` provides: MUI theme configuration (palette, typography, RTL, breakpoints), `ThemeProvider` setup, the Emotion RTL cache, and custom composite components that don't exist in MUI (e.g., `OrderCard`, `MenuItemCard`).
- **Never define a one-off theme** in a feature lib.

## Component Conventions

- **Functional components only.** No class components.
- **One component per file.** Co-locate styles using MUI `sx` prop or `styled()`.
- **No inline strings.** All user-facing text goes through `useTranslation()` from react-i18next.
- **Props interfaces** named `{Component}Props` and exported.
- **No prop spreading** without explicit reason.
- **`useMemo` / `useCallback`** only when there's a measurable performance reason — not by default.

## State Management

- All API calls go through RTK Query hooks from `shared/api`. **No raw `fetch` in components.**
- Client state (cart, UI preferences, locale, in-memory access token) uses Redux slices in `shared/store`.
- RTK Query API slices are organized per backend domain inside `shared/api` (e.g., `catalog.api.ts`, `ordering.api.ts`, `payment.api.ts`).
- Redux store is created in the app shell (`apps/web-backoffice/src/store/store.ts`), not in libs.
- **Access token in-memory only.** Never `localStorage` or `sessionStorage`. The refresh token is in an HttpOnly cookie set by the backend.

## RTK Query Conventions

- **One API slice per backend domain** (e.g., `catalogApi`, `orderingApi`, `paymentApi`), defined in `libs/shared/api/{domain}/`.
- **Endpoint names** match the REST verb + resource: `getMenuItems`, `getMenuItemById`, `createMenuItem`, `updateMenuItem`, `deleteMenuItem`.
- **Tag types** scoped per API slice for cache invalidation.
- **DTOs** import from `shared/types`. Endpoint request/response types reference these directly — no duplication.
- **Base URL:** `/api/v1/` configured once in the base query — never hardcode the version in endpoint paths.
- **Auth header** injection via `prepareHeaders` reading the in-memory access token from `shared/store`.

## Forms and Validation (Zod)

- Forms use React Hook Form with Zod resolvers (`@hookform/resolvers/zod`).
- Zod schema files named as `{action}-{entity}.schema.ts` (e.g., `create-menu-item.schema.ts`, `update-shop.schema.ts`).
- Exported variable names remain camelCase: `createMenuItemSchema`, `updateShopSchema`.
- Infer types from Zod: `type CreateMenuItemForm = z.infer<typeof createMenuItemSchema>`.
- Zod schemas live in web libs, co-located with the forms that use them.
- **No class-validator on web** — that's the backend engineer's responsibility.

## Shared Types

- TypeScript interfaces in `shared/types` define API contracts (request/response shapes).
- Request interfaces: `{Action}{Entity}Request` (e.g., `CreateMenuItemRequest`, `UpdateMenuItemRequest`).
- Response interfaces: `Get{Entity}Response` (e.g., `GetMenuItemResponse`).
- Zod schemas conform to these interfaces.
- Backend DTO classes implement these interfaces: `CreateMenuItemDto implements CreateMenuItemRequest`, `GetMenuItemDto implements GetMenuItemResponse`.

## Routing

- **Locale-prefixed:** every route is `/(en|ar)/{path}`. Example: `/en/menu-items`, `/ar/orders/123`.
- **Route table** lives in `apps/web-backoffice/src/routes/`.
- **Lazy load** feature libs at the route boundary (`React.lazy` + `Suspense`).
- **Auth guard** at the route level — unauthenticated users redirect to `/(en|ar)/login`.
- **RTL switching:** the locale segment determines `dir="rtl"` on the document root via the `LocaleProvider`. The Emotion cache is swapped accordingly.

## Theming and RTL

- The MUI theme + RTL config lives in `libs/shared/web-ui/src/theme/`.
- The Emotion cache for RTL is configured in `libs/shared/web-ui/src/providers/rtl-cache.provider.tsx`.
- The root `App` wraps with `<ThemeProvider>` + `<RtlProvider>` based on the active locale.
- **Verify custom `sx` styles** using `marginLeft`/`paddingRight` use logical properties (`marginInlineStart`/`paddingInlineEnd`) instead, so they flip correctly in RTL.

## i18n

- When creating new UI, add both `en.json` and `ar.json` entries in the same pass.
- Arabic has 6 plural forms (zero, one, two, few, many, other). Use ICU message format.
- Translation files: `libs/shared/i18n/src/messages/en.json` and `ar.json`.

## Authorization UI (CASL)

Frontend authorization is enforced using two components from `@yellowladder/shared-web-ui`: `CanAction` and `CanField`. These read the user's CASL ability (synced via `useAbilitySync` hook with periodic polling + focus refetch) and hide/disable UI elements the user lacks permission for.

The 5 user tiers (`SUPER_ADMIN`, `COMPANY_ADMIN`, `SHOP_MANAGER`, `EMPLOYEE`, `CUSTOMER`) determine which actions and fields are available.

### `CanAction` — Action Buttons

Wraps buttons and interactive elements. Hides the child by default if the user lacks permission. Use `mode="disable"` on submit buttons inside forms (where hiding would break layout).

```tsx
import { CanAction } from '@yellowladder/shared-web-ui';

{/* Hide button if user cannot Create MenuItem */}
<CanAction action="Create" subject="MenuItem">
  <Button onClick={handleCreate}>{t('catalog.menuItems.create')}</Button>
</CanAction>

{/* Disable submit button instead of hiding (inside a form) */}
<CanAction action="Update" subject="MenuItem" mode="disable">
  <Button type="submit" variant="contained">
    {t('common.save')}
  </Button>
</CanAction>
```

**Rules:**

- Every action button (Create, Update, Delete, Confirm, Cancel, etc.) in backoffice must be wrapped in `<CanAction>`.
- List page "Create" buttons: `<CanAction action="Create" subject="{Entity}">`.
- List row Edit/Delete buttons: `<CanAction action="Update">`/`<CanAction action="Delete">`.
- Form submit buttons: use `mode="disable"` to keep them visible but greyed out.
- Action and subject names match the backend CASL action/resource names exactly (plain verbs: `Create`, `Read`, `Update`, `Delete`).

### `CanField` — Form Fields

Wraps individual form fields. Disables the field if the user's ability does not permit that field for the given action/subject.

```tsx
import { CanField } from '@yellowladder/shared-web-ui';

<CanField action="Update" subject="MenuItem" field="basePrice">
  <TextField label={t('catalog.menuItems.basePrice')} value={basePrice} onChange={...} />
</CanField>

{/* Dynamic action for edit vs create forms */}
<CanField action={isEdit ? 'Update' : 'Create'} subject="MenuItem" field="nameEn">
  <TextField {...register('nameEn')} label={t('common.name')} fullWidth />
</CanField>
```

**Rules:**

- Every form field in backoffice forms must be wrapped in `<CanField>`.
- `field` prop matches the backend DTO field name (what CASL's `ensureFieldsPermitted` checks).
- For forms that serve both create and edit, use `action={isEdit ? 'Update' : 'Create'}`.

### Import Pattern

```tsx
import { CanAction, CanField } from '@yellowladder/shared-web-ui';
```

## Realtime (Kitchen WebSocket)

The web kitchen view connects to the backend `KitchenGateway` via Socket.io with the JWT access token in the auth handshake:

```typescript
const socket = io('/kitchen', {
  auth: { token: accessToken },
  transports: ['websocket'],
});

socket.on('connect', () => {
  socket.emit('subscribe', { shopId });
});

socket.on('order:new', (order) => { /* ... */ });
socket.on('order:update', (order) => { /* ... */ });
socket.on('snapshot', (orders) => { /* ... */ });  // 15s tick fallback
```

The WebSocket client lives in a hook in `web-ordering` and dispatches updates into a Redux slice in `shared/store`.

## Error Handling

- Wrap route-level components with React Error Boundaries. Each app shell provides a top-level boundary; feature libs can add granular boundaries around critical sections (e.g., POS form, payment flow).
- RTK Query errors: use the `isError` / `error` fields from query hooks. Display user-friendly messages via MUI `Alert` or `Snackbar` — never expose raw API error objects.
- Form submission errors: map backend `errorCode` values (from `BusinessException`) to i18n keys for user-facing messages. Fall back to a generic error message for unknown codes.
- Network errors and 5xx: show a retry-able error state. Use RTK Query's built-in `refetch()` for retry.
- Never use `console.error` for user-visible errors. Log to console only in development.

## Accessibility (a11y)

- Use semantic HTML (`<main>`, `<nav>`, `<section>`, `<article>`) alongside MUI components.
- All images require `alt` text. Decorative images use `alt=""`.
- All form fields must have associated labels (MUI `TextField` includes this by default via `label` prop).
- Interactive elements (buttons, links, icon buttons) must have accessible names. Icon-only buttons use `aria-label`.
- Color contrast must meet WCAG 2.1 AA (4.5:1 for normal text, 3:1 for large text).
- Focus management: dialogs and drawers must trap focus. MUI `Dialog` and `Drawer` handle this automatically.
- RTL: MUI's RTL theme configuration handles layout mirroring. Verify custom `sx` styles use logical properties.

## API Versioning

- The API is versioned at `/api/v1/` from day one. RTK Query base URL is `${apiBaseUrl}/api/v1`.
- When breaking changes are introduced, the backend will introduce `/api/v2/`. RTK Query base URL is a single update.
- `shared/types` interfaces are versioned by creating new interfaces (e.g., `GetMenuItemResponseV2`) rather than modifying existing ones during a migration period.

## Lib Structure

Web libs are coarse — one lib per backend domain. `apps/web-backoffice` imports from these libs and routes to the appropriate components.

Each web lib is organized by **sub-domain folders** matching the backend sub-modules. The same file grouping convention from `architecture.md` applies (2+ files of the same suffix → subdirectory).

```text
libs/web/catalog/src/
  index.ts                                # Barrel re-exports from sub-domain folders
  menu-items/
    components/                           # 3+ components → grouped
      menu-item-list.component.tsx
      menu-item-form.component.tsx
      menu-item-detail.component.tsx
    create-menu-item.schema.ts            # Single schema → flat
    use-menu-item-filters.hook.ts         # Single hook → flat
  categories/
    category-list.component.tsx           # Single component → flat
    create-category.schema.ts             # Single schema → flat
  shop-overrides/
    components/
      shop-override-list.component.tsx
      shop-override-form.component.tsx
    update-shop-override.schema.ts
```

## Lib Boundaries

Web feature libs may import from:

- `libs/shared/api/`
- `libs/shared/store/`
- `libs/shared/web-ui/`
- `libs/shared/types/`
- `libs/shared/utils/`
- `libs/shared/i18n/`

They may **NOT** import from:

- `libs/backend/*`
- `libs/mobile/*`
- `libs/shared/mobile-ui/`

`libs/shared/api/` may **NOT** import from `libs/backend/*` — it mirrors the REST contract through RTK Query.
