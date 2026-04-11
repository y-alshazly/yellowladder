---
description: Domain model — 6 domains, 33 preserved entities, intra/cross-domain dependencies, domain events, invariants
alwaysApply: true
---

# Domain Model

For the architectural patterns governing these dependencies (direct imports vs. domain events), see `architecture.md`.

## Domains (6) and Sub-Modules

### Domain 1: Identity

| Sub-module     | Lib                               | Key Entities                                                                                                           |
| -------------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Authentication | `backend-identity-authentication` | OTP records, password reset tokens, refresh token records                                                              |
| Users          | `backend-identity-users`          | `User`, `UserDeviceInfo`                                                                                               |
| Companies      | `backend-identity-companies`      | `Company` + 4 config enum tables (`BusinessType`, `PaymentMethod`, `CompanyInfo*` × 2) as sibling files in same module |
| Authorization  | `backend-identity-authorization`  | `RolePermissionRegistry`, `AuthorizationService`, `RolesGuard`, `@RequirePermission()` (5 fixed roles in code)         |
| Audit          | `backend-identity-audit`          | `LogEvent`, `AuditService`, `@AuditLog` decorator                                                                      |

The 4 config enum tables (business types, payment methods, and 2 company-info lookups — exact names of the company-info tables TBD with the user) each get their own `*.controller.ts` / `*.service.ts` / `*.repository.ts` files inside `backend-identity-companies`. They share the sub-module's NestJS module but expose distinct URL surfaces (e.g., `/api/v1/business-types`, `/api/v1/payment-methods`). The legacy filename typo `compant-info-*` is renamed to `company-info-*` during the refactor.

### Domain 2: Catalog (Tiered: Company-level + Shop Overrides)

| Sub-module           | Lib                                    | Key Entities                                                                      |
| -------------------- | -------------------------------------- | --------------------------------------------------------------------------------- |
| Categories           | `backend-catalog-categories`           | `Category` + `ShopCategory` overrides (sibling files in the same sub-module)      |
| Menu Items           | `backend-catalog-menu-items`           | `MenuItem` + `ShopMenuItem` overrides (sibling files in the same sub-module)      |
| Menu Addons          | `backend-catalog-menu-addons`          | `MenuAddon`, `MenuAddonOption` + `ShopMenuAddon`, `ShopMenuAddonOption` overrides |
| Shops                | `backend-catalog-shops`                | `Shop` + `user_shops` M2M assignment join                                         |
| Item Purchase Counts | `backend-catalog-item-purchase-counts` | `ItemPurchaseCount`, `UserShopItemOrder` (denormalized analytics)                 |

**Why Shop is in Catalog, not Operations:** Shop is a passively configured location (name, address, hours, etc.) — a noun, not a runtime verb. All four override tables already live in `backend-catalog-*`; putting the parent `Shop` in a different domain would create a Catalog → Operations dependency for the most fundamental relationship in the system. Operations is reserved for runtime concerns (verbs).

**Override service convention:** Override entities get their own `*.service.ts`, `*.controller.ts`, and `*.repository.ts` as **sibling files** alongside the parent entity. Example layout for `backend-catalog-menu-items`:

```text
libs/backend/catalog/menu-items/src/
  menu-items.module.ts                  # Single module — owns both classes
  menu-items.controller.ts              # /api/v1/menu-items (company-level CRUD)
  menu-items.service.ts
  menu-items.repository.ts
  shop-menu-items.controller.ts         # /api/v1/shops/:shopId/menu-items (override CRUD)
  shop-menu-items.service.ts
  shop-menu-items.repository.ts
  dtos/                                 # 2+ DTOs → grouped (mix of both)
    create-menu-item.dto.ts
    update-menu-item.dto.ts
    create-shop-menu-item.dto.ts
    update-shop-menu-item.dto.ts
```

The same pattern applies to `categories` (with `shop-categories.*`), and `menu-addons` (with `shop-menu-addons.*` and `shop-menu-addon-options.*`).

### Domain 3: Ordering

| Sub-module | Lib                        | Key Entities                                                                                        |
| ---------- | -------------------------- | --------------------------------------------------------------------------------------------------- |
| Carts      | `backend-ordering-carts`   | `Cart`, `CartItem`, `CartItemOption`                                                                |
| Orders     | `backend-ordering-orders`  | `Order` (lifecycle, status transitions, payment linkage)                                            |
| Kitchen    | `backend-ordering-kitchen` | `KitchenGateway` (WebSocket), `UserShopKitchenSettings`, snapshot tick — real-time view over orders |

### Domain 4: Payment

