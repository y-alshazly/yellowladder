---
description: Workspace directory structure, lib counts, naming conventions, Nx tags, module boundaries, dependency rules
alwaysApply: true
---

# Workspace Structure

```text
yellowladder/
  apps/
    core-service/                     # NestJS API — modular monolith, serves all clients
    web-backoffice/                   # React SPA (Vite + MUI) — merchant admin
    mobile-backoffice/                # React Native (bare) — merchant/staff (POS, kitchen, Tap-to-Pay)

  libs/
    backend/                          # Grouping folder (NOT a lib)
      identity/                       # Domain: Identity & Access Management
        authentication/               # JWT, Passport.js, refresh tokens, OTP, AuthenticationGuard
        users/                        # User CRUD, profiles, passwords
        companies/                    # Company CRUD + 4 config enum tables (business-types, payment-methods, company-info-*) as sibling files
        authorization/                # CASL AbilityFactory, AuthorizationService, 5 fixed roles
        audit/                        # Append-only audit trail (@AuditLog decorator + service)

      catalog/                        # Domain: Catalog (tiered: company-level + shop overrides; includes Shop)
        categories/                   # Category CRUD + ShopCategory overrides as sibling files
        menu-items/                   # MenuItem CRUD + ShopMenuItem overrides as sibling files
        menu-addons/                  # MenuAddon, MenuAddonOption + ShopMenuAddon, ShopMenuAddonOption overrides
        shops/                        # Shop CRUD + user_shops M2M assignment
        item-purchase-counts/         # ItemPurchaseCount + UserShopItemOrder (denormalized analytics)

      ordering/                       # Domain: Ordering
        carts/                        # Cart, CartItem, CartItemOption
        orders/                       # Order lifecycle, status transitions
        kitchen/                      # KitchenGateway (WebSocket), UserShopKitchenSettings, snapshot tick

      payment/                        # Domain: Payments (Stripe only)
        stripe-accounts/              # CompanyPaymentProviderAccount (Stripe Connect)
        terminal/                     # Stripe Terminal Tap-to-Pay setup
        webhooks/                     # Stripe webhook handling, signature verification

      operations/                     # Domain: Operations (runtime concerns only)
        discounts/                    # ShopDiscount, ShopDiscountMenuItem
        waste/                        # Waste tracking (shop floor activity)

      integrations/                   # Domain: External integrations
        accounting/                   # Xero dual-mode (per-company + platform fallback)
        notifications/                # FCM push notifications
        email/                        # Mail dispatch via @nestjs-modules/mailer + Handlebars

      infra/                          # Cross-cutting infrastructure (NOT a domain)
        database/                     # Prisma client, multi-file schema, migrations, tenant helpers, RLS, PrismaService Proxy
        queue/                        # BullMQ placeholder — NOT YET PROVISIONED. Defer until needed.
        mail/                         # @nestjs-modules/mailer + Handlebars templates
        notifications/                # FCM transport
        storage/                      # File uploads via FileInterceptor + Sharp compression
        stripe/                       # Stripe SDK wrapper
        xero/                         # Xero SDK wrapper (consumed by integrations/accounting)
        logging/                      # Structured logging
        config/                       # NestJS ConfigModule, env loading, validation
        websocket/                    # WebSocket gateway base classes, WsJwtGuard
        auth/                         # Passport JWT strategy, AuthenticationGuard, token utilities
        audit/                        # @AuditLog decorator + interceptor + AuditService

    web/                              # Grouping folder (NOT a lib)
      identity/                       # Login, OTP verification, profile, user/company management
      catalog/                        # Menu management UI (categories, items, addons, shop overrides)
      ordering/                       # POS terminal, order management, kitchen view
      payment/                        # Stripe Connect setup, Terminal device management, payment history
      operations/                     # Shops/branches, discounts, waste tracking, dashboard
      integrations/                   # Xero connection setup, accounting sync UI

    mobile/                           # Grouping folder (NOT a lib)
      identity/                       # Mobile login, OTP, profile
      catalog/                        # Menu browse / quick edit
      ordering/                       # Mobile POS, kitchen screen
      payment/                        # Stripe Terminal Tap-to-Pay flows
      operations/                     # Shop switcher, discount picker

    shared/                           # Grouping folder (NOT a lib)
      types/                          # TypeScript interfaces (API contracts, single source of truth)
      utils/                          # Currency (GBP default), date/timezone, phone validation, slugs
      web-ui/                         # MUI 7 theme + RTL config, ThemeProvider setup, composite components
      mobile-ui/                      # React Native Paper theme + PaperProvider, composite components
      i18n/                           # react-i18next config, en.json, ar.json, ICU plurals
      api/                            # RTK Query API slices per domain (web + mobile share)
      store/                          # Redux client-state slices (web + mobile share)
```

