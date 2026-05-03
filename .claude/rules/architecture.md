# Architecture

Project rules for working ON the scribetronic codebase itself. (For rules that apply to projects scaffolded BY scribetronic, see `packages/cli/templates/claude-code/.claude/rules/`.)

## Project Shape

scribetronic is a TypeScript ESM monorepo. It ships a single CLI distributed as a binary that scaffolds AI-assisted project setups.

```
scribetronic/
├── packages/
│   └── cli/
│       ├── src/                    ← CLI source (commands → analyzers/generators → data)
│       │   ├── commands/           ← Command entry points (init, add, etc.)
│       │   ├── analyzers/          ← Read-side: detect frameworks, package managers, layout
│       │   ├── generators/         ← Write-side: render templates to disk
│       │   ├── data/               ← Static data and config
│       │   └── __tests__/          ← Tests adjacent to source (vitest)
│       ├── templates/
│       │   ├── claude-code/        ← `.claude/` payload installed into target projects
│       │   └── project/            ← Project-level files (CLAUDE.md, docs/, etc.)
│       └── package.json
├── docs/
│   ├── ARCHITECTURE.md             ← Authoritative folder map and conventions
│   └── contracts.md                ← Shared contracts between modules and templates
└── thoughts/                       ← Working notes, plans, state
```

There is **no UI layer and no database layer** — scribetronic is a pure CLI. Do not introduce one.

## Architectural Rules

- **Imports point inward.** `commands/` may import from `analyzers/`, `generators/`, `data/`. The reverse is forbidden. `analyzers/` and `generators/` must not import from `commands/`.
- **Analyzers are read-only.** They observe the host filesystem and return structured data. They never write.
- **Generators are write-only.** They take structured input and emit files. They never invoke analyzers — the command orchestrates the read→write flow.
- **Templates are data, not code.** Files under `packages/cli/templates/` must be copyable as-is. Do not import them from `src/`; load them via the filesystem at runtime.
- **Tests live next to source** in `__tests__/` directories. Mirror the source filename: `analyzers/foo.ts` → `analyzers/__tests__/foo.test.ts`.
- **Single source of truth for skill metadata.** When a skill template references a config key (e.g. quality command, entrypoint), the config file in `templates/project/` is canonical. Skills must read it; never hardcode duplicates.
- **No circular dependencies.** If two modules need each other, extract a third.

## Code Organization

- **Files**: PascalCase for type-bearing modules, camelCase for utilities, lowercase-kebab for CLI entry filenames.
- **Code**: camelCase variables and functions, PascalCase types and classes.
- **Unused params/destructures**: prefix with `_`.

## Quality Checks

Run after every change. All commands run inside `packages/cli/`:

```bash
cd packages/cli && npm run typecheck && npm run lint && npm test
```

See `.claude/rules/quality.md` for full details.

### Rules

- All code must pass `tsc --noEmit` (zero errors).
- All code must pass ESLint (zero warnings).
- All vitest tests must pass before committing.
- `npm run build` (tsup) must produce a valid `dist/`.
- No `any` types without an explicit `// @ts-expect-error` comment justifying it.
