#!/usr/bin/env bash
# Hook: SessionStart — Print Yellow Ladder project context

cat <<'EOF'
Yellow Ladder | Multi-tenant POS & restaurant management platform

Migrating from legacy Tappd (Express + TypeORM) to NestJS 11 + Prisma 7 + PostgreSQL 15.
Two-level tenancy (Company → Shop). RBAC with 5 fixed roles in RolePermissionRegistry. Modular monolith.

- 6 backend domains (Identity, Catalog, Ordering, Payment, Operations, Integrations)
- 21 sub-module libs + 12 infra libs + 6 web + 5 mobile + 7 shared = 51 total libs
- Apps: core-service, web-backoffice, mobile-backoffice (NO public apps)
- Stack: NestJS 11, Prisma 7, React 19 + Vite, RN 0.79 + Paper, RTK + RTK Query, MUI 7
- Cloud: GCP (Cloud Run, Cloud SQL europe-west2, Workload Identity)

Conventions live in .claude/rules/. 13 hard constraints documented in architecture.md.
Engineer agents: backend, database, web, mobile, code-reviewer + advisory architect.

⚠️ Pre-RLS blockers OPEN: see .claude/rules/pre-rls-blockers.md
⚠️ Legacy hardcoded testing OTP must be removed before non-dev shipping (Constraint 12)
EOF
