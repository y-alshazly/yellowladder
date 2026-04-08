#!/usr/bin/env bash
# Hook: PostToolUse (Write|Edit) — Warn about multi-tenancy violations
# Yellow Ladder: RLS handles company_id scoping; CASL handles shop_id scoping in services.
# SystemPrismaService is restricted to SUPER_ADMIN operations.

set -euo pipefail

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // empty')

[ -z "$CONTENT" ] && exit 0
[ -z "$FILE_PATH" ] && exit 0

# Only check backend libs
if [[ "$FILE_PATH" != *libs/backend/* ]]; then
  exit 0
fi

WARNINGS=""

# SystemPrismaService without AuthorizationService protection
if echo "$CONTENT" | grep -qF 'SystemPrismaService'; then
  if ! echo "$CONTENT" | grep -qE 'AuthorizationService|requirePermission'; then
    WARNINGS+="WARNING: SystemPrismaService detected without AuthorizationService or requirePermission. It must only be used in services protected by CASL SUPER_ADMIN ability checks. See .claude/rules/architecture.md §Multi-Tenancy.\n"
  fi
fi

# Manual companyId filtering in services (RLS handles this)
if [[ "$FILE_PATH" == *.service.ts ]]; then
  if echo "$CONTENT" | grep -qE 'where\s*:\s*\{[^}]*companyId|where\s*:\s*\{[^}]*company_id'; then
    WARNINGS+="WARNING: Manual companyId filtering in a service. RLS handles company scoping automatically — do not filter by companyId in application code. See .claude/rules/architecture.md §Multi-Tenancy.\n"
  fi
fi

# Missing shop_id filter on shop-scoped queries (heuristic: check service files that mention 'shop' but not 'shopId IN')
if [[ "$FILE_PATH" == *.service.ts ]]; then
  if echo "$CONTENT" | grep -qE '\bshopId\b' && \
     ! echo "$CONTENT" | grep -qE 'shopId\s*:\s*\{\s*in\s*:|user\.shopIds|baseService\.scopeToShops'; then
    WARNINGS+="NOTE: This service references shopId but the shop-scoping check is unclear. Shop scoping is a service-layer concern (CASL, not RLS). Use 'where: { shopId: { in: user.shopIds } }' or the base service helper. See .claude/rules/architecture.md §Shop Scoping.\n"
  fi
fi

# \$queryRaw bypasses RLS
if echo "$CONTENT" | grep -qE '\$queryRaw\b|\$executeRaw\b'; then
  WARNINGS+="WARNING: \$queryRaw / \$executeRaw bypass RLS. Confirm the query enforces tenant scoping manually, or escalate to the architect. See .claude/rules/architecture.md §Security.\n"
fi

if [ -n "$WARNINGS" ]; then
  echo -e "$WARNINGS" | jq -Rs '{hookSpecificOutput:{hookEventName:"PostToolUse",additionalContext:.}}'
fi

exit 0