| Sub-module      | Lib                               | Key Entities                                                 |
| --------------- | --------------------------------- | ------------------------------------------------------------ |
| Stripe Accounts | `backend-payment-stripe-accounts` | `CompanyPaymentProviderAccount` (Stripe Connect)             |
| Terminal        | `backend-payment-terminal`        | Stripe Terminal device registration (Tap-to-Pay)             |
| Webhooks        | `backend-payment-webhooks`        | Stripe webhook handler (signature verification, idempotency) |

### Domain 5: Operations (Runtime Concerns Only)

| Sub-module | Lib                            | Key Entities                           |
| ---------- | ------------------------------ | -------------------------------------- |
| Discounts  | `backend-operations-discounts` | `ShopDiscount`, `ShopDiscountMenuItem` |
| Waste      | `backend-operations-waste`     | `Waste`                                |

**Note:** `Shop` was originally listed under Operations during scoping but moved to `backend-catalog-shops` because it is a passive configured location, not a runtime concern. `UserShopItemOrder` (originally a separate `user-shop-favorites` sub-module) is consolidated into `backend-catalog-item-purchase-counts` since both are denormalized analytics projections over menu items.

### Domain 6: Integrations

| Sub-module    | Lib                                  | Key Entities                                                                  |
| ------------- | ------------------------------------ | ----------------------------------------------------------------------------- |
| Accounting    | `backend-integrations-accounting`    | `CompanyAccountingConnection`, `PlatformAccountingConnection`, `OrderSyncLog` |
| Notifications | `backend-integrations-notifications` | (FCM dispatch records — service only)                                         |
| Email         | `backend-integrations-email`         | (Email dispatch records — service only)                                       |

## The 33 Preserved Entities

These migrate verbatim from the legacy Tappd TypeORM schema to Prisma. Same table names, same column names (`snake_case` at the DB level via `@@map`/`@map`), same relations.

| #   | Entity                        | Domain       | Notes                                                                                           |
| --- | ----------------------------- | ------------ | ----------------------------------------------------------------------------------------------- |
| 1   | Company                       | Identity     | Tenant root. Owns the `company_id` tenancy boundary. **Kept as `Company`, not `Tenant`.**       |
| 2   | Shop                          | **Catalog**  | Branch under a Company. **Lives in `backend-catalog-shops`**, not Operations.                   |
| 3   | User                          | Identity     | Belongs to a Company.                                                                           |
| 4   | UserDeviceInfo                | Identity     | Push token storage, device metadata.                                                            |
| 5   | Category                      | Catalog      | Company-level menu category.                                                                    |
| 6   | MenuItem                      | Catalog      | Company-level menu item.                                                                        |
| 7   | MenuAddon                     | Catalog      | Company-level addon group.                                                                      |
| 8   | MenuAddonOption               | Catalog      | Company-level addon option (sibling file inside `backend-catalog-menu-addons`).                 |
| 9   | ShopCategory                  | Catalog      | Per-shop override of `Category` (sibling file inside `backend-catalog-categories`).             |
| 10  | ShopMenuItem                  | Catalog      | Per-shop override of `MenuItem` (sibling file inside `backend-catalog-menu-items`).             |
| 11  | ShopMenuAddon                 | Catalog      | Per-shop override of `MenuAddon` (sibling file inside `backend-catalog-menu-addons`).           |
| 12  | ShopMenuAddonOption           | Catalog      | Per-shop override of `MenuAddonOption` (sibling file inside `backend-catalog-menu-addons`).     |
| 13  | Cart                          | Ordering     | Cart aggregate.                                                                                 |
| 14  | CartItem                      | Ordering     | Line item.                                                                                      |
| 15  | CartItemOption                | Ordering     | Selected addon option per cart line.                                                            |
| 16  | Order                         | Ordering     | Order aggregate.                                                                                |
| 17  | ShopDiscount                  | Operations   | Per-shop discount definition.                                                                   |
| 18  | ShopDiscountMenuItem          | Operations   | Discount applicability to specific menu items.                                                  |
| 19  | CompanyPaymentProviderAccount | Payment      | Stripe Connect account per company.                                                             |
| 20  | CompanyAccountingConnection   | Integrations | Per-company Xero connection.                                                                    |
| 21  | PlatformAccountingConnection  | Integrations | Platform-wide Xero connection (fallback).                                                       |
| 22  | OrderSyncLog                  | Integrations | Audit trail for accounting sync runs.                                                           |
| 23  | Waste                         | Operations   | Shop-floor waste tracking.                                                                      |
| 24  | ItemPurchaseCount             | Catalog      | Denormalized analytics — increment via domain event.                                            |
| 25  | UserShopItemOrder             | Catalog      | Per-user-per-shop ordering history projection. Lives in `backend-catalog-item-purchase-counts`. |
| 26  | UserShopKitchenSettings       | Ordering     | Per-user-per-shop kitchen view preferences.                                                     |
| 27  | LogEvent                      | Identity     | Audit log entries.                                                                              |
| 28  | BusinessType                  | Identity     | Config enum table. Sibling file inside `backend-identity-companies`.                            |
| 29  | PaymentMethod                 | Identity     | Config enum table. Sibling file inside `backend-identity-companies`.                            |
| 30  | (`company-info-*` enum 1)     | Identity     | Config enum table. Exact name TBD with user. Sibling inside `backend-identity-companies`.       |
| 31  | (`company-info-*` enum 2)     | Identity     | Config enum table. Exact name TBD with user. Sibling inside `backend-identity-companies`.       |

