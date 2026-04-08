#!/usr/bin/env bash
# Hook: PreToolUse (Write|Edit) — Enforce thin-shell architecture
# Apps must not contain business logic — services, controllers, schemas live in libs/

set -euo pipefail

deny() {
  jq -n --arg r "$1" '{hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"deny",permissionDecisionReason:$r}}'
  exit 0
}

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // empty')

[ -z "$FILE_PATH" ] && exit 0
[ -z "$CONTENT" ] && exit 0

# Only check files inside apps/
if [[ "$FILE_PATH" != *apps/* ]]; then
  exit 0
fi

# Allow native config files in mobile apps
if [[ "$FILE_PATH" == *apps/mobile-backoffice/ios/* ]] || [[ "$FILE_PATH" == *apps/mobile-backoffice/android/* ]]; then
  exit 0
fi

# Block NestJS services in apps/
if echo "$CONTENT" | grep -qE '^\s*@Injectable\s*\('; then
  deny "Apps are thin shells. NestJS services (@Injectable) belong in libs/backend/{domain}/{submodule}/. See architecture.md §Thin Apps."
fi

# Block NestJS controllers in apps/
if echo "$CONTENT" | grep -qE '^\s*@Controller\s*\('; then
  deny "Apps are thin shells. NestJS controllers (@Controller) belong in libs/backend/{domain}/{submodule}/. See architecture.md §Thin Apps."
fi

# Block Zod schema exports in apps/
if echo "$CONTENT" | grep -qE 'export\s+const\s+\w+Schema\s*=\s*z\.'; then
  deny "Apps are thin shells. Zod schemas belong in libs/web/{domain}/ or libs/mobile/{domain}/. See architecture.md §Thin Apps."
fi

exit 0
