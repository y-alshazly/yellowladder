---
name: check-tenancy
description: Verify multi-tenancy correctness in a backend lib (PrismaService usage, RLS, no manual filtering, shop scoping). Read-only.
argument-hint: <lib-path-or-name>
disable-model-invocation: true
allowed-tools: Read, Grep, Glob
---

# Check Tenancy

Audit a backend lib for multi-tenancy correctness against `.claude/rules/architecture.md` §Multi-Tenancy.

**Argument:**

- `$1` — lib path (e.g., `libs/backend/catalog/menu-items`) or short name

## Pre-flight checks

1. Resolve `$1` to a directory path
2. Confirm it's a backend lib
3. Read `.claude/rules/architecture.md` §Multi-Tenancy and §Shop Scoping for the rules

## Steps

Apply each check and report findings as **CRITICAL** (data leakage risk) or **WARNING** (incorrect pattern but no leakage).

### 1. Prisma service usage

- [ ] Repository injects `PrismaService` (default tenant-scoped) — OK
- [ ] If repository injects `SystemPrismaService`:
  - **CRITICAL** if the corresponding service does NOT call `requirePermission(user, Permissions.PlatformManage)` (or the equivalent `SUPER_ADMIN`-gated permission) at the top of every method that uses it
  - **WARNING** if the SUPER_ADMIN check is implicit and unclear
- [ ] If repository uses `prisma.$queryRaw` or `$executeRaw`:
  - **CRITICAL** if the raw query references a multi-tenant table without `WHERE company_id = ...`
  - **WARNING** otherwise — flag for review

### 2. Manual companyId filtering

- [ ] Service files MUST NOT contain `where: { companyId }` or `where: { company_id }` filters
  - **CRITICAL** if found — RLS handles this; manual filtering may interfere with RLS
  - Exception: explicit cross-company queries via `SystemPrismaService` (must be RBAC-gated by `requirePermission` on a `SUPER_ADMIN`-only permission)

### 3. Shop scoping (RBAC service-layer enforcement)

Shop scoping is enforced **explicitly** in service code using `AuthorizationService` helpers — there is no implicit CASL rule merging. Every shop-scoped query must either:

- build its `where` via `scopeWhereToUserShops(user, baseWhere)` (for list/read), which injects `shopId: { in: user.shopIds }` when the user is a `SHOP_MANAGER` / `EMPLOYEE` and leaves it unconstrained for `COMPANY_ADMIN` / `SUPER_ADMIN`, OR
- call `assertShopAccess(user, shopId)` before any single-shop write, which throws `ForbiddenException` if the shop isn't in `user.shopIds`.

Checks:

- [ ] Shop-scoped read/list methods call `scopeWhereToUserShops(user, ...)` (NOT the removed CASL helpers `mergeConditionsIntoWhere` / `accessibleBy`)
- [ ] Shop-scoped write/update/delete methods call `assertShopAccess(user, shopId)` before the repository call
- [ ] **WARNING** if a service references `shopId` without either helper
- [ ] **WARNING** if a service queries shop-scoped data and the query is missing the shop filter entirely
- [ ] **WARNING** if the service still imports or calls the removed CASL APIs (`AppAbility`, `accessibleBy`, `mergeConditionsIntoWhere`, `ensureFieldsPermitted`, `pickPermittedFields`, `ensureConditionsMet`)

### 4. RLS coverage

- [ ] Read the corresponding `.prisma` file(s)
- [ ] For each multi-tenant model in the lib's domain, confirm:
  - `companyId` column exists and is `NOT NULL`
  - The model has `@@index([companyId])`
  - A migration file contains `ENABLE ROW LEVEL SECURITY` for the table
  - A `tenant_isolation` policy exists for the table
- [ ] **CRITICAL** if a multi-tenant model has no RLS policy
- [ ] **CRITICAL** if `companyId` is nullable on a multi-tenant model — see `.claude/rules/pre-rls-blockers.md`

### 5. Tenant context handling

- [ ] Controllers MUST NOT manually call `setTenantContext()` — the `TenantContextMiddleware` handles it
- [ ] Services MUST NOT manually call `setTenantContext()`
- [ ] If a service handles a non-HTTP entry (event handler, scheduled job), it must explicitly set the context using the company ID from the event payload — **CRITICAL** if missing

### 6. Cross-tenant data leakage scenarios

- [ ] Relations to other multi-tenant entities must enforce `company_id` consistency at the application layer (e.g., when creating a `CartItem` referencing a `MenuItem`, both must belong to the same company)
- [ ] Cache keys must include `companyId` to prevent cache poisoning across tenants
- [ ] Domain event payloads must include `companyId` so handlers can set tenant context correctly
- [ ] Public read endpoints (when introduced) must use `PublicPrismaService` and explicitly enforce any visibility flags

### 7. SUPER_ADMIN protection

- [ ] If the lib uses `SystemPrismaService`:
  - The service that consumes it must call `requirePermission(user, Permissions.PlatformManage)` (or the equivalent `SUPER_ADMIN`-only permission) at the top of every method that uses it
  - The service file must NOT be exposed to non-`SUPER_ADMIN` code paths
  - **CRITICAL** if `SystemPrismaService` is injected without an RBAC `requirePermission` guard on a `SUPER_ADMIN`-only permission

## Output format

```
# Tenancy Audit: ${1}

## CRITICAL (Data leakage risk — must fix before merge)
- libs/backend/catalog/menu-items/src/menu-items.service.ts:52
  Issue: Manual companyId filter in service. RLS already enforces this — manual filtering can interfere.
  Fix: Remove `where: { companyId }`. RLS will scope automatically via PrismaService Proxy.

- libs/backend/.../src/...repository.ts:18
  Issue: SystemPrismaService injected, but the corresponding service has no `requirePermission(user, Permissions.PlatformManage)` check.
  Fix: Add `requirePermission(user, Permissions.PlatformManage)` at the top of every service method that uses SystemPrismaService.

## WARNING (Incorrect pattern, no leakage)
- libs/backend/catalog/menu-items/src/menu-items.service.ts:74
  Issue: Service queries shop-scoped data but does not scope to `user.shopIds`.
  Fix: Add `where: { shopId: { in: user.shopIds } }` or use the base service shop helper.

## OK
- RLS policies are in place for all multi-tenant models in this domain.
- PrismaService is the default client (tenant-scoped, RLS enforced).

## Summary
- CRITICAL: 2
- WARNING: 1
- OK checks: 8
```

## Hard rules

- **READ-ONLY** — never modify files
- **CRITICAL findings block merge** — flag prominently
- **Always check `.prisma` files** for the corresponding domain — service code is meaningless without confirmed RLS
- **Reference `.claude/rules/architecture.md` §Multi-Tenancy** for every finding

## Hand-off

After the audit:

- CRITICAL findings → escalate immediately to the engineer who wrote the code
- WARNING findings → file as PR review comments
- If schema-level issues are found (missing RLS policy, nullable companyId), hand off to `database-engineer`
