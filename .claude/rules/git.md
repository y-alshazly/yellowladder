---
description: Git conventions — branching strategy, branch naming, commit messages, scopes
alwaysApply: true
---

# Git Conventions

## Branching & Deployment Strategy

Three long-lived branches map 1:1 to environments:

```text
feature/* ──> develop (auto-deploy to develop env)
                 │
                 ▼  (PR when batch is ready)
              staging (auto-deploy to staging env)
                 │
                 ▼  (PR when staging is validated)
               main (auto-deploy to production env)
```

| Branch    | Environment | Deploy trigger | Protection                                               |
| --------- | ----------- | -------------- | -------------------------------------------------------- |
| `develop` | Develop     | Push / merge   | Require PR, CI pass                                      |
| `staging` | Staging     | Push / merge   | Require PR from `develop` only, CI pass                  |
| `main`    | Production  | Push / merge   | Require PR from `staging` only, **2 approvals**, CI pass |

**Rules:**

- **Never commit directly to `staging` or `main`.** All code flows through `develop` first.
- **No release branches.** The promotion path `develop` → `staging` → `main` is the only release mechanism.
- **Squash merge** all PRs. Each PR becomes a single commit on the target branch.
- **Hotfixes:** Branch from `main` (`hotfix/YL-xxx/description`), merge to `main`, then back-merge `main` → `staging` → `develop` to keep branches aligned. **This is the only scenario requiring back-merges.**

**Mobile builds map to branches** (Fastlane only — no hot-updater):

- `develop` → internal test builds (TestFlight internal, Firebase App Distribution)
- `staging` → external test builds (TestFlight external, Google Play internal testing)
- `main` → production builds (App Store, Google Play production)

## Branch Naming

`{type}/{TICKET-ID}/{short-description}`

Examples: `feat/YL-123/migrate-menu-items`, `fix/YL-456/kitchen-snapshot-tick`, `chore/YL-789/eslint-config`

## Commit Messages

Conventional Commits format enforced by commitlint:

```text
{type}({scope}): {description}

[optional body]

{TICKET-ID}
```

Include the ticket ID (e.g., `YL-123`) in the branch name and commit body to link commits to issues.

**Types:** `feat`, `fix`, `refactor`, `revert`, `test`, `docs`, `chore`, `perf`, `ci`

**Scopes:** Derived from lib names (see `workspace-structure.md`). Pattern: `backend-{domain}-{submodule}` for backend, `backend-infra-{purpose}` for infra, `web-{domain}` for web, `mobile-{domain}` for mobile, `shared-{purpose}` for shared, app name for apps, `workspace` for root config.

Domain-level shorthand scopes (for commits spanning multiple sub-modules within a domain): `backend-identity`, `backend-catalog`, `backend-ordering`, `backend-payment`, `backend-operations`, `backend-integrations`, `backend-infra`

### Backend sub-module scopes

- **Identity:** `backend-identity-authentication`, `backend-identity-users`, `backend-identity-companies`, `backend-identity-authorization`, `backend-identity-audit`
- **Catalog:** `backend-catalog-categories`, `backend-catalog-menu-items`, `backend-catalog-menu-addons`, `backend-catalog-shops`, `backend-catalog-item-purchase-counts`
- **Ordering:** `backend-ordering-carts`, `backend-ordering-orders`, `backend-ordering-kitchen`
- **Payment:** `backend-payment-stripe-accounts`, `backend-payment-terminal`, `backend-payment-webhooks`
- **Operations:** `backend-operations-discounts`, `backend-operations-waste`
- **Integrations:** `backend-integrations-accounting`, `backend-integrations-notifications`, `backend-integrations-email`

### Infra scopes

`backend-infra-database`, `backend-infra-queue`, `backend-infra-mail`, `backend-infra-notifications`, `backend-infra-storage`, `backend-infra-stripe`, `backend-infra-xero`, `backend-infra-logging`, `backend-infra-config`, `backend-infra-websocket`, `backend-infra-auth`, `backend-infra-audit`

### Web scopes

`web-identity`, `web-catalog`, `web-ordering`, `web-payment`, `web-operations`, `web-integrations`

### Mobile scopes

`mobile-identity`, `mobile-catalog`, `mobile-ordering`, `mobile-payment`, `mobile-operations`

### Shared scopes

`shared-types`, `shared-utils`, `shared-web-ui`, `shared-mobile-ui`, `shared-i18n`, `shared-api`, `shared-store`

### App scopes

`core-service`, `web-backoffice`, `mobile-backoffice`

### Special scopes

- `deps` — dependency updates
- `workspace` — root config (Nx, ESLint, Prettier, tsconfig.base, etc.)

## Examples

```text
feat(backend-catalog-menu-items): add modifier groups
fix(backend-ordering-kitchen): correct snapshot tick interval
feat(backend-integrations-accounting): implement Xero dual-mode resolver
chore(backend-infra-mail): switch to Handlebars templates
fix(backend-identity-authentication): remove hardcoded OTP 886644
feat(web-catalog): add menu item edit dialog
fix(web-shared-ui): correct RTL flip on date picker
feat(mobile-ordering): add kitchen screen
chore(workspace): bump nx to 22.6
chore(deps): update prisma to 7.0.5
```

## Squash Merge PR Title Convention

Since all PRs are squash-merged, the **PR title becomes the commit message**. PR titles must follow Conventional Commits format:

```text
feat(backend-catalog-menu-items): add modifier groups
```

The PR description provides additional context and references the ticket.
