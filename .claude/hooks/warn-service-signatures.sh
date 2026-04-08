#!/usr/bin/env bash
# Hook: PostToolUse (Write|Edit) — Warn if services import request DTOs
# Services should accept named repository input types (e.g., CreateMenuItemInput),
# not request DTO classes (e.g., CreateMenuItemDto).

set -euo pipefail

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // empty')

[ -z "$CONTENT" ] && exit 0
[ -z "$FILE_PATH" ] && exit 0

# Only check service files in backend libs
if [[ "$FILE_PATH" != *libs/backend/*.service.ts ]]; then
  exit 0
fi

WARNINGS=""

# Importing Create*Dto or Update*Dto classes (request DTOs)
if echo "$CONTENT" | grep -qE "import\s+\{[^}]*\b(Create|Update)\w+Dto\b"; then
  WARNINGS+="WARNING: Service is importing a request DTO class (Create*Dto / Update*Dto). Services should accept named repository input types (e.g., CreateMenuItemInput from the repository file). The controller calls Dto.toInput() before delegating to the service. See .claude/rules/backend.md §Data Flow and .claude/examples/canonical-service.ts.\n"
fi

# OK to import response DTOs (Get*Dto) for return type annotations? Actually no — services return raw entities,
# the controller calls toDto(). Warn if the service imports Get*Dto.
if echo "$CONTENT" | grep -qE "import\s+\{[^}]*\bGet\w+Dto\b"; then
  WARNINGS+="WARNING: Service is importing a response DTO class (Get*Dto). Services return raw entities; the controller calls Dto.toDto() to map the response. Remove the Get*Dto import from the service.\n"
fi

if [ -n "$WARNINGS" ]; then
  echo -e "$WARNINGS" | jq -Rs '{hookSpecificOutput:{hookEventName:"PostToolUse",additionalContext:.}}'
fi

exit 0
