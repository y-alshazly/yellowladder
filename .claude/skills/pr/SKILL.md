---
name: pr
description: Create branch (if needed), commit (if needed), push to remote, and open a PR following Yellow Ladder conventions.
argument-hint: [TICKET-ID or short description]
disable-model-invocation: true
allowed-tools: Bash(git *), Bash(gh *), Read
---

# PR

Push the current branch to origin and open a pull request to `develop`. If there are uncommitted changes or the user is on `develop`/`staging`/`main`, this skill creates the branch and commit first.

**Argument:**
- `$1` (optional) — ticket ID (`YL-123`) or short description

## Pre-flight checks

1. Show current state:
   - `git branch --show-current`
   - `git status --short`
   - `git log --oneline -5`
   - Branch tracking status: `git rev-list --count --left-right origin/develop...HEAD` (if not on develop)

2. Confirm `gh` CLI is authenticated: `gh auth status`

## Steps

1. **Analyze changes and determine branch name** (same logic as `branch` skill).

2. **If currently on `develop`, `staging`, or `main`:**
   - Create a new feature branch
   - Note: this skill cannot push to `develop`/`staging`/`main` directly — they are PR-only

3. **If there are uncommitted changes:**
   - Run the convention checks from `commit` skill (BLOCK if VIOLATIONS found)
   - Stage and commit them following conventions

4. **Verify commits exist on the current branch** (otherwise nothing to PR):
   ```bash
   git log origin/develop..HEAD --oneline
   ```

5. **Ensure branch is up to date with develop:**
   ```bash
   git fetch origin develop
   ```
   If `develop` has new commits, ask the user whether to merge or rebase. Default to merge for safety:
   ```bash
   git merge origin/develop --no-edit
   ```

6. **Push the branch** to origin (with `-u` if first push):
   ```bash
   git push -u origin {branch-name}
   ```

7. **Draft the PR title and body:**

   **Title** (under 70 characters, Conventional Commits format):
   ```
   feat(backend-catalog-menu-items): add modifier groups
   ```

   **Body** (HEREDOC template):
   ```markdown
   ## Summary
   - {1-3 bullet points describing what changed}

   ## Why
   {1-2 sentences on motivation, citing the relevant constraint or ADR if applicable}

   ## Test plan
   - [ ] Manually verified {behavior X}
   - [ ] Manually verified {behavior Y}
   - [ ] {Other manual checks}

   ## Constraints touched
   - {Constraint number from .claude/rules/architecture.md, if applicable}

   {YL-XXX if known}
   ```

   **Note:** No automated test step in the test plan — testing is deferred during the refactor.

8. **Show the draft** and ask for confirmation.

9. **Create the PR:**
   ```bash
   gh pr create --base develop --title "${title}" --body "$(cat <<'EOF'
   ## Summary
   - ...

   ## Why
   ...

   ## Test plan
   - [ ] ...

   YL-123
   EOF
   )"
   ```

10. **Output the PR URL** for the user.

## Hard rules

- **Base branch is always `develop`** for feature PRs (per Yellow Ladder branching strategy)
- **Hotfix PRs target `main`** — but this skill is for feature work; hotfixes are a separate flow
- **PR title must be Conventional Commits format** — it becomes the squash commit message
- **No `git push --force` unless user explicitly authorizes** — `block-dangerous-git.sh` enforces this
- **CI must pass** before merge (enforced by branch protection on the GitHub side)

## Hand-off

After the PR is created:
- Use `review-pr` skill to self-review before requesting reviewers
- Address any failing CI checks
- For PRs to `staging` or `main`, the user creates those manually after `develop → staging` validation
