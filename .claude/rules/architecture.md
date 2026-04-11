---
description: Architecture decisions — thin apps, sub-modules, two-level multi-tenancy, RBAC, security, migration constraints
alwaysApply: true
---

# Architecture

## Thin Apps

Apps are bootstrapping shells only. They wire together libs and configure framework-level concerns (routing, middleware, module registration). All business logic, UI components, services, schemas, and domain logic live in `libs/`.

**What belongs in apps:** App module registration (NestJS), root route configuration, environment variable loading, framework middleware/plugin setup, Redux store creation (`configureStore`), Paper/MUI provider setup, navigator definitions.

**What does NOT belong in apps:** Business logic, services, controllers, components, hooks, utilities.

## Sub-Module Architecture

Backend libs are **fine-grained sub-modules** grouped by **domain**. Each sub-module is a separate Nx lib with its own NestJS module, controller(s), service(s), repository, and barrel file. Domain folders are **Nx grouping folders** (not libs themselves).

**Rules:**

- No architectural layer directories (`domain/`, `feature/`, `application/`, `infrastructure/`) within a sub-module.
- When a sub-module has 2+ files of the same type, group them in a subdirectory named after the suffix (e.g., `dtos/`, `events/`, `event-handlers/`). A single file of a type stays flat at the root.
- Sub-modules within the same domain **can** import each other directly.
- Cross-domain imports go through barrel files (`index.ts`) only.
- **Cross-domain writes MUST use domain events (`DomainEventPublisher`), never direct service imports.** A common violation: you import a cross-domain service for reads, then add a write call on the same service because "it's already injected." This breaks domain isolation. If you need to write to another domain, emit a domain event and let that domain handle it.

```text
CORRECT (single DTO — flat):                    CORRECT (2+ DTOs — grouped):
  libs/backend/catalog/menu-items/src/            libs/backend/ordering/orders/src/
    menu-items.module.ts                            orders.module.ts
    menu-items.service.ts                           orders.service.ts
    menu-items.controller.ts                        orders.controller.ts
    menu-items.repository.ts                        orders.repository.ts
    create-menu-item.dto.ts                         dtos/
                                                      create-order.dto.ts
WRONG (architectural layers):                         update-order-status.dto.ts
  libs/backend/ordering/orders/src/                   list-orders-query.dto.ts
    domain/                                           get-order.dto.ts
      order.entity.ts                                 get-order-item.dto.ts
    application/
      orders.service.ts
    infrastructure/
      orders.repository.ts
```

**Web and mobile libs** are coarser — one lib per domain. `apps/web-backoffice` and `apps/mobile-backoffice` are the only consumer apps and import from these libs.

## Multi-Tenancy: Two-Level Hierarchy

**Strategy:** Shared database, two-level hierarchy `Company → Shop → data`. PostgreSQL Row-Level Security on `company_id`. RBAC service-layer enforcement on `shop_id`.

**Why two-level:** Restaurant operators ("Companies") run multiple branches ("Shops"). A Company Admin needs full access across all their shops; a Shop Manager only their assigned shops. This is the **key divergence from the legacy Tappd single-level model** and is non-negotiable.

### Tenant Resolution

- **Backoffice web/mobile:** Authenticated users have a `companyId` baked into the JWT. The `TenantContextMiddleware` extracts it and sets the Postgres session variable.
- **API:** All `/api/v1/*` endpoints require authentication. The JWT carries `companyId`, `userId`, `role`, and `shopIds[]`. There are **no public endpoints** in Yellow Ladder (no customer-facing surface today).

### Three Database Roles

| Role         | RLS      | Permissions                                                          | Used by                                                                   |
| ------------ | -------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `app_tenant` | Enforced | Full CRUD (scoped to one company)                                    | All authenticated request handling (default `PrismaService`)              |
| `app_public` | Bypassed | `SELECT` only on a small set of public-readable tables (rarely used) | Reserved for future public read endpoints if Yellow Ladder ever adds them |
| `app_system` | Bypassed | Full CRUD (all tables)                                               | `SUPER_ADMIN` operations only, gated by RBAC in the service layer         |

