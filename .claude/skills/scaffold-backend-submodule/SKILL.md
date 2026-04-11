---
name: scaffold-backend-submodule
description: Scaffold a new backend sub-module Nx lib (NestJS module, controller, service, repository, DTOs directory, barrel) for Yellow Ladder. Wires Nx tags, tsconfig paths, and creates a thin canonical structure.
argument-hint: <domain> <submodule>
disable-model-invocation: true
allowed-tools: Bash(npx nx *), Read, Write, Edit, Glob
---

# Scaffold Backend Sub-Module

Use this skill to create a new backend sub-module lib at `libs/backend/{domain}/{submodule}/`.

**Arguments:**

- `$1` — domain (one of: `identity`, `catalog`, `ordering`, `payment`, `operations`, `integrations`)
- `$2` — submodule name (kebab-case, e.g., `menu-items`, `stripe-accounts`)

**Pre-flight checks:**

- Confirm the target path does not already exist: `libs/backend/$1/$2/`
- Confirm `$1` is one of the 6 valid domains
- Read `.claude/rules/workspace-structure.md` to verify the sub-module fits the documented structure
- If the sub-module is `Shop`-related or `Company` config-related, confirm with the user that placement matches `.claude/rules/domain-model.md` (e.g., Shop goes in `catalog/shops`, not `operations`)

## Steps

1. **Generate the Nx lib:**

   ```bash
   npx nx g @nx/nest:library libs/backend/$1/$2 \
     --tags="type:backend,platform:server,domain:$1" \
     --strict=true \
     --no-interactive
   ```

2. **Clean up generated files:**
   - Remove the auto-generated module/controller/service that Nx creates (we'll write our own following Yellow Ladder conventions)
   - Verify `src/lib/` does NOT exist — Yellow Ladder uses flat `src/` (no `src/lib/`)
   - Move any files Nx put in `src/lib/` directly into `src/`

3. **Create canonical files in `src/`** (read `.claude/examples/canonical-*.ts` for the patterns):
   - `index.ts` — barrel that re-exports `*.module.ts`, public DTOs, and named input types
   - `$2.module.ts` — NestJS module
   - `$2.controller.ts` — thin controller that uses `@CurrentUser()` to receive the `AuthenticatedUser` and (optionally) `@RequirePermission(Permissions.XxxYyy)` for early rejection via the global `RolesGuard` (use `.claude/examples/canonical-controller.ts` as reference)
   - `$2.service.ts` — service following the 4-step RBAC flow (`requirePermission → scopeWhereToUserShops / assertShopAccess → repository → return`); every method's first parameter is `user: AuthenticatedUser`. Uses `AuthorizationService` from `@yellowladder/backend-identity-authorization`. (Use `.claude/examples/canonical-service.ts`.)
   - `$2.repository.ts` — Prisma wrapper with named input types and `findOne(where: Prisma.${Entity}WhereInput)` (use `.claude/examples/canonical-repository.ts`)
   - `$2.swagger.ts` — Swagger decorators (only if 3+ endpoints planned)
   - `dtos/` directory (only when 2+ DTOs are planned — otherwise flat with `create-$2.dto.ts`). DTOs do NOT need a `[key: string]: unknown;` index signature.

4. **For shop-override entities** (e.g., `ShopMenuItem`, `ShopCategory`):
   - Do NOT create a separate sub-module — overrides live as **sibling files** inside the parent sub-module.
   - Add `shop-$2.controller.ts`, `shop-$2.service.ts`, `shop-$2.repository.ts` next to the parent files.
   - Both classes register in the SAME `$2.module.ts`.
   - See `.claude/rules/architecture.md` §Sub-Module Architecture and `.claude/rules/domain-model.md` §Override service convention.

5. **Verify `project.json` tags** are correct:

   ```json
   {
     "tags": ["type:backend", "platform:server", "domain:$1"]
   }
   ```

6. **Verify `tsconfig.base.json` path** was added:

   ```json
   "@yellowladder/backend-$1-$2": ["libs/backend/$1/$2/src/index.ts"]
   ```

   Insert in alphabetical order if not already present.

7. **Update the barrel** (`src/index.ts`) to re-export:
   - The module class
   - Public DTOs (request types — never response DTOs as they're consumed via the controller)
   - Named input types from the repository (so other domain libs can reference them via shared/types if needed)

8. **Register the module** in `apps/core-service/src/app/app.module.ts` imports array.

## Hard rules to enforce

- **No `src/lib/` subdirectory** — flat `src/` only (`.claude/rules/project.md` §Coding Conventions)
- **No DDD layer directories** (`domain/`, `application/`, `infrastructure/`) — flat sub-module structure
- **Barrel file is the only re-export point** — no shim re-export files
- **`PrismaService`** is the default repository client (tenant-scoped, RLS enforced)
- **`AuthorizationService`** is injected in the service for the 4-step RBAC flow; every service method takes `user: AuthenticatedUser` as its first parameter and calls `requirePermission(user, Permissions.XxxYyy)` before any work
- **No tests scaffolded** — testing is deferred for the refactor (`.claude/rules/project.md` §Testing Strategy)

## Hand-off

After scaffolding:

- The `backend-engineer` agent owns the implementation of controller/service/repository methods
- The `database-engineer` agent owns any Prisma schema changes the new sub-module needs
- The `architect` agent should validate the structure if this is the first sub-module of a new domain
