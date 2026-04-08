---
name: review-pr
description: Review a PR using the full Yellow Ladder code-reviewer checklist (architecture, security, multi-tenancy, authorization, conventions). Read-only.
argument-hint: <pr-number-or-branch>
disable-model-invocation: true
allowed-tools: Bash(gh *), Bash(git *), Read, Grep, Glob
---

# Review PR

Review a pull request using the Yellow Ladder code-reviewer checklist. Outputs structured findings with file:line references.

**Owner:** `code-reviewer` agent (advisory; the engineer who wrote the code does the fixes).

**Argument:**
- `$1` — PR number (e.g., `42`) or branch name (e.g., `feat/YL-123/menu-modifiers`)

## Pre-flight checks

1. Confirm `gh` CLI is authenticated
2. Read all 10 files in `.claude/rules/` to load conventions and constraints
3. Read `.claude/agents/code-reviewer.md` for the severity scale and output format

## Steps

1. **Fetch PR diff and details:**
   ```bash
   gh pr diff $1
   gh pr view $1
   ```

2. **Read each changed file in full** (not just the diff hunks). Context matters — a changed function may interact with siblings that weren't changed.

3. **Apply the full review checklist (12 categories):**

   ### 1. Architecture & module boundaries
   - No DDD layer directories (`domain/`, `application/`, `infrastructure/`)
   - No `src/lib/` (flat `src/` only)
   - Sub-module file grouping respected (2+ files of same type → grouped subdirectory)
   - No new NestJS apps (modular monolith — Constraint 3)
   - Lib boundaries respected (backend ↔ web ↔ mobile separation)
   - Cross-domain WRITES go through `DomainEventPublisher`, never direct service imports
   - No public apps (`web-public`, `mobile-public` are forbidden — Constraint 11)

   ### 2. Multi-tenancy correctness
   - Multi-tenant tables have `companyId` and (if applicable) `shopId`
   - RLS policies in place for new multi-tenant tables
   - No manual `companyId` filtering in services
   - Shop scoping via `shopId IN user.shopIds` or base service helper
   - `SystemPrismaService` (if used) is gated by CASL `SUPER_ADMIN` check
   - No `$queryRawUnsafe` with user input

   ### 3. Authorization (CASL)
   - Authorization in services, not controllers
   - 5-method CASL flow followed (`requirePermission` → `ensureFieldsPermitted` → ...)
   - `@CurrentAbility()` passed to service from controller
   - Action names are plain verbs (`Create`, `Read`, `Update`, `Delete`) — not `Manage` or `View`
   - `pickPermittedFields` called on every read return value
   - `ensureFieldsPermitted` called on every write input

   ### 4. Security
   - **No hardcoded OTP `886644`** — BLOCKER on sight (Constraint 12)
   - No `localStorage.setItem('...token...')` — access token in memory only
   - No social login imports (Constraint 9)
   - bcrypt for passwords (cost factor 12+)
   - SHA-256 for OTP/reset tokens (hashed before storage)
   - Webhook signature verification for Stripe webhooks
   - No raw secrets committed
   - `@nestjs/throttler` rate limiting on auth/order endpoints

   ### 5. Backend conventions (NestJS)
   - Controllers thin, delegate to services
   - DTOs implement shared/types interfaces, have `toInput()`/`toDto()`
   - Services accept named repository input types (not DTOs, not raw Prisma)
   - Repositories use Prisma's generated types (no `unknown`, no `as never`)
   - `BusinessException` with domain error codes (no raw NestJS exceptions)
   - Routes versioned at `/api/v1/`
   - Swagger annotations on controllers

   ### 6. Web conventions (React + MUI)
   - Function components only, named exports
   - All user-facing strings via `useTranslation()`
   - RTK Query hooks (no raw `fetch`)
   - React Hook Form + Zod for forms
   - MUI components only (no Tailwind, no styled-components)
   - `<CanAction>` / `<CanField>` for authorization UI
   - Locale-prefixed routes
   - Access token in memory (not localStorage)

   ### 7. Mobile conventions (React Native)
   - Function components, named exports (navigators may default-export when framework requires)
   - React Native Paper components (no custom primitives)
   - React Navigation 6 patterns
   - No `@hot-updater/react-native`, no Zustand, no TanStack Query
   - `react-native-keychain` for refresh token
   - No SQLite, no offline state

   ### 8. Database conventions (Prisma)
   - Multi-file schema layout respected (one `.prisma` per domain, no `config.prisma`)
   - `@@map` and `@map` for snake_case naming
   - Monetary fields as `Int` (pence), not `Float`/`Decimal`
   - All multi-tenant tables have RLS policies and indexes on `companyId`
   - **`MenuItem.companyId` and `Category.shop_id` checked against `pre-rls-blockers.md`**
   - No nullable `companyId` on multi-tenant tables

   ### 9. Domain & data correctness
   - 33 preserved entities still match legacy table structure (verbatim migration)
   - Yellow Ladder-specific re-homing decisions respected (Shop in Catalog, kitchen under Ordering, etc.)
   - Two-level tenancy (Company → Shop) preserved
   - Catalog inheritance (company-level + shop overrides) respected

   ### 10. Code quality
   - No `any` type
   - No `enum` (use `as const`)
   - No default exports (except framework configs)
   - No `I` prefix on interfaces
   - No abbreviation of "authentication" / "authorization"
   - File naming: kebab-case with type suffix
   - All libs export through `src/index.ts` barrel

   ### 11. Tests
   - No new tests expected — testing is deferred (Constraint 8)
   - If tests are added, flag as NOTE (not BLOCKER) — the user may have explicitly requested them

   ### 12. Git & commit conventions
   - Commit messages match Conventional Commits with valid Yellow Ladder scopes
   - Branch name follows `{type}/{TICKET-ID}/{description}`
   - PR title is Conventional Commits format

