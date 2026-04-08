---
name: commit
description: Stage changes and create a Conventional Commits commit with a validated Yellow Ladder scope. Runs convention checks before commit.
argument-hint: [files-or-message]
disable-model-invocation: true
allowed-tools: Bash(git *), Read, Grep
---

# Commit

Stage changes and create a single commit following Yellow Ladder conventions.

**Argument:**
- `$1` (optional) — file paths to stage, OR a free-form description of the change

## Pre-flight checks

1. Show current state:
   - `git branch --show-current`
   - `git status --short`
   - `git diff --stat`
   - `git log --oneline -5`

2. Confirm there are uncommitted changes

3. Confirm the user is NOT on `staging` or `main` (those branches are PR-only)

## Steps

1. **Analyze the changes** to determine type, scope, description (same logic as `branch` skill).

2. **Run convention spot-checks** on modified backend files:

   For each modified `*.dto.ts`:
   - **VIOLATION** if `Create*Dto` / `Update*Dto` is missing `static toInput()`
   - **VIOLATION** if `Get*Dto` is missing `static toDto()`

   For each modified `*.service.ts`:
   - **VIOLATION** if it imports `Create*Dto` / `Update*Dto` (services should accept named repository input types)
   - **VIOLATION** if it manually filters by `companyId` (RLS handles this)
   - **VIOLATION** if it uses `SystemPrismaService` without `requirePermission` nearby

   For each modified `*.controller.ts`:
   - **VIOLATION** if it does business logic instead of delegating to a service
   - **VIOLATION** if it uses `@RequirePermission` or other authorization decorators (authorization belongs in services)
   - **WARNING** if it does not use `@CurrentAbility()` / `@CurrentCompany()` for write endpoints

   For any file:
   - **VIOLATION** if it contains the hardcoded OTP `886644`
   - **VIOLATION** if it uses `localStorage.setItem('...token...')`
   - **WARNING** if it imports from `next/`, `expo/`, `@hot-updater/react-native`, `zustand`, `@tanstack/react-query`, `drizzle-orm`, `typeorm`

3. **If any VIOLATION is found**, STOP. Print the findings and ask the user to fix them before re-running this skill.

4. **If only WARNINGS are found**, surface them and ask the user whether to proceed.

5. **Stage specific files** by name (avoid `git add -A` unless the user requests it). If `$1` is a list of paths, stage those.

6. **Validate the scope** against the Yellow Ladder allowlist (see `.claude/rules/git.md`).

7. **Draft the commit message:**
   ```
   {type}({scope}): {description}

   {optional body explaining why}

   {YL-XXX ticket if known}
   ```

8. **Show the message** and ask for confirmation.

9. **Create the commit** with HEREDOC:
   ```bash
   git commit -m "$(cat <<'EOF'
   feat(backend-catalog-menu-items): add modifier groups

   Implements modifier group support per the architect's spec.

   YL-123
   EOF
   )"
   ```

10. **Print the commit hash** and `git status` to confirm clean state.

## Hard rules

- **VIOLATIONS block the commit** — fix them first
- **Never bypass with `--no-verify`** unless the user explicitly requests it
- **Conventional Commits format** validated by hooks (`validate-commit-format.sh`)
- **Single commit per skill invocation** — don't batch multiple commits
- **Never commit `.env`, credentials, or other sensitive files**

## Hand-off

After the commit:
- Use `pr` skill to push and open a PR
- Use `commit` again for follow-up commits on the same branch
