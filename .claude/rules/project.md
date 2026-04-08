---
description: Project overview, tech stack, coding conventions, localization, migration context
alwaysApply: true
---

# Yellow Ladder

Single source of truth for all agents working in this codebase. Every decision is final and approved. Do not deviate without explicit user approval.

Yellow Ladder is a **multi-tenant Point of Sale (POS) and restaurant management platform** for food service businesses. It helps merchants manage shops, menus, orders, payments, inventory, and kitchen operations across web and mobile backoffice surfaces. It is being **migrated from a legacy Express + TypeORM codebase (Tappd)** to a modern NestJS + Prisma stack while preserving 33 existing entities and the bulk of business logic.

- **Market:** UK + global; pricing defaults to GBP
- **Languages:** English (default) + Arabic (RTL)
- **Currencies:** GBP (primary), expandable
- **Multi-tenancy:** Two-level — `Company → Shop → data`. Shared database, PostgreSQL Row-Level Security on `company_id`, CASL service-layer enforcement on `shop_id`
- **Package manager:** npm
- **Nx workspace name:** `@yellowladder/source`
- **Nx version:** 22.5.1
- **Node:** >= 20.19.0

## Tech Stack

| Layer                        | Technology                          | Notes                                                                                                                          |
| ---------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Monorepo                     | Nx 22.5.1                           | npm. `@nx/nest`, `@nx/react`, `@nx/react-native`, `@nx/vite`, `@nx/webpack`                                                    |
| Web                          | React 19 + Vite 7                   | SPA, NOT Next.js, no SSR                                                                                                       |
| Mobile                       | React Native 0.79 (bare)            | `@nx/react-native`, NOT Expo                                                                                                   |
| UI framework (web)           | MUI 7                               | With MUI RTL configuration for Arabic                                                                                          |
| UI framework (mobile)        | React Native Paper                  | Material Design 3, built-in RTL, replaces all legacy custom primitives in `src/ui/`                                            |
| State management             | Redux Toolkit + RTK Query           | RTK Query for server state, Redux slices for client state. Replaces legacy Zustand + TanStack Query on mobile                  |
| Web routing                  | React Router 7                      | Locale-prefixed routes: `/en/orders/123`, `/ar/orders/123`                                                                     |
| Mobile routing               | React Navigation 6                  | Native stack + tabs                                                                                                            |
| Backend                      | NestJS 11                           | Modular monolith, REST API at `/api/v1/`                                                                                       |
| ORM                          | Prisma 7                            | Multi-file schema (`prismaSchemaFolder`) in `libs/backend/infra/database/src/prisma/schema/`, one `.prisma` per domain         |
| Database                     | PostgreSQL 15                       | Cloud SQL `yellowladder-postgres` in `europe-west2`. Shared DB with RLS for tenant isolation                                   |
| Validation (web/mobile)      | Zod                                 | `@hookform/resolvers/zod` for React Hook Form. Zod schemas in feature libs                                                     |
| Validation (backend)         | class-validator + class-transformer | NestJS native decorators on DTO classes. `ValidationPipe` globally                                                             |
| Authorization                | CASL + @casl/prisma                 | Service-layer authorization. Five fixed user tiers built into the `AbilityFactory`. Replaces legacy `allowedTo.ts` middleware  |
| Shared types                 | TypeScript interfaces               | `shared/types` is the single source of truth. Zod schemas and class-validator DTOs both conform to these interfaces            |
| Forms                        | React Hook Form + Zod               | Via `@hookform/resolvers/zod`                                                                                                  |
| i18n                         | react-i18next                       | ICU message format for Arabic plural rules. Works in React Native too                                                          |
| Authentication               | JWT (access + refresh)              | 5min access (in-memory web / Keychain mobile), 7d refresh (HttpOnly cookie web / `react-native-keychain` mobile). Passport.js  |
| OTP                          | Email-based                         | Preserved from legacy. **Hardcoded OTP `886644` MUST be removed before non-dev shipping**                                       |
| Payments                     | Stripe                              | Connected accounts (direct-charge model) + Stripe Terminal Tap-to-Pay. **No Paymob.**                                          |
| Accounting                   | Xero                                | Dual-mode: per-company connection (default) + platform-level fallback. Daily sync via Cloud Run Job at 23:59                  |
| Realtime                     | NestJS WebSocket Gateway            | `@nestjs/websockets` + `socket.io`. Kitchen Flash → `KitchenGateway`. JWT-authenticated sockets via `WsJwtGuard`               |
| Mail                         | `@nestjs-modules/mailer`            | Handlebars templates. Replaces legacy direct Nodemailer                                                                        |
| File uploads                 | NestJS `FileInterceptor`            | multer-based + Sharp for compression                                                                                           |
| Push notifications           | FCM                                 | Firebase Cloud Messaging                                                                                                       |
| Mobile releases              | Fastlane                            | Sole release pipeline. **No `@hot-updater/react-native` — dropped from legacy**                                                |
| Domain events                | NestJS EventEmitter                 | Wrapped in `DomainEventPublisher`. **No BullMQ / Redis initially** — added when a second async use case appears                |
| Scheduled jobs               | Cloud Scheduler + Cloud Run Jobs    | Daily Xero sync at 23:59. DB migrations as Cloud Run Job                                                                       |
| Cloud                        | Google Cloud Platform               | Cloud Run (`tappd-backend`), Cloud SQL, Artifact Registry, Workload Identity Federation                                        |
| Linting                      | ESLint (flat config)                | `@nx/enforce-module-boundaries` for dependency rules                                                                           |
| Formatting                   | Prettier                            | Single config at workspace root                                                                                                |
| Commit linting               | commitlint + husky + lint-staged    | Conventional Commits format                                                                                                    |