Note: The 4 config enum tables count as 4 of the 33 entities. The remaining 2 entities from the legacy 33 need confirmation with the user — possible candidates include additional Company-related metadata or a `user_shops` join (which lives inside `backend-catalog-shops`). Confirm with the `architect` agent during migration.

**Entity field definitions** live in the Prisma schema files at `libs/backend/infra/database/src/prisma/schema/` (one `.prisma` file per domain). The `database-engineer` agent owns these files.

## Domain Re-Homing Decisions

These are intentional placements that may not be obvious from entity names:

- **Shop** is in **Catalog** (`backend-catalog-shops`), NOT Operations. Shop is a passive configured location (name, address, hours) — a noun. All four override tables (ShopCategory, ShopMenuItem, ShopMenuAddon, ShopMenuAddonOption) already live in `backend-catalog-*`; putting the parent Shop in a different domain would create a Catalog → Operations dependency for the most fundamental relationship in the system. Operations is reserved for runtime concerns.
- **Shop overrides do NOT have their own sub-module.** Each override entity lives inside the sub-module of the entity it overrides, as **sibling files** alongside the parent (e.g., `ShopMenuItem` sits beside `MenuItem` inside `backend-catalog-menu-items`). Override services are separate classes (`shop-menu-items.service.ts` next to `menu-items.service.ts`).
- **Kitchen** is in **Ordering** as the `kitchen/` sub-module — it is a real-time view over orders, not a standalone bounded context. `UserShopKitchenSettings` lives here.
- **Waste** stays in **Operations** — shop-floor activity, not a customer transaction.
- **`ItemPurchaseCount`** moves to **Catalog** — it is a denormalized analytics projection over menu items, consumed by catalog UI and recommendations. The write path (increment on order completion) goes through a domain event, **never** a direct import.
- **`UserShopItemOrder`** is in **Catalog** (`backend-catalog-item-purchase-counts`) alongside `ItemPurchaseCount` (per-user-per-shop variant of the same projection). The original `user-shop-favorites` operations sub-module is eliminated.
- **`ShopDiscountMenuItem`** stays with `ShopDiscount` in **Operations** — discounts are a runtime operations-level concern, not catalog metadata.
- **The 4 config enum tables** live inside `backend-identity-companies` as sibling files (separate `*.controller.ts` / `*.service.ts` / `*.repository.ts` per lookup, sharing one `*.module.ts`). They are NOT in their own sub-module.
- **Accounting** is in **Integrations** (not Finance — there is no Finance domain in Yellow Ladder) and is owned by the `accountant` engineer agent.

## Catalog Inheritance Pattern

Yellow Ladder uses a **tiered catalog model** preserved from legacy:

- **Company-level entities** define the menu once per company: `Category`, `MenuItem`, `MenuAddon`, `MenuAddonOption`.
- **Shop-level overrides** customize per shop: `ShopCategory`, `ShopMenuItem`, `ShopMenuAddon`, `ShopMenuAddonOption`.

A `ShopMenuItem` references a `MenuItem` by FK and overrides specific fields (price, availability, name override, etc.) for one specific shop. The Catalog service merges the two tiers at read time to produce the effective menu for a shop.

**Read pattern:**

```text
GET /api/v1/shops/:shopId/menu
  → Catalog service:
      1. Load company-level Category, MenuItem, MenuAddon, MenuAddonOption (filtered by company_id via RLS)
      2. Load shop-level overrides for shopId (filtered by company_id via RLS, shopId in service layer)
      3. Merge: shop overrides take precedence per field
      4. Return effective menu
```

## Intra-Domain Dependencies

