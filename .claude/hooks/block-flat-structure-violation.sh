#!/usr/bin/env bash
# Hook: PreToolUse (Write|Edit) — Enforce sub-module internal structure
# 1. No DDD layer directories (domain/, application/, infrastructure/, feature/) inside backend libs
# 2. No src/lib/ subdirectory — all source goes directly in src/
# 3. When a file-type subdirectory exists, additional files of that type must go inside it

set -euo pipefail

deny() {
  jq -n --arg r "$1" '{hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"deny",permissionDecisionReason:$r}}'
  exit 0
}

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

[ -z "$FILE_PATH" ] && exit 0

# Only check files inside libs/
if [[ "$FILE_PATH" != *libs/* ]]; then
  exit 0
fi

# --- Rule 1: No DDD layer directories in backend libs ---
if [[ "$FILE_PATH" == *libs/backend/* ]]; then
  if [[ "$FILE_PATH" =~ /(domain|application|infrastructure|feature)/ ]]; then
    deny "No DDD layer directories (domain/, application/, infrastructure/, feature/) in backend sub-modules. Yellow Ladder uses flat sub-module structure. See architecture.md §Sub-Module Architecture and workspace-structure.md."
  fi
fi

# --- Rule 2: No src/lib/ subdirectory ---
if [[ "$FILE_PATH" =~ /src/lib/ ]]; then
  deny "No src/lib/ subdirectory. All lib source goes directly in src/. See project.md §Coding Conventions."
fi

# --- Rule 3: File-suffix grouping ---
# Suffix → expected directory name. When 2+ files of the same type exist, they group into a subdirectory.
# This rule only blocks if the parent directory ALREADY has the grouping subdirectory.

declare -A SUFFIX_TO_DIR=(
  [".controller.ts"]="controllers"
  [".service.ts"]="services"
  [".repository.ts"]="repositories"
  [".dto.ts"]="dtos"
  [".event.ts"]="events"
  [".handler.ts"]="event-handlers"
  [".guard.ts"]="guards"
  [".middleware.ts"]="middleware"
  [".interceptor.ts"]="interceptors"
  [".gateway.ts"]="gateways"
  [".decorator.ts"]="decorators"
  [".component.tsx"]="components"
  [".screen.tsx"]="screens"
  [".hook.ts"]="hooks"
  [".schema.ts"]="schemas"
  [".slice.ts"]="slices"
  [".api.ts"]="apis"
  [".route.tsx"]="routes"
  [".navigator.tsx"]="navigators"
  [".provider.tsx"]="providers"
  [".theme.ts"]="themes"
)

BASENAME=$(basename "$FILE_PATH")
DIRNAME=$(dirname "$FILE_PATH")

for SUFFIX in "${!SUFFIX_TO_DIR[@]}"; do
  if [[ "$BASENAME" == *"$SUFFIX" ]]; then
    GROUP_DIR="${SUFFIX_TO_DIR[$SUFFIX]}"
    # Skip if file is already inside the grouping dir
    if [[ "$DIRNAME" == */"$GROUP_DIR" ]]; then
      continue
    fi
    # If grouping dir exists at the same level, this flat file is a violation
    if [ -d "$DIRNAME/$GROUP_DIR" ]; then
      deny "File '$BASENAME' must go inside '$GROUP_DIR/' because that subdirectory exists. Sub-module file-grouping convention: when 2+ files share a suffix, they group together. See architecture.md §Sub-Module Architecture."
    fi
  fi
done

# --- Rule 4: No shim re-export files ---
# Block files that only re-export from a subdirectory (e.g., a .controller.ts that just `export * from './controllers/'`)
# This is checked by content — if the file is tiny and only contains re-exports, it's a shim.
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // empty')
if [ -n "$CONTENT" ] && [[ "$BASENAME" != "index.ts" ]]; then
  LINE_COUNT=$(echo "$CONTENT" | grep -cE '\S' || true)
  if [ "$LINE_COUNT" -le 3 ] && echo "$CONTENT" | grep -qE "^\s*export\s+\*\s+from\s+['\"]\./[a-z-]+/?['\"]"; then
    deny "Shim re-export files are forbidden. The barrel (src/index.ts) is the only re-export file. See architecture.md §Sub-Module Architecture."
  fi
fi

exit 0
