#!/usr/bin/env bash
# Hook: PreToolUse (Write|Edit) — Restrict .prisma schema and migrations to database-engineer
# Set DATABASE_ENGINEER=1 when running as the database-engineer agent to bypass.

set -euo pipefail

deny() {
  jq -n --arg r "$1" '{hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"deny",permissionDecisionReason:$r}}'
  exit 0
}

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

[ -z "$FILE_PATH" ] && exit 0

# Allow the database-engineer agent to write its own files
[ "${DATABASE_ENGINEER:-0}" = "1" ] && exit 0

# Block writes to any .prisma schema file
if [[ "$FILE_PATH" == *libs/backend/infra/database/src/prisma/*.prisma ]]; then
  deny "Prisma schema files are owned by the database-engineer agent. Describe the schema change you need and delegate to the database-engineer (see .claude/agents/database-engineer.md)."
fi

# Block writes to migration files
if [[ "$FILE_PATH" == *libs/backend/infra/database*migrations/*.sql ]]; then
  deny "Migration files are owned by the database-engineer agent. Describe the migration you need and delegate to the database-engineer (see .claude/agents/database-engineer.md)."
fi

# Block writes to seed scripts (also database-engineer's domain)
if [[ "$FILE_PATH" == *libs/backend/infra/database/src/prisma/seed/*.ts ]]; then
  deny "Seed scripts are owned by the database-engineer agent. Describe the seed data you need and delegate to the database-engineer."
fi

exit 0
