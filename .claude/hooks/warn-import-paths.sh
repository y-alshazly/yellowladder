#!/usr/bin/env bash
# Hook: PostToolUse (Write|Edit) — Warn about cross-platform import violations
# Backend cannot import web/mobile libs and vice versa.

set -euo pipefail

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // empty')

[ -z "$CONTENT" ] && exit 0
[ -z "$FILE_PATH" ] && exit 0

WARNINGS=""

# Backend files cannot import web/mobile libs
if [[ "$FILE_PATH" == *libs/backend/* ]] || [[ "$FILE_PATH" == *apps/core-service/* ]]; then
  if echo "$CONTENT" | grep -qE "from\s+['\"]@yellowladder/(web-|mobile-|shared-web-ui|shared-mobile-ui)"; then
    WARNINGS+="WARNING: Backend file is importing a web/mobile lib. Backend cannot depend on frontend code. See .claude/rules/workspace-structure.md §Module Boundary Constraints.\n"
  fi
fi

# Web files cannot import backend/mobile libs
if [[ "$FILE_PATH" == *libs/web/* ]] || [[ "$FILE_PATH" == *apps/web-backoffice/* ]] || [[ "$FILE_PATH" == *libs/shared/web-ui/* ]]; then
  if echo "$CONTENT" | grep -qE "from\s+['\"]@yellowladder/(backend-|mobile-|shared-mobile-ui)"; then
    WARNINGS+="WARNING: Web file is importing a backend/mobile lib. Web cannot depend on backend or mobile code. Use shared/api for backend contracts. See .claude/rules/workspace-structure.md §Module Boundary Constraints.\n"
  fi
fi

# Mobile files cannot import backend/web libs
if [[ "$FILE_PATH" == *libs/mobile/* ]] || [[ "$FILE_PATH" == *apps/mobile-backoffice/* ]] || [[ "$FILE_PATH" == *libs/shared/mobile-ui/* ]]; then
  if echo "$CONTENT" | grep -qE "from\s+['\"]@yellowladder/(backend-|web-|shared-web-ui)"; then
    WARNINGS+="WARNING: Mobile file is importing a backend/web lib. Mobile cannot depend on backend or web code. Use shared/api for backend contracts. See .claude/rules/workspace-structure.md §Module Boundary Constraints.\n"
  fi
fi

# shared/api cannot import backend libs
if [[ "$FILE_PATH" == *libs/shared/api/* ]]; then
  if echo "$CONTENT" | grep -qE "from\s+['\"]@yellowladder/backend-"; then
    WARNINGS+="WARNING: shared/api is importing a backend lib. shared/api may only mirror REST contracts via shared/types. See .claude/rules/web.md §RTK Query Conventions.\n"
  fi
fi

# Cross-domain backend deep imports
if [[ "$FILE_PATH" == *libs/backend/*/* ]] && [[ "$FILE_PATH" != *libs/backend/infra/* ]]; then
  CURRENT_DOMAIN=$(echo "$FILE_PATH" | sed -E 's|.*libs/backend/([^/]+)/.*|\1|')
  if echo "$CONTENT" | grep -oE "from\s+['\"][^'\"]*libs/backend/[^/]+/" | grep -v "libs/backend/$CURRENT_DOMAIN/" | grep -v "libs/backend/infra/" >/dev/null; then
    WARNINGS+="WARNING: Cross-domain deep import detected. Cross-domain imports must go through barrels (@yellowladder/backend-{domain}-{submodule}), not relative paths. Cross-domain WRITES must use DomainEventPublisher. See .claude/rules/architecture.md §Cross-Domain Communication.\n"
  fi
fi

if [ -n "$WARNINGS" ]; then
  echo -e "$WARNINGS" | jq -Rs '{hookSpecificOutput:{hookEventName:"PostToolUse",additionalContext:.}}'
fi

exit 0
