#!/usr/bin/env bash
# Hook: PreToolUse (Bash) — Validate Conventional Commits format on git commit
# Format: {type}({scope}): {description}
# Types: feat, fix, refactor, revert, test, docs, chore, perf, ci

set -euo pipefail

deny() {
  jq -n --arg r "$1" '{hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"deny",permissionDecisionReason:$r}}'
  exit 0
}

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

[ -z "$COMMAND" ] && exit 0

# Only check `git commit` commands with -m
if ! echo "$COMMAND" | grep -qE '\bgit\s+commit\b'; then
  exit 0
fi

# Skip --amend without new message (commitlint will validate the existing message on its own)
if echo "$COMMAND" | grep -qE '\-\-amend' && ! echo "$COMMAND" | grep -qE '\-m\s'; then
  exit 0
fi

# Skip HEREDOC commits — commitlint hook will validate them after they're written
if echo "$COMMAND" | grep -qE '<<\s*[A-Za-z'\''_-]+'; then
  exit 0
fi

# Extract first -m argument
MSG=$(echo "$COMMAND" | grep -oE "\-m\s+['\"][^'\"]*['\"]" | head -1 | sed -E "s/^-m\s+['\"]//; s/['\"]$//")

[ -z "$MSG" ] && exit 0

# Validate Conventional Commits format
PATTERN='^(feat|fix|refactor|revert|test|docs|chore|perf|ci)(\([a-z][-a-z0-9]+\))?: .+'
if ! echo "$MSG" | grep -qE "$PATTERN"; then
  deny "Commit message does not match Conventional Commits format. Expected: {type}({scope}): {description}. Types: feat|fix|refactor|revert|test|docs|chore|perf|ci. Scopes are derived from Yellow Ladder lib names (e.g., backend-catalog-menu-items, web-ordering, workspace). See .claude/rules/git.md."
fi

exit 0