### Tenant Context Mechanism

1. `TenantContextMiddleware` extracts `companyId` from the JWT.
2. Sets the PostgreSQL session variable: `SET LOCAL app.current_company = '{company_uuid}'` inside a transaction.
3. RLS policies on multi-tenant tables read `current_setting('app.current_company')::uuid` and automatically filter all queries.
4. Even if application code omits a `WHERE` clause, RLS prevents cross-company data leakage.

The **`PrismaService` Proxy** wraps every Prisma model operation in a mini-transaction with `SET LOCAL app.current_company`, sourced from `TenantContextStore` (AsyncLocalStorage). Each request gets its own async context, and `SET LOCAL` is transaction-scoped — no cross-request leakage even with a multi-connection pool.

### Shop Scoping (RBAC, NOT RLS)

- RLS only enforces `company_id`. **Shop scoping (`shop_id`) is a service-layer concern enforced by RBAC.**
- Every shop-scoped query must filter by `shop_id` explicitly: `where: { shopId: { in: user.shopIds } }`.
- `AuthorizationService.scopeWhereToUserShops(user, baseWhere)` is the canonical helper — it adds the `shopId IN [...]` clause for roles that are shop-bounded (`SHOP_MANAGER`, `EMPLOYEE`) and is a no-op for `COMPANY_ADMIN` and `SUPER_ADMIN`.
- `AuthorizationService.assertShopAccess(user, shopId)` is the single-shop equivalent — throws `ForbiddenException` if the shop is not in the user's allowed set.
- A base service class may wrap these helpers to reduce boilerplate, but the helpers themselves are the source of truth.
- `SUPER_ADMIN` and `COMPANY_ADMIN` see all shops within their company. `SHOP_MANAGER` and `EMPLOYEE` see only their assigned shops.

### Multi-Tenant vs Platform-Global Tables

**Multi-tenant (gets `company_id`, plus `shop_id` if shop-scoped):** All entities in Catalog, Ordering, Payment, Operations (shops, discounts, waste, favorites), Integrations (per-company accounting connections).

**Platform-global (NO `company_id`):** `User` (linked to a company via FK, but the user table itself is global), `LogEvent` system-wide entries, `PlatformAccountingConnection`, the 4 config enum tables.

### Database Conventions for Multi-Tenancy

- Every multi-tenant table has a `company_id UUID NOT NULL` column.
- Every shop-scoped table additionally has a `shop_id UUID NOT NULL` column.
- RLS policies are created per multi-tenant table in migration files (raw SQL appended to the Prisma-generated migration).
- Composite indexes include `company_id` (and `shop_id` where applicable) as the leading column.
- `libs/backend/infra/database` provides RLS migration helpers and the three Prisma services.
- Database role grants (`app_tenant`, `app_public`, `app_system`) are managed in migrations.

### ⚠️ Pre-RLS Rollout Blockers

**Two data integrity issues in the legacy Tappd schema must be resolved before RLS can be enabled.** See [`pre-rls-blockers.md`](./pre-rls-blockers.md) for the full migration steps.

1. **`MenuItem.companyId` is nullable** — RLS treats `NULL` as "policy did not match", making orphan rows invisible to all tenants. Audit, backfill (or delete) orphans, then add `NOT NULL` constraint in the same migration as the RLS policy. **BLOCKED on user product decision** for the orphan resolution strategy.
2. **`Category.shop_id` nullable + `ShopCategory` table = redundant mechanisms** — Pick one. Recommendation: keep `ShopCategory`, drop nullable `shop_id` from `Category`. Migrate existing shop-scoped categories to `ShopCategory` rows with `is_new = true`.

Both blockers are non-negotiable. Applying RLS over the current data state will silently break the application.

