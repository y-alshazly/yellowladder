#!/usr/bin/env bash
# Hook: PreToolUse (Bash) — Block destructive git operations
# Force-push to main, hard reset, force clean, branch deletion of main/master.

set -euo pipefail

deny() {
  jq -n --arg r "$1" '{hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"deny",permissionDecisionReason:$r}}'
  exit 0
}

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

[ -z "$COMMAND" ] && exit 0

# git push -f / --force without --force-with-lease, targeting main/master
if echo "$COMMAND" | grep -qE 'git\s+push.*(\s|^)(-f|--force)(\s|$)' && \
   ! echo "$COMMAND" | grep -qE '\-\-force-with-lease' && \
   echo "$COMMAND" | grep -qE '(main|master)(\s|$)'; then
  deny "Force-push to main/master is forbidden. Use --force-with-lease at minimum, and only after explicit user authorization. See architecture.md §Security."
fi

# git reset --hard
if echo "$COMMAND" | grep -qE 'git\s+reset\s+(--hard|.*-\w*[Hh])'; then
  deny "git reset --hard is destructive. Confirm with the user first. Prefer git stash or a fresh branch."
fi

# git checkout . / git restore .
if echo "$COMMAND" | grep -qE 'git\s+(checkout|restore)\s+\.($|\s)'; then
  deny "Restoring all files discards uncommitted work. Confirm with the user first."
fi

# git clean -f / -fd / -fx
if echo "$COMMAND" | grep -qE 'git\s+clean\s+.*-\w*[fF]'; then
  deny "git clean -f deletes untracked files irreversibly. Confirm with the user first."
fi

# git branch -d/-D main / master
if echo "$COMMAND" | grep -qE 'git\s+branch\s+-[dD]\s+(main|master)(\s|$)'; then
  deny "Deleting the primary branch (main/master) is forbidden."
fi

exit 0
