---
name: check-conventions
description: Audit a lib against all Yellow Ladder conventions (structure, controllers, services, DTOs, web/mobile patterns). Read-only.
argument-hint: <lib-path-or-name>
disable-model-invocation: true
allowed-tools: Read, Grep, Glob
---

# Check Conventions

Audit a single lib against the full set of Yellow Ladder conventions documented in `.claude/rules/`.

**Argument:**
- `$1` — lib path (e.g., `libs/backend/catalog/menu-items`) or short name (e.g., `backend-catalog-menu-items`)

## Pre-flight checks

1. Resolve `$1` to a directory path
2. Confirm the directory exists
3. Determine the lib type (backend / web / mobile / shared / infra) from the path

## Steps

Apply ALL applicable checks in order. For each finding, output the file:line and the rule reference.

### 1. Structure (all libs)

- [ ] `src/` directory exists
- [ ] **NO `src/lib/`** (Yellow Ladder uses flat `src/`)
- [ ] `src/index.ts` barrel file exists
- [ ] No DDD layer directories (`domain/`, `application/`, `infrastructure/`, `feature/`)
- [ ] File naming: kebab-case with type suffix (`.controller.ts`, `.service.ts`, `.component.tsx`, etc.)
- [ ] When 2+ files of the same type exist, they're grouped into a subdirectory (`controllers/`, `dtos/`, `components/`)
- [ ] No shim re-export files (only `index.ts` re-exports)
- [ ] `project.json` has correct `tags`
- [ ] `tsconfig.base.json` has the path alias

### 2. Backend libs (additional)

- [ ] `*.module.ts` declares the NestJS module
- [ ] `*.controller.ts` is **thin** — no business logic, only `Dto.toInput()` / `service.method()` / `Dto.toDto()`
- [ ] `*.controller.ts` uses `@CurrentAbility()`, `@CurrentCompany()`, `@AuditLog()` decorators
- [ ] `*.controller.ts` uses `ParseUUIDPipe` on `:id` params
- [ ] `*.controller.ts` passes `{ id }` object (not bare string) to service for CASL
- [ ] `*.service.ts` follows the **5-method service flow** (`requirePermission` → `ensureFieldsPermitted` → ...)
- [ ] `*.service.ts` injects `AuthorizationService` and uses it for authorization
- [ ] `*.service.ts` accepts named repository input types (NOT DTO classes, NOT raw Prisma types)
- [ ] `*.service.ts` does NOT import request DTOs (`Create*Dto` / `Update*Dto`)
- [ ] `*.service.ts` does NOT manually filter by `companyId` (RLS handles it)
- [ ] `*.service.ts` uses `BusinessException` with domain error codes (NOT raw NestJS exceptions)
- [ ] `*.repository.ts` uses `PrismaService` (default tenant-scoped)
- [ ] `*.repository.ts` exports named input types (e.g., `CreateMenuItemInput = Omit<...>`)
- [ ] `*.repository.ts` `findOne` accepts `where: Prisma.XxxWhereInput` (not bare `id: string`)
- [ ] DTO files implement `shared/types` interfaces
- [ ] Request DTOs have `static toInput()` method
- [ ] Response DTOs have `static toDto()` method
- [ ] DTOs have `[key: string]: unknown` index signature for CASL
- [ ] Cross-domain WRITES use `DomainEventPublisher`, not direct service imports

### 3. Web libs (additional)

- [ ] Function components only (no class components)
- [ ] No default exports (except framework configs)
- [ ] Named export with `{Component}Props` interface
- [ ] All user-facing strings via `useTranslation()` from `react-i18next` (no hardcoded EN/AR)
- [ ] RTK Query hooks from `@yellowladder/shared-api` (no raw `fetch`)
- [ ] Forms use React Hook Form + Zod via `@hookform/resolvers/zod`
- [ ] Zod schemas in co-located `*.schema.ts` files
- [ ] MUI components from `@mui/material` (no Tailwind, no styled-components)
- [ ] `<CanAction>` and `<CanField>` wrap action buttons and form fields
- [ ] No `localStorage.setItem('...token...')` — access token is in-memory in Redux
- [ ] Locale-prefixed routes (`/(en|ar)/...`)

### 4. Mobile libs (additional)

- [ ] Function components only
- [ ] React Native Paper components (no custom UI primitives)
- [ ] React Navigation 6 patterns
- [ ] No `@hot-updater/react-native` (dropped from legacy)
- [ ] No Zustand, no `@tanstack/react-query` (legacy mobile stack — replaced)
- [ ] `react-native-keychain` for refresh token storage
- [ ] No SQLite, no offline state introductions

### 5. Shared libs (additional)

- [ ] Correct boundary tags per `.claude/rules/workspace-structure.md`
- [ ] `shared/types` has zero dependencies
- [ ] `shared/api` does NOT import any backend libs
- [ ] `shared/utils` only depends on `shared/types`

### 6. TypeScript rules (all libs)

- [ ] Strict mode enabled
- [ ] No `any` type
- [ ] No `enum` declarations (use `as const`)
- [ ] No `I` prefix on interfaces
- [ ] No abbreviation of "authentication" / "authorization"
- [ ] No `// @ts-ignore` without explanation

### 7. Forbidden patterns (all libs)

- [ ] No hardcoded OTP `886644` (security hard-stop)
- [ ] No `$queryRawUnsafe` with user input
- [ ] No Paymob references (Stripe only)
- [ ] No imports from `next/`, `expo/`, `drizzle-orm`, `typeorm`, `@hot-updater/react-native`

## Output format

For each finding:

```
[VIOLATION | WARNING | OK] {file path}:{line if applicable}
  Rule: {.claude/rules/...}
  Issue: {what's wrong}
  Fix: {minimal change in prose}
```

End with a summary:
```
Conventions audit: {V} violations, {W} warnings, {O} OK checks
```

## Hard rules

- **READ-ONLY** — never modify files
- **Reference the rule** for every finding (file path in `.claude/rules/`)
- **Categorize correctly:**
  - VIOLATION = breaks a hard constraint or documented rule (must fix)
  - WARNING = stylistic / minor convention deviation (should fix)
  - OK = passes the check

## Hand-off

After the audit:
- Pass the findings to the appropriate engineer agent for fixing
- Escalate architectural questions (e.g., "is this even the right lib?") to `architect`