## Authorization Model (RBAC — Five Fixed Tiers)

The Identity domain's `authorization` sub-module implements **Role-Based Access Control (RBAC)**. Authorization is enforced in the **service layer**, so it works regardless of entry point (HTTP, event handlers, scheduled jobs, internal service calls). A thin decorator + `RolesGuard` is optionally available at the controller layer for early rejection of obviously unauthorized requests, but the service layer is the ultimate authority.

**Five fixed user tiers** (no pluggable role/policy system; the tiers are baked into `RolePermissionRegistry` in code):

| Role            | Scope                                                        | Notes                                                       |
| --------------- | ------------------------------------------------------------ | ----------------------------------------------------------- |
| `SUPER_ADMIN`   | Platform-wide, cross-company                                 | RLS-bypassing via `app_system`. Gated by RBAC.              |
| `COMPANY_ADMIN` | Full access within one company, all shops                    | The default admin for a merchant.                           |
| `SHOP_MANAGER`  | Manages one or more shops within one company                 | `user.shopIds` is the access boundary.                      |
| `EMPLOYEE`      | Operates POS / kitchen within assigned shops                 | Read-most, limited writes. Cannot modify menus or settings. |
| `CUSTOMER`      | Reserved — exists in the data model but has no surface today | Yellow Ladder has no customer-facing app today.             |

**Permissions are strings** in the form `{resource}:{action}` — for example `menu-items:create`, `orders:read`, `shops:update`. They are declared in `libs/shared/types` as an `as const` object (no TypeScript `enum`).

```typescript
// libs/shared/types/src/auth/permissions.constants.ts
export const Permissions = {
  MenuItemsCreate: 'menu-items:create',
  MenuItemsRead: 'menu-items:read',
  MenuItemsUpdate: 'menu-items:update',
  MenuItemsDelete: 'menu-items:delete',
  OrdersRead: 'orders:read',
  OrdersUpdate: 'orders:update',
  // ...
} as const;

export type Permission = (typeof Permissions)[keyof typeof Permissions];
```

**Key services:**

- **`RolePermissionRegistry`** — A code-based `Record<Role, ReadonlySet<Permission>>` that maps each of the 5 fixed roles to the flat set of permissions they hold. The mapping is hard-coded (not data-driven) — there is no `Role` / `Policy` / `PolicyStatement` table system. Adding a new permission means editing the registry.
- **`AuthorizationService`** — Central facade injected by domain services:
  - `requirePermission(user, permission)` — throws `ForbiddenException` if the user's role does not include the permission
  - `hasPermission(user, permission)` — boolean check (no throw) for conditional logic / UI gating
  - `scopeWhereToUserShops(user, baseWhere)` — helper that appends `shopId IN [...]` to a Prisma WHERE clause for shop-bounded roles (`SHOP_MANAGER`, `EMPLOYEE`); no-op for `COMPANY_ADMIN` and `SUPER_ADMIN`
  - `assertShopAccess(user, shopId)` — throws `ForbiddenException` if the shop is not in the user's allowed set
  - `assertCompanyAccess(user, companyId)` — throws if the user is not attached to the target company (only `SUPER_ADMIN` may cross companies)

**Permission naming:** lowercase `{resource}:{action}` strings. Resources use the kebab-case plural of the entity (`menu-items`, `shop-discounts`). Actions are plain verbs (`create`, `read`, `update`, `delete`, `publish`, `view`, `manage`). Use `manage` sparingly — prefer specific verbs.

**Replaces** the legacy `allowedTo.ts` and `allowSelfOrSuperAdmin.ts` middleware.

**Typical service flow:**

```text
Create: requirePermission → assertShopAccess (if shop-scoped) → create
Read:   requirePermission → scopeWhereToUserShops → findMany
Update: requirePermission → scopeWhereToUserShops (fetch) → update
Delete: requirePermission → scopeWhereToUserShops (fetch) → delete
```

