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

> **⚠️ SCOPE: `apps/web-backoffice` is PARKED.** It exists as an empty placeholder in the monorepo for future work, but **no feature implementation should target the web app right now**. All active feature work targets `apps/mobile-backoffice`. This rule file remains in the repo so the web conventions are documented for when web is unparked — do NOT start building on it without explicit user approval. See `project.md` §Active Frontend Scope.

## File Naming

All files use `kebab-case.{suffix}.ts(x)`:

| File Type           | Suffix           | Example                        |
| ------------------- | ---------------- | ------------------------------ |
| Component           | `.component.tsx` | `menu-item-list.component.tsx` |
| Hook                | `.hook.ts`       | `use-cart.hook.ts`             |
| Zod schema          | `.schema.ts`     | `create-menu-item.schema.ts`   |
| RTK Query API slice | `.api.ts`        | `catalog.api.ts`               |
| Redux slice         | `.slice.ts`      | `cart.slice.ts`                |
| Route               | `.route.tsx`     | `menu-items-list.route.tsx`    |
| Provider            | `.provider.tsx`  | `theme.provider.tsx`           |
| Theme               | `.theme.ts`      | `mui.theme.ts`                 |
| Utility             | `.util.ts`       | `format-currency.util.ts`      |
| Types               | `.types.ts`      | `cart.types.ts`                |
| Constants           | `.constants.ts`  | `order-status.constants.ts`    |

## UI Components (MUI 7)

- Feature libs import standard components directly from `@mui/material`. **No wrapper layer.**
- `shared/web-ui` provides: MUI theme configuration (palette, typography, breakpoints — **LTR only, no RTL cache**), `ThemeProvider` setup, and custom composite components that don't exist in MUI (e.g., `OrderCard`, `MenuItemCard`).
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

- **Locale-prefixed:** every route is `/(en|de|fr)/{path}`. Example: `/en/menu-items`, `/de/orders/123`, `/fr/orders/123`.
- **Route table** lives in `apps/web-backoffice/src/routes/`.
- **Lazy load** feature libs at the route boundary (`React.lazy` + `Suspense`).
- **Auth guard** at the route level — unauthenticated users redirect to `/(en|de|fr)/login`.
- **Locale switching:** the locale segment in the URL drives the active `react-i18next` language. No `dir` attribute manipulation — the app is LTR only.

## Theming (LTR only)

- The MUI theme lives in `libs/shared/web-ui/src/theme/`.
- The root `App` wraps with `<ThemeProvider>` once — no RTL provider, no Emotion RTL cache.
- **Yellow Ladder does NOT support RTL.** Do not install `stylis-plugin-rtl`, do not set `dir="rtl"`, do not create an `RtlProvider`. If a future locale needs RTL, that is a major project change and requires explicit architect sign-off.
- You MAY still use CSS logical properties (`marginInlineStart`/`paddingInlineEnd`) for good hygiene, but they are not required — `marginLeft`/`paddingRight` are fine under LTR-only.

## i18n

- When creating new UI, add `en.json`, `de.json`, and `fr.json` entries **in the same commit**. The `audit-translations` skill validates that every key exists in all three catalogs.
- Plural rules for `en`, `de`, `fr` are the simple `{one, other}` ICU pattern. ICU message format is still used for interpolation, gender, and nested plurals.
- Translation files: `libs/shared/i18n/src/messages/en.json`, `de.json`, `fr.json`.

## Authorization UI (RBAC)

Frontend authorization mirrors the backend RBAC model. The user's `role` and flattened `permissions: Permission[]` list come from the authenticated-user RTK Query endpoint (`/api/v1/auth/me`) and are stored in a Redux auth slice in `@yellowladder/shared-store`. A single component — `HasPermission` — and its imperative counterpart hook — `useHasPermission` — from `@yellowladder/shared-web-ui` gate UI elements.

The 5 user tiers (`SUPER_ADMIN`, `COMPANY_ADMIN`, `SHOP_MANAGER`, `EMPLOYEE`, `CUSTOMER`) determine which permissions the user holds. The permission strings are imported from `@yellowladder/shared-types` (the same `Permissions` const object the backend uses).

### `HasPermission` — Gating Any Element

Wraps any child element. Hides by default if the user lacks the permission; switch to `mode="disable"` to keep the element visible but inert (useful for submit buttons inside forms where hiding would break layout).

```tsx
import { HasPermission } from '@yellowladder/shared-web-ui';
import { Permissions } from '@yellowladder/shared-types';

{
  /* Hide button if user cannot create menu items */
}
<HasPermission permission={Permissions.MenuItemsCreate}>
  <Button onClick={handleCreate}>{t('catalog.menuItems.create')}</Button>
</HasPermission>;

{
  /* Disable submit button instead of hiding (inside a form) */
}
<HasPermission permission={Permissions.MenuItemsUpdate} mode="disable">
  <Button type="submit" variant="contained">
    {t('common.save')}
  </Button>
</HasPermission>;

{
  /* Multiple permissions (user must hold ALL) */
}
<HasPermission permissions={[Permissions.OrdersRead, Permissions.OrdersUpdate]} requireAll>
  <OrderStatusMenu />
</HasPermission>;
```

**Rules:**

- Every action button (Create, Update, Delete, Confirm, Cancel, etc.) in backoffice must be wrapped in `<HasPermission>`.
- List page "Create" buttons: `<HasPermission permission={Permissions.{Entity}Create}>`.
- List row Edit/Delete buttons: `<HasPermission permission={Permissions.{Entity}Update}>` / `<HasPermission permission={Permissions.{Entity}Delete}>`.
- Form submit buttons: use `mode="disable"` to keep them visible but greyed out.
- Permission strings come from the shared `Permissions` const — never hardcode `'menu-items:create'`.
- **Client gating is UX only.** It hides buttons the user cannot use; it never grants access. The backend always re-checks the same permission via `AuthorizationService.requirePermission()`.

### Field-Level Gating

There is no automatic field-level helper. For the rare cases where a field must be disabled per role (e.g., `EMPLOYEE` cannot edit `basePrice`), gate it explicitly:

```tsx
import { useHasPermission } from '@yellowladder/shared-web-ui';
import { Permissions } from '@yellowladder/shared-types';

const canEditPrice = useHasPermission(Permissions.MenuItemsUpdatePrice);

<TextField
  label={t('catalog.menuItems.basePrice')}
  disabled={!canEditPrice}
  {...register('basePrice')}
/>;
```

For forms that serve both create and edit, compute the permission once at the top of the component:

```tsx
const requiredPermission = isEdit ? Permissions.MenuItemsUpdate : Permissions.MenuItemsCreate;
const canSubmit = useHasPermission(requiredPermission);
```

### Import Pattern

```tsx
import { HasPermission, useHasPermission } from '@yellowladder/shared-web-ui';
import { Permissions } from '@yellowladder/shared-types';
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

socket.on('order:new', (order) => {
  /* ... */
});
socket.on('order:update', (order) => {
  /* ... */
});
socket.on('snapshot', (orders) => {
  /* ... */
}); // 15s tick fallback
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
- Yellow Ladder is **LTR only** (supports `en`, `de`, `fr`). Do not add RTL configuration, `dir="rtl"`, or `stylis-plugin-rtl`.

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