```text
Identity:    authentication -> users, authorization -> users, authorization -> companies, audit -> users, audit -> companies

Catalog:     menu-items -> categories
             menu-items -> shops              (ShopMenuItem references both MenuItem and Shop)
             menu-addons -> menu-items
             menu-addons -> shops             (ShopMenuAddon references both MenuAddon and Shop)
             categories -> shops              (ShopCategory references both Category and Shop)
             item-purchase-counts -> menu-items (read-only)
             item-purchase-counts -> shops    (UserShopItemOrder references Shop)

Ordering:    carts -> (no intra-deps, reads from Catalog cross-domain)
             orders -> carts
             kitchen -> orders                (read-only, real-time view)

Payment:     webhooks -> stripe-accounts, terminal -> stripe-accounts

Operations:  discounts -> (reads Shop from Catalog cross-domain), waste -> (reads Shop from Catalog cross-domain)

Integrations: (sub-modules are independent — accounting reads from Ordering cross-domain, notifications/email are transports)
```

## Cross-Domain Dependencies (Direct Reads)

```text
Ordering ──> Catalog          (carts validate menu items + shops, orders snapshot menu data at order time)
Operations ──> Catalog        (discounts and waste reference Shop, which lives in Catalog)
Payment ──> Ordering          (webhooks correlate with orders by external payment ID)
Operations.discounts ──> Catalog (discount applicability checks against menu items)
Integrations.accounting ──> Ordering (sync job reads completed orders for the day)
Integrations.accounting ──> Payment  (sync job reads payment data for journal entries)
Integrations.notifications ──> Identity (reads user device info for push delivery)
Integrations.email ──> Identity (reads user contact info for email delivery)
```

All other cross-domain interaction uses `DomainEventPublisher`, **not direct imports**.

## Critical Integration Events

The following events flow through `DomainEventPublisher`. Cross-domain WRITES are forbidden as direct imports — they must use these events.

```text
# Order lifecycle
Ordering.OrderConfirmed ──> Catalog.IncrementItemPurchaseCount  (per item in the order)
Ordering.OrderConfirmed ──> Integrations.SendOrderConfirmationEmail
Ordering.OrderConfirmed ──> Integrations.SendOrderPushNotification

Ordering.OrderCancelled ──> Catalog.DecrementItemPurchaseCount  (per item in the order, if previously incremented)
Ordering.OrderCancelled ──> Payment.InitiateRefund  (if payment was captured)
Ordering.OrderCancelled ──> Integrations.SendOrderCancelledEmail

# Payment flow
Payment.PaymentCompleted ──> Ordering.ConfirmOrder
Payment.PaymentFailed ──> Ordering.MarkOrderPaymentFailed
Payment.RefundCompleted ──> Ordering.MarkOrderRefunded

# Kitchen real-time
Ordering.OrderConfirmed ──> Ordering.KitchenGateway.broadcastNewOrder  (within Ordering — emits to kitchen:shop:{shopId} room)
Ordering.OrderStatusChanged ──> Ordering.KitchenGateway.broadcastOrderUpdate

# Identity
Identity.UserRegistered ──> Identity.SendEmailVerification
Identity.PasswordResetRequested ──> Integrations.SendPasswordResetEmail
Identity.OtpRequested ──> Integrations.SendOtpEmail

# Company lifecycle
Identity.CompanyCreated ──> Identity.CreateDefaultUser  (the COMPANY_ADMIN)
Identity.CompanyCreated ──> Integrations.CreateDefaultPlatformAccountingConnection  (if no per-company connection)

# Operations
Operations.WasteRecorded ──> Catalog.AdjustItemPurchaseCount  (optional — only if waste affects analytics; confirm with architect)

# Accounting (scheduled, not event-driven)
Cloud Scheduler 23:59 ──> Cloud Run Job ──> Integrations.RunDailyXeroSync
```

The Xero sync is intentionally a scheduled batch job, not event-driven, to avoid Stripe webhook timing dependencies and to allow correction windows during the day.

## Critical Invariants

### Ordering (Carts)

- A cart belongs to one company and one shop. It cannot mix shops.
- Cart items reference menu items via the **effective** menu view (company + shop overrides). If a menu item becomes unavailable at the shop level, existing cart items are flagged but not auto-removed.
- Cart total must equal the sum of cart items after discount application.

### Ordering (Orders)

- Orders are created from carts. Once an order is created, the cart is cleared.
- Order line items snapshot the menu item name and price at order creation time. Subsequent menu changes do not affect existing orders.
- Order status transitions: `Pending` → `Confirmed` → `Preparing` → `Ready` → `Completed`. Cancellation is allowed from `Pending`, `Confirmed`, or `Preparing` (not from `Ready` or `Completed`).
- Order total = sum of line item totals + tax + tip - discounts.

