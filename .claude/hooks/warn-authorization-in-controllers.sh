#!/usr/bin/env bash
# Hook: PostToolUse (Write|Edit) — Warn if authorization is missing from services
# Yellow Ladder enforces RBAC in services via AuthorizationService.requirePermission().
# Controllers may use @RequirePermission(...) for early rejection, but services MUST
# still call requirePermission (non-HTTP entry points bypass the guard).

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

# Legacy CASL references — these APIs no longer exist
if echo "$CONTENT" | grep -qE '@CurrentAbility\b|\bAppAbility\b|\bAbilityFactory\b|@casl/prisma|mergeConditionsIntoWhere|ensureFieldsPermitted|pickPermittedFields|ensureConditionsMet'; then
  WARNINGS+="WARNING: Legacy CASL reference detected (@CurrentAbility / AppAbility / AbilityFactory / @casl/prisma / mergeConditionsIntoWhere / ensureFieldsPermitted / pickPermittedFields / ensureConditionsMet). Yellow Ladder uses RBAC now. Use @CurrentUser() to get AuthenticatedUser and call AuthorizationService.requirePermission(user, Permissions.XxxYyy). See .claude/rules/architecture.md §Authorization Model.\n"
fi

# Inline authorization logic in controllers
if [[ "$FILE_PATH" == *.controller.ts ]]; then
  if echo "$CONTENT" | grep -qE '\bauthorizationService\s*\.\s*requirePermission\s*\('; then
    WARNINGS+="WARNING: AuthorizationService.requirePermission() called directly in a controller. Authorization belongs in the service layer — controllers should forward @CurrentUser() to the service, and the service calls requirePermission(user, Permissions.XxxYyy). The @RequirePermission(...) decorator + RolesGuard is acceptable for early rejection, but services MUST still enforce. See .claude/rules/architecture.md §Authorization Model.\n"
  fi
  if echo "$CONTENT" | grep -qE '\buser\s*\.\s*role\s*===|\buser\s*\.\s*role\s*!==|\buser\.shopIds\.includes\s*\('; then
    WARNINGS+="WARNING: Manual role/shopIds check in a controller. Use @RequirePermission(Permissions.XxxYyy) on the handler for early rejection, and call AuthorizationService.requirePermission(user, ...) + assertShopAccess(user, shopId) / scopeWhereToUserShops(user, where) inside the service.\n"
  fi
fi

# Unknown authorization guard references (RolesGuard is the only valid one)
if echo "$CONTENT" | grep -qE '\b(PolicyGuard|AuthorizationGuard|PermissionGuard|AbilityGuard)\b'; then
  WARNINGS+="WARNING: Unknown authorization guard reference detected. Yellow Ladder uses AuthenticationGuard (global, auth only) + RolesGuard (global, reads @RequirePermission metadata). Authorization still lives in services. See .claude/rules/architecture.md §Authorization Model.\n"
fi

if [ -n "$WARNINGS" ]; then
  echo -e "$WARNINGS" | jq -Rs '{hookSpecificOutput:{hookEventName:"PostToolUse",additionalContext:.}}'
fi

exit 0
