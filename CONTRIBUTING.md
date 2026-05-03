# Contributing to scribetronic

Thanks for your interest. scribetronic is a small, opinionated toolkit — contributions are welcome, especially around new skills, bug fixes, and docs.

This guide covers the workflow. For project conventions, see [CLAUDE.md](./CLAUDE.md) and [AGENTS.md](./AGENTS.md).

---

## Table of Contents

- [Ways to contribute](#ways-to-contribute)
- [Issue → PR flow](#issue--pr-flow)
- [Development setup](#development-setup)
- [Commit conventions](#commit-conventions)
- [Adding a new skill](#adding-a-new-skill)
- [Code style](#code-style)
- [Testing](#testing)
- [Releasing](#releasing)
- [Code of Conduct](#code-of-conduct)

---

## Ways to contribute

- **Bug reports** — open an issue with reproduction steps
- **Bug fixes** — small PRs welcome, no issue needed
- **New skills** — propose via issue first to align on format and naming
- **Docs improvements** — typos, clarifications, examples
- **CI / tooling** — improvements to dev experience

For larger features, please open an issue first to discuss the approach.

---

## Issue → PR flow

1. **Open an issue** (or comment on an existing one) describing the problem or feature
2. **Wait for triage** — a maintainer will tag it and confirm the direction
3. **Fork and branch** off `develop`:
   ```bash
   git checkout -b feat/your-feature develop
   ```
4. **Implement** with tests
5. **Open a PR** against `develop` with a clear description and a link to the issue
6. **CI runs** — typecheck, lint, tests must pass
7. **Review** — address feedback, squash if asked
8. **Merge** — maintainer merges; release follows the normal cadence

---

## Development setup

Requires Node 18+.

```bash
git clone https://github.com/r-bart/scribetronic.git
cd scribetronic/packages/cli
npm install
npm run dev
```

The `dev` script runs the CLI in watch mode against a sandbox project.

### Useful scripts

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm run lint:fix    # eslint --fix
npm test            # vitest run
npm run test:watch  # vitest
npm run build       # build the dist
```

Run all checks before pushing:

```bash
npm run typecheck && npm run lint && npm test
```

---

## Commit conventions

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add /short-form-poll skill
fix: handle missing writing-style profile in /agenda
docs: clarify init flow in README
chore: bump dependencies
ci: add Node 22 to test matrix
refactor: extract skill catalog loader
test: cover voice-extract edge cases
```

**Do not** include `Co-Authored-By:` lines in commit messages.

---

## Adding a new skill

1. Create the skill file under `templates/.claude/skills/<skill-name>.md`
2. Add metadata to the catalog (`packages/cli/src/core/skillCatalog.ts`)
3. Update `docs/skills.md` with the new entry
4. Add a CHANGELOG entry under `## [Unreleased]`
5. If the skill produces or consumes shared state (e.g., voice profile), document the contract clearly

Skill naming conventions:
- `/long-form-<format>` for full pieces
- `/short-form-<format>` for derivatives
- Single-word names for orchestrators (`/agenda`, `/write`)
- Verb-noun for utilities (`/editing-pass`, `/style-extract`)

---

## Code style

- **TypeScript strict mode** — no `any` without an explicit reason and a `// reason:` comment
- **Naming**: `camelCase` for vars/functions, `PascalCase` for types and classes
- **Files**: PascalCase for classes/types, camelCase for utilities
- **Unused parameters**: prefix with `_`
- **Imports**: prefer `node:` prefix for built-ins (`node:fs`, `node:path`)
- **Errors**: throw typed domain errors from `core/`, render them in `commands/`

---

## Testing

- Unit tests for all `core/` logic
- Integration tests for CLI commands using temp directories
- Use Vitest. Snapshot tests are fine for deterministic output

```bash
npm test
```

Aim for meaningful coverage on new code. We don't enforce a percentage but PRs without tests for new logic will be asked to add them.

---

## Releasing

Maintainers only.

1. Merge `develop` → `main` via PR
2. Update `CHANGELOG.md` — move `[Unreleased]` items into the new version section
3. Bump version: `npm version <patch|minor|major>` in `packages/cli/`
4. Push tag: `git push --tags`
5. GitHub Actions publishes to npm

---

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](./CODE_OF_CONDUCT.md).

---

## Questions?

Open a [discussion](https://github.com/r-bart/scribetronic/discussions) or an issue. We try to respond within a few days.
