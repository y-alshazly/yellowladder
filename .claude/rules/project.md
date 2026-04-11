---
description: Project overview, tech stack, coding conventions, localization, migration context
alwaysApply: true
---

# Yellow Ladder

Single source of truth for all agents working in this codebase. Every decision is final and approved. Do not deviate without explicit user approval.

Yellow Ladder is a **multi-tenant Point of Sale (POS) and restaurant management platform** for food service businesses. It helps merchants manage shops, menus, orders, payments, and kitchen operations from a **mobile backoffice app that runs on phones AND tablets** (the tablet is the primary POS / Kitchen Display surface). It is being **migrated from a legacy Express + TypeORM codebase (Tappd)** to a modern NestJS + Prisma stack while preserving 33 existing entities and the bulk of business logic.

## Active Frontend Scope

- **`apps/mobile-backoffice`** is the **sole active frontend**. All current feature work targets this app.
- **`apps/web-backoffice`** exists as an empty placeholder in the monorepo for future use. **Do not build features there right now.** The `web.md` rule file and the `web-engineer` agent definition remain in the repo so the conventions are documented for later, but no feature prompts or active work should target the web app until the user explicitly unlocks it.
- **Mobile runs on phones and tablets.** UI must be **fully responsive** across phone portrait, phone landscape, tablet portrait, and tablet landscape. See `mobile.md` §Responsive Layout for breakpoints and navigator patterns.
- The POS and Kitchen Display are **tablet-primary** screens (they are designed to run on a tablet mounted at the counter or in the kitchen), but must also degrade gracefully to phone size.

- **Market:** UK + global; pricing defaults to GBP
- **Languages:** English (default, main) + German (`de`) + French (`fr`). **LTR only — no RTL.**
- **Currencies:** GBP (primary), expandable
- **Multi-tenancy:** Two-level — `Company → Shop → data`. Shared database, PostgreSQL Row-Level Security on `company_id`, RBAC service-layer enforcement on `shop_id`
- **Package manager:** npm
- **Nx workspace name:** `@yellowladder/source`
- **Nx version:** 22.5.1
- **Node:** >= 20.19.0

## Tech Stack

| Layer                   | Technology                          | Notes                                                                                                                                                                                                                           |
| ----------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Monorepo                | Nx 22.5.1                           | npm. `@nx/nest`, `@nx/react`, `@nx/react-native`, `@nx/vite`, `@nx/webpack`                                                                                                                                                     |
| Web                     | React 19 + Vite 7                   | SPA, NOT Next.js, no SSR                                                                                                                                                                                                        |
| Mobile                  | React Native 0.79 (bare)            | `@nx/react-native`, NOT Expo                                                                                                                                                                                                    |
| UI framework (web)      | MUI 7                               | LTR only (no RTL plugin, no Emotion RTL cache). Supports en/de/fr                                                                                                                                                               |
| UI framework (mobile)   | React Native Paper                  | Material Design 3, LTR only. Replaces all legacy custom primitives in `src/ui/`                                                                                                                                                 |
| State management        | Redux Toolkit + RTK Query           | RTK Query for server state, Redux slices for client state. Replaces legacy Zustand + TanStack Query on mobile                                                                                                                   |
| Web routing             | React Router 7                      | Locale-prefixed routes: `/en/orders/123`, `/de/orders/123`, `/fr/orders/123`                                                                                                                                                    |
| Mobile routing          | React Navigation 6                  | Native stack + tabs                                                                                                                                                                                                             |
| Backend                 | NestJS 11                           | Modular monolith, REST API at `/api/v1/`                                                                                                                                                                                        |
| ORM                     | Prisma 7                            | Multi-file schema (`prismaSchemaFolder`) in `libs/backend/infra/database/src/prisma/schema/`, one `.prisma` per domain                                                                                                          |
| Database                | PostgreSQL 15                       | Cloud SQL `yellowladder-postgres` in `europe-west2`. Shared DB with RLS for tenant isolation                                                                                                                                    |
| Validation (web/mobile) | Zod                                 | `@hookform/resolvers/zod` for React Hook Form. Zod schemas in feature libs                                                                                                                                                      |
| Validation (backend)    | class-validator + class-transformer | NestJS native decorators on DTO classes. `ValidationPipe` globally                                                                                                                                                              |
| Authorization           | RBAC (Role-Based Access Control)    | Service-layer authorization via `AuthorizationService` + optional controller-level `@RequirePermission(...)` + `RolesGuard`. Five fixed roles hard-coded in `RolePermissionRegistry`. Replaces legacy `allowedTo.ts` middleware |
| Shared types            | TypeScript interfaces               | `shared/types` is the single source of truth. Zod schemas and class-validator DTOs both conform to these interfaces                                                                                                             |
| Forms                   | React Hook Form + Zod               | Via `@hookform/resolvers/zod`                                                                                                                                                                                                   |
| i18n                    | react-i18next                       | ICU message format. Three locales: `en` (default), `de`, `fr`. Works in React Native too                                                                                                                                        |
| Authentication          | JWT (access + refresh)              | 5min access (in-memory web / Keychain mobile), 7d refresh (HttpOnly cookie web / `react-native-keychain` mobile). Passport.js                                                                                                   |
| OTP                     | Email-based                         | Preserved from legacy. **Hardcoded OTP `886644` MUST be removed before non-dev shipping**                                                                                                                                       |
| Payments                | Stripe                              | Connected accounts (direct-charge model) + Stripe Terminal Tap-to-Pay. **No Paymob.**                                                                                                                                           |
| Accounting              | Xero                                | Dual-mode: per-company connection (default) + platform-level fallback. Daily sync via Cloud Run Job at 23:59                                                                                                                    |
| Realtime                | NestJS WebSocket Gateway            | `@nestjs/websockets` + `socket.io`. Kitchen Flash → `KitchenGateway`. JWT-authenticated sockets via `WsJwtGuard`                                                                                                                |
| Mail                    | `@nestjs-modules/mailer`            | Handlebars templates. Replaces legacy direct Nodemailer                                                                                                                                                                         |
| File uploads            | NestJS `FileInterceptor`            | multer-based + Sharp for compression                                                                                                                                                                                            |
| Push notifications      | FCM                                 | Firebase Cloud Messaging                                                                                                                                                                                                        |
| Mobile releases         | Fastlane                            | Sole release pipeline. **No `@hot-updater/react-native` — dropped from legacy**                                                                                                                                                 |
| Domain events           | NestJS EventEmitter                 | Wrapped in `DomainEventPublisher`. **No BullMQ / Redis initially** — added when a second async use case appears                                                                                                                 |
| Scheduled jobs          | Cloud Scheduler + Cloud Run Jobs    | Daily Xero sync at 23:59. DB migrations as Cloud Run Job                                                                                                                                                                        |
| Cloud                   | Google Cloud Platform               | Cloud Run (`tappd-backend`), Cloud SQL, Artifact Registry, Workload Identity Federation                                                                                                                                         |
| Linting                 | ESLint (flat config)                | `@nx/enforce-module-boundaries` for dependency rules                                                                                                                                                                            |
| Formatting              | Prettier                            | Single config at workspace root                                                                                                                                                                                                 |
| Commit linting          | commitlint + husky + lint-staged    | Conventional Commits format                                                                                                                                                                                                     |

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

