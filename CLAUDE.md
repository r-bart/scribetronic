# scribetronic — AI Agent Guide

**For AI agents working ON this codebase** (the scribetronic CLI + skills package itself, not on user content generated through it). Keep this concise — only what Claude can't deduce from the code.

---

## What this project is

`scribetronic` is an npm package that ships:

1. A small Node CLI (`packages/cli/`) — commands: `init`, `style`, `list`, `info`
2. A bundle of 21 Claude Code skills (`.claude/skills/`) shipped as `templates/`
3. Editorial calendar templates (`templates/`) installed into user projects

Distributed as `scribetronic` on npm. Single package, no monorepo split.

---

## Architecture

**See `docs/ARCHITECTURE.md`** for full folder layout.

Single-package shape (Clean / DDD-lite):

```
packages/cli/src/
├── commands/        # CLI command handlers (init, style, list, info)
├── core/            # Domain logic — skill catalog, voice profile, calendar shape
├── infrastructure/  # FS access, npm metadata, prompts (inquirer)
└── index.ts         # Bin entrypoint
```

### Layer rule

```
commands → core ← infrastructure
```

Dependencies point inward. `core/` knows nothing about the filesystem, prompts, or argv parsing.

| Layer | Contains | Can import from |
|-------|----------|-----------------|
| `core/` | Skill metadata types, voice profile schema, planning logic | Nothing external |
| `infrastructure/` | FS, prompts, npm | `core/` |
| `commands/` | CLI handlers | `core/`, `infrastructure/` |

### Common violations to avoid

```ts
// Bad: core importing fs
import fs from 'node:fs'  // inside core/ — no

// Bad: command writing files directly
await fs.writeFile(...)  // commands should call infrastructure

// Good: command orchestrates, infrastructure executes
await skillInstaller.install(skills, target)
```

---

## Code Patterns

### Naming

- **Files**: `PascalCase` for classes/types, `camelCase` for utilities
- **Code**: `camelCase` vars/functions, `PascalCase` types
- **Unused**: prefix with `_`

### Errors

- `core/` throws typed domain errors (`VoiceProfileMissingError`, etc.)
- `commands/` catch and render friendly CLI output
- Never `process.exit()` from `core/`

### Async

- Always `await` — no floating promises
- Use `node:fs/promises`, never sync FS in hot paths

---

## Quality Checks

Run after every change:

```bash
cd packages/cli && npm run typecheck && npm run lint && npm test
```

- All code must pass type checking (no `any` without explicit reason)
- All code must pass linting
- Tests must pass before committing

---

## Workflow

| Task | Commands |
|------|----------|
| New feature | `/brief` → `/spec` → `/create-plan` → `/generate-tests` → `/execute-plan` → `/summary` → `/post-review` |
| Bug fix | `/brief` → fix → test → `/summary` → `/post-review` |
| Refactor | `/brief` → `/create-plan` → implement → `/summary` → `/post-review` |
| New skill | Add under `templates/.claude/skills/`, register in catalog, update `docs/skills.md` |

---

## Self-Improvement

After every significant correction, update this file:

```
"Update CLAUDE.md so you don't make that mistake again."
```

Keep rules concise, absolute (ALWAYS/NEVER), and concrete.

---

## Project Notes

Maintain notes in `thoughts/notes/` updated after every PR:
- Key decisions
- Patterns discovered
- Gotchas

---

## Open Source

This is an MIT-licensed open source project published to npm:

- `scribetronic` (CLI + skills bundle) — `packages/cli/`

### Conventions

- Conventional Commits: `feat:`, `fix:`, `docs:`, `chore:`, `ci:`
- Semantic Versioning via Keep a Changelog
- Branches: `develop` → `main` via PR
- CI: GitHub Actions (Node 18/20/22)
- Security: report via GitHub Security Advisories (`SECURITY.md`)
- Release: tag `v*.*.*` → GitHub Actions publishes to npm
- **Never include `Co-Authored-By:` lines in commit messages**

### Contributing philosophy

- Encourage **extending via new skills** over core PRs
- PRs welcome for: bug fixes, structural improvements, docs, CI
- Format ideas → propose as new long-form/short-form skills

---

## Prompting Tips

When stuck:

- **Re-plan**: "Enter plan mode and re-plan this approach"
- **Elegant fix**: "Knowing everything you know now, scrap this and implement the elegant solution"
- **Challenge**: "Grill me on these changes and don't approve until I pass"
- **Prove it**: "Prove to me this works by diffing behavior between main and this branch"

---

## References

- **docs/ARCHITECTURE.md** — Folder structure
- **docs/skills.md** — All 21 skills documented
- **docs/cli-reference.md** — Full CLI reference
- **AGENTS.md** — Quick start for AI agents
- **CONTRIBUTING.md** — Contributor guide