## Lib Counts

| Group                                                | Count        |
| ---------------------------------------------------- | ------------ |
| Backend — domain sub-module libs (6 domains)         | 21           |
| Backend — infra (cross-cutting libs)                 | 12           |
| Web (6 domain libs)                                  | 6            |
| Mobile (5 domain libs)                               | 5            |
| Shared                                               | 7            |
| **Total libs**                                       | **51**       |

### Backend sub-module breakdown

| Domain         | Sub-modules                                                                                                 | Count |
| -------------- | ----------------------------------------------------------------------------------------------------------- | ----- |
| Identity       | authentication, users, companies, authorization, audit                                                      | 5     |
| Catalog        | categories, menu-items, menu-addons, shops, item-purchase-counts                                            | 5     |
| Ordering       | carts, orders, kitchen                                                                                      | 3     |
| Payment        | stripe-accounts, terminal, webhooks                                                                         | 3     |
| Operations     | discounts, waste                                                                                            | 2     |
| Integrations   | accounting, notifications, email                                                                            | 3     |
| **Total**      |                                                                                                             | **21**|

## Naming Conventions

| Pattern                        | Example                  | Usage                         |
| ------------------------------ | ------------------------ | ----------------------------- |
| `backend-{domain}-{submodule}` | `backend-catalog-menu-items` | Backend domain sub-module lib |
| `backend-infra-{purpose}`      | `backend-infra-database` | Backend infrastructure lib    |
| `web-{domain}`                 | `web-catalog`            | Web feature lib               |
| `mobile-{domain}`              | `mobile-ordering`        | Mobile feature lib            |
| `shared-{purpose}`             | `shared-types`           | Cross-cutting shared lib      |

## Import Path Aliases

All aliases follow `@yellowladder/{lib-name}` mapping to `libs/{path}/src/index.ts`. The `{lib-name}` is derived from the naming conventions above (e.g., `libs/backend/catalog/menu-items/` → `@yellowladder/backend-catalog-menu-items`).

The aliases are declared in `tsconfig.base.json` and kept **sorted alphabetically**. Add new aliases in the correct alphabetical position.

## Nx Project Tags

Every project gets tags for `type`, `platform`, and (backend libs only) `domain`.

| Tag                    | Applied To                                                                              |
| ---------------------- | --------------------------------------------------------------------------------------- |
| `type:app`             | All apps (`core-service`, `web-backoffice`, `mobile-backoffice`)                        |
| `type:backend`         | All backend domain sub-module libs                                                       |
| `type:infra`           | All `backend/infra/*` libs                                                              |
| `type:web`             | All web libs                                                                            |
| `type:mobile`          | All mobile libs                                                                         |
| `type:data-access`     | `shared/api`, `shared/store`                                                            |
| `type:web-ui`          | `shared/web-ui`                                                                         |
| `type:mobile-ui`       | `shared/mobile-ui`                                                                      |
| `type:types`           | `shared/types`                                                                          |
| `type:util`            | `shared/utils`                                                                          |
| `type:i18n`            | `shared/i18n`                                                                           |
| `platform:server`      | `apps/core-service`, all backend libs, all infra libs                                   |
| `platform:web`         | `apps/web-backoffice`, all web libs, `shared/web-ui`                                    |
| `platform:mobile`      | `apps/mobile-backoffice`, all mobile libs, `shared/mobile-ui`                           |
| `platform:any`         | `shared/types`, `shared/utils`, `shared/i18n`, `shared/api`, `shared/store`             |
| `domain:identity`      | All `backend/identity/*` libs                                                           |
| `domain:catalog`       | All `backend/catalog/*` libs                                                            |
| `domain:ordering`      | All `backend/ordering/*` libs                                                           |
| `domain:payment`       | All `backend/payment/*` libs                                                            |
| `domain:operations`    | All `backend/operations/*` libs                                                         |
| `domain:integrations`  | All `backend/integrations/*` libs                                                       |

## Module Boundary Constraints