- Default/main language: English (`en`). Supported locales: `en`, `de` (German), `fr` (French).
- **LTR only.** Yellow Ladder does NOT support RTL. No MUI RTL plugin, no Emotion RTL cache, no `stylis-plugin-rtl`, no `dir="rtl"` on the document root, no `I18nManager.forceRTL` / `I18nManager.isRTL` on mobile.
- All user-facing strings go through react-i18next. **No hardcoded strings in components.**
- Translation files: `libs/shared/i18n/src/messages/en.json`, `de.json`, `fr.json`. Every key must exist in all three files or the build fails (enforced by `audit-translations` skill).
- URL structure (web): `/{locale}/...` where `{locale}` is one of `en`, `de`, `fr` (e.g., `/de/orders/123`). React Router handles the locale prefix.
- Currency formatting: Use `Intl.NumberFormat` with the current locale. GBP default — revisit if a EUR-primary market is targeted.
- Plural rules: English, German, and French use 2 plural forms (`one`, `other`). ICU message format is still used because it also handles gender and nested interpolation cleanly.
- Database stores translated content where applicable in three-locale columns: `name_en`, `name_de`, `name_fr` (and `description_en`, `description_de`, `description_fr` where descriptions apply). See `backend.md` for the column convention and the `add-translated-columns` skill.

## Migration Context (from Legacy Tappd)

This codebase is being **migrated from a legacy Express + TypeORM application (Tappd)** to NestJS 11 + Prisma 7. The migration:

- **Preserves 33 existing entities** and the bulk of business logic
- **Modernizes the framework** (Express → NestJS, TypeORM → Prisma, raw Socket.io → NestJS Gateways, Nodemailer → `@nestjs-modules/mailer`, custom middleware → RBAC `RolePermissionRegistry` + `AuthorizationService`)
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
- **Two-level tenancy.** `Company → Shop → data`. RLS enforces `company_id`. RBAC enforces `shop_id` in the service layer via `AuthorizationService.scopeWhereToUserShops(user, where)`.
- **Stripe only.** No Paymob. No alternative payment gateways.
- **Online-only mobile.** No SQLite, no offline POS, no sync conflict resolution.
- **Fastlane only.** No hot-updater. All mobile releases via Fastlane.
- **Remove hardcoded OTP `886644`** before any non-dev shipping. Security hard-stop.
