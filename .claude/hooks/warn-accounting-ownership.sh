#!/usr/bin/env bash
# Hook: PostToolUse (Write|Edit) — Warn when modifying accounting domain
# The Xero dual-mode accounting integration is owned by the accountant agent (when created).

set -euo pipefail

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

[ -z "$FILE_PATH" ] && exit 0

# Check files in the accounting integration sub-module or the xero infra lib
if [[ "$FILE_PATH" == *libs/backend/integrations/accounting/* ]] || \
   [[ "$FILE_PATH" == *libs/backend/infra/xero/* ]]; then
  MSG="WARNING: You are modifying accounting/Xero integration code. This domain is owned by the 'accountant' agent (when created). The Xero dual-mode resolver, sync pipeline, and OrderSyncLog are security-critical (per-company tracking categories must be preserved). Consider delegating to the accountant agent. See .claude/rules/architecture.md §Accounting (Xero) and .claude/agents/architect.md."
  echo "$MSG" | jq -Rs '{hookSpecificOutput:{hookEventName:"PostToolUse",additionalContext:.}}'
fi

exit 0
