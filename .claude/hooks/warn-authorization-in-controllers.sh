#!/usr/bin/env bash
# Hook: PostToolUse (Write|Edit) — Warn if authorization is in controllers/guards
# Yellow Ladder enforces authorization in services via CASL AuthorizationService.

set -euo pipefail

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // empty')

[ -z "$CONTENT" ] && exit 0
[ -z "$FILE_PATH" ] && exit 0

# Only check controller/guard files in backend libs
if [[ "$FILE_PATH" != *libs/backend/* ]]; then
  exit 0
fi

WARNINGS=""

# Authorization decorators in controllers
if [[ "$FILE_PATH" == *.controller.ts ]]; then
  if echo "$CONTENT" | grep -qE '@(RequirePermission|Permissions|Roles|RequireAbility)\s*\('; then
    WARNINGS+="WARNING: @RequirePermission/@Permissions/@Roles decorator detected in a controller. Yellow Ladder enforces authorization in services via AuthorizationService.requirePermission(). Use @CurrentAbility() to pass the ability to the service. See .claude/rules/architecture.md §Authorization Model.\n"
  fi
  if echo "$CONTENT" | grep -qE '\bability\s*\.\s*can\s*\('; then
    WARNINGS+="WARNING: ability.can() called in a controller. Authorization checks belong in services, not controllers. Pass @CurrentAbility() to the service and call AuthorizationService.requirePermission().\n"
  fi
fi

# Authorization guards
if echo "$CONTENT" | grep -qE '(PolicyGuard|AuthorizationGuard|RolesGuard|PermissionGuard)\b'; then
  WARNINGS+="WARNING: authorization guard reference detected. Yellow Ladder uses AuthenticationGuard (global, for auth only) — authorization happens in services. See .claude/rules/architecture.md §Authorization Model.\n"
fi

if [ -n "$WARNINGS" ]; then
  echo -e "$WARNINGS" | jq -Rs '{hookSpecificOutput:{hookEventName:"PostToolUse",additionalContext:.}}'
fi

exit 0
