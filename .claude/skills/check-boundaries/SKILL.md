---
name: check-boundaries
description: Run Nx module boundary check and explain each violation with fix recommendations. Read-only.
disable-model-invocation: true
allowed-tools: Bash(npx nx *), Read, Grep
---

# Check Boundaries

Run Nx's `@nx/enforce-module-boundaries` lint rule across the workspace and explain each violation in plain English.

## Steps

1. **Run the boundary check:**
   ```bash
   npx nx run-many -t lint --all 2>&1 | grep -A2 enforce-module-boundaries || echo "No violations found"
   ```

2. **For each violation, output:**
   - **Source project:** the lib/app that has the offending import
   - **Source tags:** the Nx tags applied to the source
   - **Target project:** the lib being imported
   - **Target tags:** the Nx tags applied to the target
   - **Constraint violated:** which rule from `tsconfig.base.json` or the eslint config the import broke
   - **Why not allowed:** human-readable explanation referencing `.claude/rules/workspace-structure.md` §Module Boundary Constraints
   - **How to fix:** one of:
     - Remove the import
     - Use the barrel (`@yellowladder/...`) instead of a deep relative path
     - Move the imported code to `shared/types`, `shared/utils`, or another platform-agnostic lib
     - Fix the source/target tags
     - Use a domain event instead of a direct cross-domain service import

3. **Reference the constraint matrix:**

   | Source tag | May depend on |
   |---|---|
   | `type:app` | web, mobile, backend, infra, data-access, web-ui, mobile-ui, util, types, i18n |
   | `type:web` | data-access, web-ui, util, types, i18n |
   | `type:mobile` | data-access, mobile-ui, util, types, i18n |
   | `type:data-access` | util, types |
   | `type:backend` | backend, infra, util, types |
   | `type:infra` | infra, util, types |
   | `type:web-ui` | util, types |
   | `type:mobile-ui` | util, types |
   | `type:util` | types |
   | `type:types` | (none — leaf node) |
   | `type:i18n` | types |

   Plus **platform separation constraints:**
   - `platform:web` cannot depend on `platform:server` or `platform:mobile`
   - `platform:mobile` cannot depend on `platform:server` or `platform:web`
   - `platform:server` cannot depend on `platform:web` or `platform:mobile`

4. **Print a summary:**
   ```
   Boundary check: {N} violations across {M} libs
   - {libs affected}
   ```

## Common violations and fixes

| Violation | Fix |
|---|---|
| Backend lib imports from `@yellowladder/web-*` | Remove the import. If the type is needed, move it to `shared/types`. |
| Web lib imports from `@yellowladder/backend-*` | Remove the import. Use `shared/api` (RTK Query) for API calls. |
| Backend domain A imports backend domain B's service for a write | Replace with a domain event via `DomainEventPublisher`. See `add-domain-event` skill. |
| Backend domain A imports backend domain B's repository | If reading: import via the barrel (`@yellowladder/backend-{domain-B}-{submodule}`). If writing: use a domain event. |
| Deep relative import (`../../../other-lib/src/foo`) | Use the barrel: `@yellowladder/{lib-name}` from `tsconfig.base.json` |
| Mobile lib imports `shared/web-ui` | Use `shared/mobile-ui` instead — or move the shared piece to `shared/types`/`shared/utils` |

## Hard rules

- **READ-ONLY** — this skill never modifies files
- **Run on the full workspace** unless the user explicitly scopes to specific projects
- **Always reference the constraint matrix** so the user understands WHY the rule exists

## Hand-off

After the boundary check:
- For each violation, suggest which engineer agent should fix it (`backend-engineer`, `web-engineer`, `mobile-engineer`)
- For violations that need architectural input (e.g., "should this lib type be moved to shared/types?"), escalate to `architect`