**Field-level control** is handled with explicit per-role allowlists in the service (e.g., `if (user.role === Role.EMPLOYEE) delete input.basePrice`). No automatic field filtering — it becomes explicit code that is easy to audit and grep.

**Controller-level decorator (optional).** Controllers may annotate endpoints with `@RequirePermission(Permissions.OrdersRead)`, enforced by a global `RolesGuard`. This is a convenience for early rejection; services MUST still call `AuthorizationService.requirePermission` because the guard is skipped for non-HTTP entry points (event handlers, scheduled jobs).

## Cross-Domain Communication

For the specific domain dependency graph and integration events, see `domain-model.md`.

- **Direct imports** for read operations within the same domain (sub-modules import each other freely)
- **Direct imports via barrel** for cross-domain reads (e.g., Ordering reads Catalog menu data)
- **NestJS EventEmitter** via `DomainEventPublisher` wrapper for cross-domain write operations (in-process domain events)
- Design the event publishing interface so that migrating to a message broker (BullMQ + Memorystore) later is a transport swap, not a rewrite. **Defer this migration** until a second async use case appears (bulk FCM, retry/backoff, ≥3 concurrent jobs).

## Realtime (Kitchen WebSocket Gateway)

The Kitchen view is a real-time stream of orders for a given shop's kitchen staff. It uses a NestJS WebSocket Gateway:

- Module: `libs/backend/ordering/kitchen` (sub-module of Ordering, NOT a top-level domain).
- Gateway class: `KitchenGateway` using `@nestjs/websockets` + `@nestjs/platform-socket.io`.
- Authentication: `WsJwtGuard` validates the JWT on socket handshake.
- Rooms: `kitchen:shop:{shopId}` — each kitchen device joins its shop's room.
- Snapshot tick: every 15 seconds, the gateway broadcasts a snapshot of active orders to all clients in the shop's room (preserved from legacy).
- `UserShopKitchenSettings` (per-user-per-shop kitchen preferences) lives in this lib.

## Catalog Inheritance (Tiered Menu)

Yellow Ladder uses a **tiered catalog model** preserved from legacy:

- **Company-level entities:** `Category`, `MenuItem`, `MenuAddon`, `MenuAddonOption` — defined once per company, available to all shops.
- **Shop-level overrides:** `ShopCategory`, `ShopMenuItem`, `ShopMenuAddon`, `ShopMenuAddonOption` — per-shop overrides on top of the company-wide definitions (e.g., this shop's price for this item, this shop's availability flag).

Shop-level entities reference company-level via foreign key. The Catalog service resolves the effective view by merging the two tiers at read time.

**`ItemPurchaseCount`** is a denormalized analytics projection over menu items, owned by the **Catalog** domain (not Operations or Ordering). The write path (increment on order completion) goes through a domain event from Ordering → Catalog, never a direct import.

## Accounting (Xero) — Dual-Mode

Yellow Ladder integrates with Xero in **two modes simultaneously**:

- **Per-company connection (default):** Each merchant connects their own Xero account. Orders sync to their own Xero ledger.
- **Platform-level fallback:** For merchants without their own Xero account, orders sync to a single platform-wide Xero account using a per-company tracking category for isolation.

**Precedence:** Company-level always wins if present.

**Single resolver:** The `AccountingConnectionResolver` service is the only place that decides which mode to use. The sync pipeline is mode-agnostic — one provider interface, one sync job, one `OrderSyncLog` table, one admin UI.

**Platform-level isolation is security-critical:**

- Mandatory tracking category per invoice line (used to attribute revenue back to the correct company in the platform Xero account)
- Audit logging on every sync
- Per-company feature flag to disable platform-level fallback if needed

The daily sync runs as a Cloud Run Job triggered by Cloud Scheduler at `23:59`.

## Scheduled Work

