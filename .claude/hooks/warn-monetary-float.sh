#!/usr/bin/env bash
# Hook: PostToolUse (Write|Edit) — Warn about float monetary amounts
# Money should be stored as integers (pence/cents), not floats.

set -euo pipefail

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // empty')

[ -z "$CONTENT" ] && exit 0
[ -z "$FILE_PATH" ] && exit 0

# Only check TypeScript and Prisma files in libs
if [[ "$FILE_PATH" != *.ts ]] && [[ "$FILE_PATH" != *.prisma ]]; then
  exit 0
fi
if [[ "$FILE_PATH" != *libs/* ]] && [[ "$FILE_PATH" != *apps/* ]]; then
  exit 0
fi

WARNINGS=""

MONETARY_FIELDS='price|amount|total|fee|cost|balance|payout|debit|credit|tip|discount|tax|subtotal|grandTotal'

# Float/Decimal in Prisma schema for monetary fields
if [[ "$FILE_PATH" == *.prisma ]]; then
  if echo "$CONTENT" | grep -qiE "(${MONETARY_FIELDS})\s+(Float|Decimal)"; then
    WARNINGS+="WARNING: Monetary field uses Float/Decimal in a Prisma model. Yellow Ladder stores money as integers (pence) — use Int. GBP 1.50 = 150 pence. See .claude/rules/backend.md.\n"
  fi
fi

# class-validator @IsNumber on monetary fields (should be @IsInt)
if [[ "$FILE_PATH" == *.dto.ts ]]; then
  # Look for @IsNumber() followed by a monetary field name within a few lines
  if echo "$CONTENT" | grep -B1 -E "(${MONETARY_FIELDS}):\s*number" | grep -qE '@IsNumber\(\)'; then
    WARNINGS+="WARNING: @IsNumber() on a monetary field. Use @IsInt() — money is stored as integers (pence). See .claude/rules/backend.md.\n"
  fi
fi

# parseFloat and toFixed(2) — common float-money smell
if echo "$CONTENT" | grep -qE 'parseFloat\s*\('; then
  WARNINGS+="WARNING: parseFloat() detected. If this is for monetary parsing, use parseInt() instead — money is stored as integers (pence).\n"
fi
if echo "$CONTENT" | grep -qE '\.toFixed\s*\(\s*2\s*\)'; then
  WARNINGS+="WARNING: toFixed(2) detected. If this is for monetary display, divide the integer pence value by 100 in formatting (Intl.NumberFormat handles this).\n"
fi

if [ -n "$WARNINGS" ]; then
  echo -e "$WARNINGS" | jq -Rs '{hookSpecificOutput:{hookEventName:"PostToolUse",additionalContext:.}}'
fi

exit 0
