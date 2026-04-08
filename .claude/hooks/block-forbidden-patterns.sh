#!/usr/bin/env bash
# Hook: PreToolUse (Write|Edit) — Block forbidden code patterns for Yellow Ladder
# Enforces project.md and architecture.md rules.

set -euo pipefail

deny() {
  jq -n --arg r "$1" '{hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"deny",permissionDecisionReason:$r}}'
  exit 0
}

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // empty')

[ -z "$CONTENT" ] && exit 0

BASENAME=$(basename "$FILE_PATH")

# --- No default exports (except framework config files) ---
FRAMEWORK_CONFIG=false
case "$BASENAME" in
  prisma.config.ts|playwright.config.ts|vite.config.ts|vite.config.mts|jest.config.ts|jest.config.js|\
  jest.config.cjs|jest.config.mjs|jest.config.cts|jest.preset.js|jest.setup.ts|jest.setup.js|\
  metro.config.js|babel.config.js|.babelrc.js|webpack.config.js|webpack.config.mjs|\
  tailwind.config.ts|tailwind.config.js|postcss.config.js|postcss.config.cjs|\
  commitlint.config.ts|commitlint.config.js|lint-staged.config.js|\
  .eslintrc.js|eslint.config.js|eslint.config.mjs)
    FRAMEWORK_CONFIG=true
    ;;
esac
# React Navigation root navigators are also exempt (framework requires default export sometimes)
if [[ "$BASENAME" == *.navigator.tsx ]]; then
  FRAMEWORK_CONFIG=true
fi
if [ "$FRAMEWORK_CONFIG" = false ] && echo "$CONTENT" | grep -qE '^\s*export\s+default\b'; then
  deny "No default exports. Use named exports only. See project.md §Coding Conventions."
fi

# --- No TypeScript enums ---
if echo "$CONTENT" | grep -qE '^\s*(export\s+)?enum\s+[A-Z]'; then
  deny "No TypeScript enums. Use \`as const\` objects with derived types. See project.md §Coding Conventions."
fi

# --- No \`any\` type ---
if echo "$CONTENT" | grep -qE ':\s+any\b|<any>|as\s+any\b'; then
  deny "No \`any\` type. Use \`unknown\` and narrow with type guards. See project.md §Coding Conventions."
fi

# --- No Next.js imports ---
if echo "$CONTENT" | grep -qE "from\s+['\"]next[/'\"]"; then
  deny "No Next.js. Yellow Ladder web is a React SPA built with Vite. See project.md §Important Reminders."
fi

# --- No Expo imports ---
if echo "$CONTENT" | grep -qE "from\s+['\"]expo[-/'\"]|from\s+['\"]expo['\"]"; then
  deny "No Expo. Mobile uses React Native bare workflow via @nx/react-native. See project.md §Important Reminders."
fi

# --- No TanStack Query (legacy mobile stack — being replaced) ---
if echo "$CONTENT" | grep -qE "from\s+['\"]@tanstack/react-query"; then
  deny "No TanStack Query. Use RTK Query from shared/api. See project.md §Important Reminders (replacing legacy mobile stack)."
fi

# --- No Zustand (legacy mobile stack — being replaced) ---
if echo "$CONTENT" | grep -qE "from\s+['\"]zustand"; then
  deny "No Zustand. Use Redux Toolkit slices from shared/store. See project.md §Important Reminders (replacing legacy mobile stack)."
fi

# --- No Drizzle / TypeORM ---
if echo "$CONTENT" | grep -qE "from\s+['\"](drizzle-orm|typeorm)"; then
  deny "No Drizzle/TypeORM. Yellow Ladder uses Prisma. See project.md §Important Reminders."
fi

# --- No @hot-updater/react-native (dropped from legacy) ---
if echo "$CONTENT" | grep -qE "from\s+['\"]@hot-updater"; then
  deny "No @hot-updater/react-native. All mobile releases via Fastlane. See project.md §Important Reminders (Constraint 10)."
fi

# --- No localStorage for tokens ---
if echo "$CONTENT" | grep -qE "localStorage\.(setItem|getItem)\s*\(\s*['\"].*[Tt]oken"; then
  deny "Never store tokens in localStorage. Web: access token in memory, refresh token in HttpOnly cookie. Mobile: react-native-keychain. See architecture.md §Security."
fi

# --- No \$queryRawUnsafe ---
if echo "$CONTENT" | grep -qF '$queryRawUnsafe'; then
  deny "Never use \$queryRawUnsafe with user input. Use parameterized queries via Prisma. Escalate to architect if you think you need raw SQL. See architecture.md §Security."
fi

# --- Hardcoded testing OTP 886644 (security hard-stop) ---
if echo "$CONTENT" | grep -qE "['\"]886644['\"]|\b886644\b"; then
  deny "Hardcoded OTP '886644' is forbidden (Constraint 12 — security hard-stop). The legacy testing OTP must NEVER appear in Yellow Ladder code. See project.md §Important Reminders."
fi

# --- No Paymob (Stripe only — Constraint 13) ---
if echo "$CONTENT" | grep -qiE "from\s+['\"].*paymob|paymob.*api|paymob.*key"; then
  deny "No Paymob. Yellow Ladder uses Stripe only (Constraint 13). See architecture.md §Migration Constraints."
fi

# --- No direct process.env in non-config libs ---
if [[ "$FILE_PATH" == *libs/* ]] && \
   [[ "$FILE_PATH" != *.env* ]] && \
   [[ "$FILE_PATH" != *config* ]] && \
   [[ "$FILE_PATH" != *libs/backend/infra/config/* ]] && \
   [[ "$FILE_PATH" != *libs/backend/infra/* ]]; then
  if echo "$CONTENT" | grep -qE 'process\.env\.'; then
    deny "Do not read process.env directly in libs. Use NestJS ConfigModule (backend) or env injection (frontend). See backend.md §Other Conventions."
  fi
fi

exit 0