```json
{
  "@nx/enforce-module-boundaries": [
    "error",
    {
      "depConstraints": [
        {
          "sourceTag": "type:app",
          "onlyDependOnLibsWithTags": [
            "type:web",
            "type:mobile",
            "type:backend",
            "type:infra",
            "type:data-access",
            "type:web-ui",
            "type:mobile-ui",
            "type:util",
            "type:types",
            "type:i18n"
          ]
        },
        {
          "sourceTag": "type:web",
          "onlyDependOnLibsWithTags": [
            "type:data-access",
            "type:web-ui",
            "type:util",
            "type:types",
            "type:i18n"
          ]
        },
        {
          "sourceTag": "type:mobile",
          "onlyDependOnLibsWithTags": [
            "type:data-access",
            "type:mobile-ui",
            "type:util",
            "type:types",
            "type:i18n"
          ]
        },
        {
          "sourceTag": "type:data-access",
          "onlyDependOnLibsWithTags": ["type:util", "type:types"]
        },
        {
          "sourceTag": "type:backend",
          "onlyDependOnLibsWithTags": ["type:backend", "type:infra", "type:util", "type:types"]
        },
        {
          "sourceTag": "type:infra",
          "onlyDependOnLibsWithTags": ["type:infra", "type:util", "type:types"]
        },
        { "sourceTag": "type:web-ui", "onlyDependOnLibsWithTags": ["type:util", "type:types"] },
        { "sourceTag": "type:mobile-ui", "onlyDependOnLibsWithTags": ["type:util", "type:types"] },
        { "sourceTag": "type:util", "onlyDependOnLibsWithTags": ["type:types"] },
        { "sourceTag": "type:types", "onlyDependOnLibsWithTags": [] },
        { "sourceTag": "type:i18n", "onlyDependOnLibsWithTags": ["type:types"] },
        {
          "sourceTag": "platform:web",
          "notDependOnLibsWithTags": ["platform:server", "platform:mobile"]
        },
        {
          "sourceTag": "platform:mobile",
          "notDependOnLibsWithTags": ["platform:server", "platform:web"]
        },
        {
          "sourceTag": "platform:server",
          "notDependOnLibsWithTags": ["platform:web", "platform:mobile"]
        }
      ]
    }
  ]
}
```

The `domain:*` tags are available for finer cross-domain boundary enforcement as the codebase grows. You can use them to forbid cross-domain backend imports outside of barrels.

## Dependency Direction

```text
apps/web-backoffice ────> web/* libs ─────> shared/api ──────> shared/types
                                       ─────> shared/web-ui ────> shared/utils
apps/mobile-backoffice ──> mobile/* libs ──> shared/api
                                        ──> shared/mobile-ui
apps/core-service ───────> backend/*/* libs ──> backend/infra/* libs ──> shared/types
                                            ──> backend/infra/* libs ──> shared/utils
```

- Apps import libs. Libs never import apps.
- Web and mobile libs import `shared/api`, `shared/store`, their respective UI lib, and other shared libs. **Never backend libs.**
- Backend domain sub-modules within the same domain import each other freely. Cross-domain imports go through barrels only.
- **Cross-domain writes MUST go through `DomainEventPublisher`.** Never call another domain's service to perform a write.
- Backend infra libs are low-level building blocks. They cannot import domain libs. Domain libs depend on them, not the other way around.
- `shared/api` and `shared/store` import `shared/types` and `shared/utils` only. **Cannot import backend libs.**
- `shared/types` has zero dependencies. It is the leaf node.
- No circular dependencies between domains.

## Notes on Lib Decomposition

- A sub-module with one entity and one set of CRUD endpoints is one lib.
- Closely related entities with cascade-delete relationships share a sub-module (e.g., `MenuAddonOption` lives inside `backend-catalog-menu-addons` because it cascades from `MenuAddon`). Same pattern as `OrderItem` living inside an `orders` sub-module.
- **Shop overrides live inside the sub-module of the entity they override**, not in a separate `shop-overrides` sub-module:
  - `ShopCategory` → `backend-catalog-categories` (sibling files alongside `categories.controller.ts`)
  - `ShopMenuItem` → `backend-catalog-menu-items`
  - `ShopMenuAddon`, `ShopMenuAddonOption` → `backend-catalog-menu-addons`
- Override services are **separate files** from the parent entity services (e.g., `menu-items.service.ts` and `shop-menu-items.service.ts` as siblings — same module, different classes answering different questions). Both share the sub-module's `*.module.ts` and `index.ts` barrel.
- **`Shop` lives in `backend-catalog-shops`**, not Operations. Shop is a passive configured location (name, address, hours) — a noun, not a runtime verb. The `user_shops` M2M assignment join lives inside `catalog-shops`.
- The `kitchen/` sub-module is intentionally part of `ordering/` (not a top-level domain) — kitchen is a real-time view over orders, not a separate bounded context.
- The `accounting/` sub-module is part of `integrations/` and is owned by the `accountant` engineer agent (when that agent is created).
- The 4 config enum tables (business types, payment methods, and 2 company-info lookups) live inside `backend-identity-companies` as sibling files — same module, separate `*.controller.ts` / `*.service.ts` / `*.repository.ts` per lookup so each gets its own URL surface (e.g. `/api/v1/business-types`, `/api/v1/payment-methods`).
- The legacy filename typo `compant-info-*` is renamed to `company-info-*` during the refactor. Do not preserve the typo.
