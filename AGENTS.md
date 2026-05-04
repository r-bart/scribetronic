# AI Agents Guide

**For AI agents working on this codebase.** Keep this concise — only include what Claude can't deduce from code.

---

## Quick Start

> **Tip**: For parallel work, use git worktrees. See `docs/worktrees.md`.

1. Read `CLAUDE.md` for project-specific rules
2. Check existing patterns before creating new ones
3. Follow: brief → spec → create-plan → generate-tests → execute-plan → summary → post-review

---

## Architecture

**See `docs/ARCHITECTURE.md`** for the canonical folder map and `.claude/rules/architecture.md` for the enforced rules.

### Layer rule

```
commands → analyzers + generators + data
```

`analyzers/` are read-only. `generators/` are write-only. Neither imports from `commands/`. Generators never call analyzers — the command orchestrates the read→write flow.

| Layer | Contains | Can Import From |
|-------|----------|-----------------|
| `data/` | Skill registry, types, template-resolution helpers | `glob`, `node:fs` (read-only) |
| `analyzers/` | Project introspection (read-only) | `data/` |
| `generators/` | Template copy + scaffold (write-only, idempotent) | `data/` |
| `commands/` | CLI handlers (`init`, `style`, `list`, `info`) | `analyzers/`, `generators/`, `data/` |

### Common violations

```ts
// Bad: analyzer writing to disk
await fs.writeFile(...)   // analyzers are read-only

// Bad: generator calling an analyzer
import { detect } from '../analyzers/project'  // commands orchestrate

// Bad: importing templates as code
import skillBody from '../../templates/.../SKILL.md'  // load at runtime
```

---

## Code Patterns

### Skill catalog

- Skills live under `templates/.claude/skills/`
- Metadata is read at build time and bundled into a manifest
- The `list` and `info` commands consume the manifest, not the FS directly

### Voice profile

- `/writing-style` skill produces a profile file
- Other skills read from it — never duplicate voice rules across skills

---

## Naming

- **Files**: PascalCase for classes/types, camelCase for utilities
- **Code**: camelCase vars/functions, PascalCase types
- **Unused**: prefix with `_`

---

## Quality Checks

```bash
cd packages/cli && npm run typecheck && npm run lint && npm test
```

Run after every change.

---

## Workflow

| Task | Commands |
|------|----------|
| New feature | `/brief` → `/spec` → `/create-plan` → `/generate-tests` → `/execute-plan` → `/summary` → `/post-review` |
| Bug fix | `/brief` → fix → test → `/summary` → `/post-review` |
| Refactor | `/brief` → `/create-plan` → implement → `/summary` → `/post-review` |

> **Tip**: `/brief` for session orientation. `/summary` to document changes. `/checkpoint` to save progress.

---

## Self-Improvement

**After every significant correction**, update `CLAUDE.md`:

```
"Update CLAUDE.md so you don't make that mistake again."
```

---

## Open Source

This is an open source project (MIT) published to npm as `scribetronic`.

### Conventions

- Conventional Commits: `feat:`, `fix:`, `docs:`, `chore:`, `ci:`
- Semantic Versioning via Keep a Changelog
- Branches: `develop` → `main` via PR
- CI: GitHub Actions (Node 18/20/22)
- Security: GitHub Security Advisories (`SECURITY.md`)
- Release: tag `v*.*.*` → GitHub Actions publishes to npm
- **Never include `Co-Authored-By:` lines in commit messages**

---

## References

- **CLAUDE.md** — Project rules
- **docs/ARCHITECTURE.md** — Folder structure
- **docs/skills.md** — Skill reference
- **docs/cli-reference.md** — CLI reference
- **CONTRIBUTING.md** — Contributor guide