- **Cloud Run Jobs triggered by Cloud Scheduler.** No in-process schedulers.
- Daily Xero sync at `23:59`.
- DB migrations run as a Cloud Run Job (existing pattern from legacy).
- `libs/backend/infra/queue/` is a placeholder for future BullMQ. Do NOT introduce BullMQ until a second async use case justifies it.

## Mobile Realtime (POS / Kitchen)

- Mobile clients use the same `KitchenGateway` over Socket.io.
- Online-only — no offline buffering, no SQLite, no sync conflict resolution. If the connection drops, the client reconnects and re-fetches state.

## Security Constraints

- **Never store tokens in `localStorage`.** Web apps store the access token in memory (JavaScript variable) and the refresh token in an HttpOnly cookie. Mobile apps store the refresh token in `react-native-keychain`.
- **No CSRF protection needed** for Bearer-token endpoints. The only exception is the `/auth/refresh` endpoint (uses HttpOnly cookie) — protect this single endpoint with a CSRF token or origin check.
- **Rate limiting** on authentication endpoints (login, OTP, password reset) and order endpoints. Use `@nestjs/throttler`.
- **Input validation** via class-validator on every backend endpoint. Zod on every web/mobile form. **Never trust client input.**
- **SQL injection mitigated by Prisma's parameterized queries.** Never use `$queryRawUnsafe` with user input.
- **Passwords hashed with bcrypt** (cost factor 12+).
- **Stripe webhook signatures verified** before processing. Never trust unsigned webhook payloads.
- **Do not commit secrets, API keys, or credentials.** `.env` contains shared defaults only — never add real secrets to it. `.env*.local` and `.env` are gitignored.
- **`SystemPrismaService` (when introduced) must only be injected** in services where `AuthorizationService.requirePermission()` first verifies the user has a `SUPER_ADMIN`-gated permission. Never expose it to non-`SUPER_ADMIN` endpoints.
- **Audit trail:** all backoffice write operations are logged via the `@AuditLog()` decorator with user, company, action, resource, timestamp, and (where applicable) before/after diffs.
- **API endpoints must not expose Prisma's query language to clients.** No generic `where`, `select`, or `include` parameters. Filter/sort/search capabilities are explicitly declared in per-entity typed query DTOs with allowlisted fields.
- **OTP rate limits:** 5min TTL per code, max 5 verification attempts per code, max 3 codes per email per 15-minute window.
- **Hardcoded testing OTP `886644` MUST be removed** before any non-dev shipping. Security hard-stop — non-negotiable.
- **All security tokens stored hashed:** `PasswordResetToken` (1hr TTL, single-use), `EmailVerificationToken` (24hr TTL, latest-only), OTP records (5min TTL).
- **No social login.** JWT + OTP only.

## Migration Constraints (from Legacy Tappd)

The following constraints apply specifically because Yellow Ladder is a refactor of an existing application, not a greenfield build:

1. **Preserve business logic.** Translate frameworks (Express → NestJS, TypeORM → Prisma, raw Socket.io → NestJS Gateways), but service-method bodies transfer mostly verbatim. Behavior changes need explicit user sign-off.
2. **Preserve table structure.** The 33 entities migrate verbatim — same table names, same column names (`snake_case` at the DB level via `@@map`/`@map`), same relations. Only the framework changes.
3. **Two-level tenancy is non-negotiable.** Even if the legacy entity didn't have `company_id` and `shop_id`, the migrated Prisma model gets them. This is the required uplift.
4. **Defer what you don't need.** No BullMQ, no Redis, no tests, no public apps, no offline POS, no hot-updater, no social login. Lean refactor; add complexity only when business demands it.
5. **Keep `Company`, not `Tenant`.** Naming stays aligned with the restaurant POS domain.
6. **Remove the hardcoded OTP `886644`** before any non-dev shipping.
7. **Version the API at `/api/v1/`** from day one of the refactor.
8. **Fastlane-only mobile releases.** Drop `@hot-updater/react-native`.
9. **Cloud Run Jobs for scheduled work**, matching the existing migration pattern.
