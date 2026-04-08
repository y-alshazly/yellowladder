---
name: branch
description: Create a feature branch from uncommitted changes and commit them following Yellow Ladder conventions. Does NOT push or create a PR.
argument-hint: [TICKET-ID or short description]
disable-model-invocation: true
allowed-tools: Bash(git *), Read
---

# Branch

Create a new feature branch and commit current changes following Yellow Ladder conventions. Stops short of pushing or opening a PR.

**Argument:**
- `$1` (optional) — ticket ID (e.g., `YL-123`) or short kebab description of the change

## Pre-flight checks

1. Show current state in parallel:
   - `git branch --show-current`
   - `git status --short`
   - `git diff --stat`
   - `git log --oneline -5`

2. Confirm there are uncommitted changes (otherwise this skill is a no-op)

## Steps

1. **Analyze changes** to determine:
   - **Type:** `feat` | `fix` | `refactor` | `revert` | `test` | `docs` | `chore` | `perf` | `ci`
   - **Scope:** derive from the lib name(s) of the modified files (e.g., `backend-catalog-menu-items`)
   - **Description:** short imperative summary
   - **Ticket ID:** parsed from `$1` if provided

2. **Determine branch name:**
   - If `$1` is a ticket ID (matches `YL-\d+`): `{type}/{ticket-id}/{short-description}`
   - If `$1` is a description: `{type}/{description}`
   - If no `$1`: `{type}/{description-from-changes}`

3. **If currently on `develop`, `staging`, or `main`,** create the branch:
   ```bash
   git checkout -b ${branch-name}
   ```

4. **If currently on a feature branch,** confirm with the user before creating a new branch — they may want to commit to the existing one.

5. **Stage specific files** (avoid `git add -A` unless the user explicitly requests it):
   - List the files to be staged
   - Stage them by name

6. **Validate the scope** against the Yellow Ladder allowlist (see `.claude/rules/git.md`):
   - **Backend domain shorthand:** `backend-identity`, `backend-catalog`, `backend-ordering`, `backend-payment`, `backend-operations`, `backend-integrations`, `backend-infra`
   - **Backend sub-modules:** `backend-{domain}-{submodule}` (e.g., `backend-catalog-menu-items`)
   - **Backend infra:** `backend-infra-{purpose}` (e.g., `backend-infra-database`)
   - **Web:** `web-{domain}` (e.g., `web-catalog`)
   - **Mobile:** `mobile-{domain}` (e.g., `mobile-ordering`)
   - **Shared:** `shared-types`, `shared-utils`, `shared-web-ui`, `shared-mobile-ui`, `shared-i18n`, `shared-api`, `shared-store`
   - **Apps:** `core-service`, `web-backoffice`, `mobile-backoffice`
   - **Special:** `deps`, `workspace`

7. **Draft the commit message** following Conventional Commits:
   ```
   {type}({scope}): {description}

   {optional body}

   {ticket-id}
   ```

8. **Show the message and ask for confirmation** before committing.

9. **Create the commit** using HEREDOC for proper formatting:
   ```bash
   git commit -m "$(cat <<'EOF'
   feat(backend-catalog-menu-items): add modifier groups

   Implements modifier group support per the architect's spec.

   YL-123
   EOF
   )"
   ```

10. **Done** — print the commit hash and the branch name. Do NOT push, do NOT create a PR.

## Hard rules

- **No `git add -A` by default** — list specific files
- **Conventional Commits format enforced** by `validate-commit-format.sh` hook
- **Squash-merge model** — feature branches eventually become a single commit on `develop` via PR
- **Hotfix branches** start from `main`, not `develop` (see `.claude/rules/git.md`)
- **Never commit sensitive files** — confirm `.env` and credentials are not staged
- **Never push or create PR** — that's `pr` skill's job

## Hand-off

After the commit:
- The user can continue making changes on this branch
- When ready, use the `pr` skill to push and open a PR
- Or use `commit` to add additional commits to the same branch