## Nx Workspace

- Always use `nx` for tasks: `npx nx run`, `npx nx run-many`, `npx nx affected`. Never run the underlying tooling directly.
- Prefix with `npx` (e.g., `npx nx build`, `npx nx test`) — runs the local `node_modules` version.
- Never guess CLI flags — always check `--help` first when unsure.
- Use Nx generators with `--dry-run` first to confirm paths before generating libs/components.

## Coding Conventions

- TypeScript strict mode everywhere (`"strict": true`).
- All files use `kebab-case` naming with a type suffix: `{name}.{suffix}.ts(x)` (e.g., `menu-item.entity.ts`, `use-cart.hook.ts`, `orders.controller.ts`). See `backend.md`, `web.md`, and `mobile.md` for the full suffix tables per platform.
- All libs export through a barrel file (`src/index.ts`). Nothing is imported from internal paths.
- **No default exports.** Use named exports only. (Sole exception: React Navigation root navigators when the framework requires it.)
- Prefer `interface` for object shapes, `type` for unions/intersections.
- **No `any`.** Use `unknown` and narrow with type guards.
- **No `enum`.** Use `as const` objects with derived types.
- **No `I` prefix** on TypeScript interfaces. Use plain names: `Order`, `CreateOrderRequest`, `GetOrderResponse`.
- **Never abbreviate** `authentication` or `authorization`. Use the full word in file names, class names, variable names, and comments.
- All lib source files live directly in `src/`. **No `src/lib/` subdirectory.** The barrel file imports from `./` not `./lib/`.

## Localization

- Default language: English (`en`). Supported: `en`, `ar`.
- All user-facing strings go through react-i18next. **No hardcoded strings in components.**
- Translation files: `libs/shared/i18n/src/messages/en.json` and `ar.json`.
- RTL: Set `dir="rtl"` on `<html>` when locale is `ar`. MUI handles component-level RTL via its RTL theme configuration. React Native Paper reads `I18nManager.isRTL`.
- URL structure (web): `/{locale}/...` (e.g., `/ar/orders/123`). React Router handles locale prefix.
- Currency formatting: Use `Intl.NumberFormat` with locale. GBP default.
- Arabic has 6 plural forms (zero, one, two, few, many, other). Use ICU message format.
- Database stores bilingual content where applicable in separate columns (`name_en`, `name_ar`, `description_en`, `description_ar`).

## Migration Context (from Legacy Tappd)

This codebase is being **migrated from a legacy Express + TypeORM application (Tappd)** to NestJS 11 + Prisma 7. The migration:

- **Preserves 33 existing entities** and the bulk of business logic
- **Modernizes the framework** (Express → NestJS, TypeORM → Prisma, raw Socket.io → NestJS Gateways, Nodemailer → `@nestjs-modules/mailer`, custom middleware → CASL `AbilityFactory`)
- **Uplifts tenancy** from single-level to two-level (`Company → Shop`)
- **Versions the API** at `/api/v1/` from day one
- **Drops** the hardcoded testing OTP `886644`, `@hot-updater/react-native`, Zustand + TanStack Query (mobile), the legacy custom UI primitives in `src/ui/`
- **Defers** BullMQ + Redis, tests, public-facing apps, offline POS, social login

Service-method bodies transfer mostly verbatim. The migration is a framework + structure uplift, not a business-logic rewrite.

## Testing Strategy

**Testing is deferred during the refactor.** Zero tests are required. Do not author Jest, Testcontainers, or any other test files unless the user explicitly asks.

- No coverage thresholds.
- No CI test step.
- Jest + Testcontainers infrastructure may be scaffolded as a future direction in `.ai/rules/`, but no enforcement.
- Revisit after the refactor stabilizes.

## Important Reminders

- **No Next.js.** The web app is a React SPA built with Vite. No App Router, no `use client`, no server components, no `getServerSideProps`, no `next/image`, no `next/link`.
- **No Expo.** React Native uses bare workflow with `@nx/react-native`.
- **RTK + RTK Query, not TanStack Query or Zustand.** All server state via RTK Query API slices in `shared/api`. All client state via Redux slices in `shared/store`. Store created in the app shell.
- **No architectural layer directories in sub-modules.** Follow the file grouping convention from `architecture.md`.
- **Apps are thin.** If you are adding business logic, UI components, services, or utilities to `apps/`, move it to the appropriate lib.
- **Zod on web/mobile, class-validator on backend.** Web and mobile forms use Zod schemas. Backend DTOs use class-validator decorators. `shared/types` interfaces are the single source of truth both conform to.
- **Prisma, not Drizzle/TypeORM.** Multi-file schema split by domain in `libs/backend/infra/database/src/prisma/schema/`.
- **react-i18next, not next-intl.** There is no Next.js in this project.
- **npm, not pnpm or yarn.** All Nx commands: `npx nx ...`.
- **Backoffice only.** App naming: `core-service` (API), `web-backoffice`, `mobile-backoffice`. **No `web-public` or `mobile-public` apps.** Yellow Ladder has no customer-facing surface today.
- **Company, not Tenant.** The tenant root entity is `Company`. Do not propose a rename.
- **Two-level tenancy.** `Company → Shop → data`. RLS enforces `company_id`. CASL enforces `shop_id` in the service layer.
- **Stripe only.** No Paymob. No alternative payment gateways.
- **Online-only mobile.** No SQLite, no offline POS, no sync conflict resolution.
- **Fastlane only.** No hot-updater. All mobile releases via Fastlane.
- **Remove hardcoded OTP `886644`** before any non-dev shipping. Security hard-stop.
