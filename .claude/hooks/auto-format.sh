#!/usr/bin/env bash
# Hook: PostToolUse (Write|Edit) — Auto-format edited files with Prettier
# Silent and non-blocking. Errors are ignored.

set -euo pipefail

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

[ -z "$FILE_PATH" ] && exit 0
[ ! -f "$FILE_PATH" ] && exit 0

# Run Prettier silently. Never fail the hook on errors.
npx --no-install prettier --write "$FILE_PATH" >/dev/null 2>&1 || true

exit 0
