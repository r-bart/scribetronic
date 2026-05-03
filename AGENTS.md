# AI Agents Guide

**For AI agents working on this codebase.** Keep this concise — only include what Claude can't deduce from code.

---

## Quick Start

> **Tip**: For parallel work, use git worktrees. See `docs/worktrees.md`.

1. Read `CLAUDE.md` for project-specific rules
2. Check existing patterns before creating new ones
3. Follow: brief → spec → create-plan → generate-tests → execute-plan → summary → post-review

---

## Architecture: Clean + DDD (lite)

**See `docs/ARCHITECTURE.md`** for project-specific structure.

### Layer rule

```
commands → core ← infrastructure
```

Inner layers (`core/`) know nothing about outer layers.

| Layer | Contains | Can Import From |
|-------|----------|-----------------|
| `core/` | Domain types, skill catalog, voice profile schema | Nothing external |
| `infrastructure/` | FS access, npm metadata, interactive prompts | `core/` |
| `commands/` | CLI handlers (`init`, `style`, `list`, `info`) | `core/`, `infrastructure/` |

### Common violations

```ts
// Bad: core importing fs
import fs from 'node:fs'  // inside core/ — never

// Bad: command writing files directly
await fs.writeFile(...)   // delegate to infrastructure

// Good: command orchestrates, infrastructure executes
await skillInstaller.install(skills, target)
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
