---
description: TypeScript config conventions — required settings per platform, inheritance patterns, common mistakes
alwaysApply: false
paths:
  - '**/tsconfig*.json'
---

# TSConfig Conventions

## Three-Tier Inheritance

Every project uses a three-tier pattern:

```text
tsconfig.base.json (root)
  └─ tsconfig.json (project — solution-style, sets platform overrides)
       ├─ tsconfig.lib.json (library compilation)
       ├─ tsconfig.app.json (app compilation)
       └─ tsconfig.spec.json (test compilation — only when tests are scaffolded; deferred for the refactor)
```

- `tsconfig.base.json` is the single source of truth for shared settings. Do not duplicate base settings in project configs.
- Project `tsconfig.json` is solution-style: `"files": [], "include": []` with only `references` and platform-specific `compilerOptions` overrides.
- `tsconfig.lib.json` / `tsconfig.app.json` extend the project `tsconfig.json` and set compilation-specific options.
- **`tsconfig.spec.json`** is only created when tests are scaffolded. Testing is deferred during the refactor — most libs will not have a spec config.

## Base Config (`tsconfig.base.json`)

The base provides: `strict: true`, `noImplicitOverride: true`, `noImplicitReturns: true`, `noFallthroughCasesInSwitch: true`, `noUncheckedIndexedAccess: true`, `forceConsistentCasingInFileNames: true`, `module: "esnext"`, `moduleResolution: "bundler"`, `target: "es2022"`, `lib: ["es2022"]`, `isolatedModules: true`, `emitDecoratorMetadata: true`, `experimentalDecorators: true`.

Path aliases are sorted **alphabetically**. When adding a new alias, insert it in the correct alphabetical position.

## Per-Platform Overrides

### Backend libs (`libs/backend/**`) and Backend infra libs (`libs/backend/infra/**`)

**`tsconfig.json`** must set:

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "moduleResolution": "node",
    "strictPropertyInitialization": false
  }
}
```

- `strictPropertyInitialization: false` is required for NestJS dependency injection.
- `module: "commonjs"` and `moduleResolution: "node"` override the base for NestJS compatibility.

**`tsconfig.lib.json`** must set:

```json
{
  "compilerOptions": {
    "declaration": true,
    "types": ["node"]
  },
  "include": ["src/**/*.ts"],
  "exclude": [
    "jest.config.ts",
    "jest.config.cts",
    "src/**/*.spec.ts",
    "src/**/*.test.ts",
    "src/**/*.integration-spec.ts"
  ]
}
```

(Spec excludes are kept even though tests are deferred — they are harmless and avoid future churn.)

### Web libs (`libs/web/**`) and `shared/web-ui`

**`tsconfig.json`** must set:

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "allowJs": false,
    "lib": ["es2022", "dom", "dom.iterable"]
  }
}
```

- Inherits `module: "esnext"` and `moduleResolution: "bundler"` from base. **Do NOT override these.**
- **No `strictPropertyInitialization: false`** — web libs have no NestJS DI.

**`tsconfig.lib.json`** must include:

```json
{
  "compilerOptions": {
    "types": [
      "node",
      "vite/client",
      "@nx/react/typings/cssmodule.d.ts",
      "@nx/react/typings/image.d.ts"
    ]
  },
  "include": ["src/**/*.js", "src/**/*.jsx", "src/**/*.ts", "src/**/*.tsx"],
  "exclude": [
    "jest.config.ts",
    "jest.config.cts",
    "src/**/*.spec.ts",
    "src/**/*.test.ts",
    "src/**/*.spec.tsx",
    "src/**/*.test.tsx"
  ]
}
```

### Mobile libs (`libs/mobile/**`) and `shared/mobile-ui`

**`tsconfig.json`** must set:

```json
{
  "compilerOptions": {
    "jsx": "react-native",
    "moduleResolution": "node",
    "lib": ["es2022", "dom"]
  }
}
```

- Inherits `module: "esnext"` from base. **Do NOT set `module: "commonjs"`.**
- **No `strictPropertyInitialization: false`** — mobile libs have no NestJS DI.
- `lib: ["es2022", "dom"]` is required for DOM-like APIs (`setTimeout`, `fetch`, `URL`, etc.).

**`tsconfig.lib.json`** must include:

```json
{
  "compilerOptions": {
    "declaration": true,
    "types": ["node"]
  },
  "include": ["src/**/*.ts", "src/**/*.tsx"],
  "exclude": [
    "jest.config.ts",
    "jest.config.cts",
    "src/**/*.spec.ts",
    "src/**/*.spec.tsx",
    "src/**/*.test.ts",
    "src/**/*.test.tsx"
  ]
}
```

### Shared libs (`shared/types`, `shared/utils`, `shared/i18n`)

These are `platform:any` libs consumed by both backend and frontend.

**`tsconfig.json`** must set:

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "moduleResolution": "node"
  }
}
```

- CommonJS is needed for backend consumption. Bundlers (Vite/Metro) resolve source directly via path aliases and ignore the module setting.

### Shared client-only libs (`shared/api`, `shared/store`, `shared/web-ui`, `shared/mobile-ui`)

These are consumed only by web and/or mobile — never by the backend.

**`tsconfig.json`** inherits everything from base. **Do NOT** set `module: "commonjs"` or `moduleResolution: "node"`.

## Formatting Rules

- `references` arrays use multi-line format (one object per line), not single-line.
- `lib` values use lowercase: `"es2022"`, `"dom"`, `"dom.iterable"` — not `"ES2022"` or `"DOM"`.
- All configs use 2-space indentation.

## Common Mistakes to Avoid

1. **Adding `strictPropertyInitialization: false` to non-backend libs.** Only backend libs need this (for NestJS DI). Web, mobile, and shared libs must keep full strict mode.
2. **Setting `module: "commonjs"` on client-only libs.** `shared/api`, `shared/store`, web libs, and mobile libs should use `"esnext"` (inherited from base).
3. **Forgetting `jest.config.cts` in include/exclude patterns.** Both `.ts` and `.cts` extensions must be listed.
4. **Forgetting `src/**/*.test.tsx` in mobile/web lib excludes.** All test file extensions (`.spec.ts`, `.spec.tsx`, `.test.ts`, `.test.tsx`) must be excluded from lib compilation, even though tests are deferred.
5. **Missing `lib: ["es2022", "dom"]` in mobile libs.** Mobile libs need DOM types for `setTimeout`, `fetch`, etc.
6. **Adding path aliases out of alphabetical order in `tsconfig.base.json`.**
7. **Removing `noUncheckedIndexedAccess: true` because it's strict.** It is intentional — leave it on. Index access returns `T | undefined` and that's the safer default.
