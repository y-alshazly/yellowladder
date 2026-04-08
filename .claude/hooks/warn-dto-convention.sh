#!/usr/bin/env bash
# Hook: PostToolUse (Write|Edit) — Warn if DTOs are missing toInput()/toDto() methods

set -euo pipefail

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // empty')

[ -z "$CONTENT" ] && exit 0
[ -z "$FILE_PATH" ] && exit 0

# Only check DTO files in backend libs
if [[ "$FILE_PATH" != *libs/backend/*.dto.ts ]]; then
  exit 0
fi

WARNINGS=""
BASENAME=$(basename "$FILE_PATH")

# Request DTOs (create-*, update-*) should have static toInput()
if [[ "$BASENAME" == create-*.dto.ts ]] || [[ "$BASENAME" == update-*.dto.ts ]]; then
  if ! echo "$CONTENT" | grep -qE 'static\s+toInput\s*\('; then
    WARNINGS+="WARNING: Request DTO '$BASENAME' is missing 'static toInput()' method. Request DTOs must convert to named repository input types. See .claude/rules/backend.md §Request DTOs and .claude/examples/canonical-dto.ts.\n"
  fi
  if ! echo "$CONTENT" | grep -qE 'implements\s+\w+Request'; then
    WARNINGS+="WARNING: Request DTO '$BASENAME' should 'implements' its corresponding shared/types Request interface (e.g., CreateMenuItemDto implements CreateMenuItemRequest).\n"
  fi
fi

# Response DTOs (get-*) should have static toDto()
if [[ "$BASENAME" == get-*.dto.ts ]]; then
  if ! echo "$CONTENT" | grep -qE 'static\s+toDto\s*\('; then
    WARNINGS+="WARNING: Response DTO '$BASENAME' is missing 'static toDto()' method. Response DTOs must convert from Prisma entity to DTO. See .claude/rules/backend.md §Response DTOs and .claude/examples/canonical-dto.ts.\n"
  fi
  if ! echo "$CONTENT" | grep -qE 'implements\s+Get\w+Response'; then
    WARNINGS+="WARNING: Response DTO '$BASENAME' should 'implements' its corresponding shared/types Response interface (e.g., GetMenuItemDto implements GetMenuItemResponse).\n"
  fi
fi

if [ -n "$WARNINGS" ]; then
  echo -e "$WARNINGS" | jq -Rs '{hookSpecificOutput:{hookEventName:"PostToolUse",additionalContext:.}}'
fi

exit 0