### Ordering (Kitchen)

- The kitchen view shows orders for one shop, filtered by status (typically `Confirmed` and `Preparing`).
- The 15-second snapshot tick is a fallback — primary updates come from per-event WebSocket emits.
- Each kitchen device subscribes to `kitchen:shop:{shopId}` after JWT validation by `WsJwtGuard`.

### Catalog (Inheritance)

- A `ShopMenuItem` cannot exist without a parent `MenuItem`. Cascade delete on the company-level entity removes all shop overrides.
- Shop overrides do not duplicate company-level data — they only store the fields that differ. The Catalog service merges at read time.
- A menu item that is unavailable at the company level (via `MenuItem.isActive = false`) is unavailable at all shops, regardless of shop-level overrides.

### Catalog (ItemPurchaseCount)

- `ItemPurchaseCount` is incremented via the `Ordering.OrderConfirmed` domain event handler. It is **never** updated by direct calls from Ordering services.
- The handler is idempotent — replaying the event must not double-count.

### Identity (Authentication)

- Password reset tokens are single-use with 1-hour TTL. Only the most recent token per user is valid.
- Email verification tokens expire after 24 hours.
- OTP codes expire after 5 minutes. Max 5 verification attempts per code. Max 3 code requests per email per 15-minute window.
- Passwords are bcrypt-hashed (cost factor 12+). Single-use tokens and OTP codes are SHA-256 hashed before storage. Raw values are never persisted.
- **The hardcoded testing OTP `886644` MUST be removed before any non-dev shipping.** Security hard-stop.

### Identity (Companies)

- A Company cannot be deleted, only deactivated. Deactivating prevents new orders but does not affect historical data.
- Every Company has at least one `COMPANY_ADMIN` user. Demoting the last admin is rejected.

### Identity (Authorization)

- The 5 user tiers (`SUPER_ADMIN`, `COMPANY_ADMIN`, `SHOP_MANAGER`, `EMPLOYEE`, `CUSTOMER`) are **hard-coded in `RolePermissionRegistry`**. There is no `Role` / `Policy` table system. Adding a new permission means editing the registry.
- A `SHOP_MANAGER` can only operate within `user.shopIds`. Queries are scoped via `AuthorizationService.scopeWhereToUserShops(user, where)`, which appends `shopId IN [...]` to the WHERE clause. Single-shop writes use `AuthorizationService.assertShopAccess(user, shopId)`.
- A `SUPER_ADMIN` operates outside the RLS-enforced `app_tenant` role and must use `SystemPrismaService` (when introduced), gated by `AuthorizationService.requirePermission(user, <super-admin-gated permission>)`.

### Payment (Stripe)

- Stripe webhook signatures must be verified before processing. Use the Stripe SDK's `constructEvent` with the webhook signing secret.
- Webhook processing must be idempotent (same webhook delivered twice produces the same result). Use the Stripe `event.id` as the idempotency key.
- A failed payment does not automatically cancel the order — it transitions the order to `PaymentFailed` status and emits a domain event for downstream handling.

### Payment (Stripe Terminal Tap-to-Pay)

- Each shop registers its Stripe Terminal device(s) under the company's Stripe Connect account.
- Terminal sessions use Stripe's connection token endpoint. The backend mints connection tokens; the mobile client uses them to register the reader.

### Integrations (Accounting — Xero Dual-Mode)

- The `AccountingConnectionResolver` is the single source of truth for which mode to use for a given company. **Per-company connection always wins** if present.
- The daily sync job processes one company at a time. Failures on one company do not halt the run for other companies — failures are logged in `OrderSyncLog` and retried on the next run.
- Platform-level fallback REQUIRES a tracking category per invoice line. Without it, the platform Xero account would lose per-company attribution.
- The platform-level fallback can be disabled per company via a feature flag.
- **`OrderSyncLog`** is the audit trail. Every sync run produces records: company, mode (per-company / platform), sync timestamp, status (success/failed), error details if applicable.

### Operations (Waste)

- Waste records are append-only. Once recorded, they cannot be edited or deleted (only voided via a follow-up record).
- Waste does not automatically affect inventory counts (Yellow Ladder doesn't have inventory tracking — waste is informational only).

### Operations (Discounts)

- A `ShopDiscount` belongs to one shop. It cannot be applied at other shops within the same company.
- A discount is either applicable to the entire order (no `ShopDiscountMenuItem` rows) or scoped to specific menu items (one or more `ShopDiscountMenuItem` rows).
- Discount validity is time-bounded (`validFrom`, `validUntil`). Expired discounts are rejected at cart-add time.