4. **Categorize each finding** by severity (per `.claude/agents/code-reviewer.md`):
   - **BLOCKER** — violates a hard constraint or introduces security risk. Must fix before merge.
   - **MAJOR** — violates a documented convention or boundary rule. Should fix.
   - **MINOR** — minor convention deviation. Optional.
   - **NOTE** — informational, not a finding.

5. **Output the structured review:**

   ```markdown
   # Code Review: PR #${1}

   **Files reviewed:** {N}
   **Findings:** {B} BLOCKER, {M} MAJOR, {m} MINOR, {n} NOTE

   ---

   ## BLOCKER

   ### 1. {Title}
   - **File:** `{path}:{line}`
   - **Issue:** {description}
   - **Constraint:** {hard constraint number from architecture.md}
   - **Suggested fix:** {minimal prose change — never code}

   ## MAJOR
   ...

   ## MINOR
   ...

   ## NOTE
   ...

   ## Summary
   {1-paragraph verdict, escalation notes for architect/database-engineer if needed}
   ```

   If there are no findings:
   ```markdown
   # Code Review: PR #${1}

   **Files reviewed:** {N}
   **Findings:** none

   This change conforms to all hard constraints, lib boundaries, and conventions. No issues found.
   ```

## Hard rules

- **READ-ONLY** — never modify files, never push, never close the PR
- **Cite specific lines** — `path/to/file.ts:42` is more useful than "the controller"
- **Suggest minimal fixes in prose** — never write code
- **BLOCKER findings prevent merge** — flag prominently
- **Don't say "LGTM"** — your role is to surface findings, not bless merges

## Hand-off

After the review:
- BLOCKER findings → notify the engineer who wrote the code (`backend-engineer`, `web-engineer`, `mobile-engineer`)
- Schema-level findings → hand off to `database-engineer`
- Architectural concerns → escalate to `architect`
- Xero/accounting findings → hand off to `accountant` (when created)
