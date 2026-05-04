# scribetronic — AI Agent Guide

**For AI agents working ON this codebase** (the scribetronic CLI + skills package itself, not on user content generated through it). Keep this concise — only what Claude can't deduce from the code.

---

## What this project is

`scribetronic` is an npm package that ships:

1. A small Node CLI (`packages/cli/`) — commands: `init`, `style`, `list`, `info`, `update`, `doctor`, `uninstall`
2. A bundle of 22 Claude Code skills, distributed via the [scribetronic-plugin](https://github.com/r-bart/scribetronic-plugin) marketplace (loaded by Claude Code at runtime, not copied to the user's project)
3. Editorial calendar templates (`templates/project/`) installed into user projects by `init`

The CLI also keeps the 22 skills bundled inside `templates/claude-code/.claude/skills/` as the source of truth for `list` / `info` and for syncing to the plugin repo on release.

Distributed as `scribetronic` on npm. Single package, no monorepo split.

---

## Architecture

**See `docs/ARCHITECTURE.md`** for full folder layout. `.claude/rules/architecture.md` is the in-repo rule file enforced during reviews.

Single-package shape:

```
packages/cli/src/
├── commands/    # CLI entry points (init, style, list, info) — orchestrate read→write
├── analyzers/   # Read-only project introspection (no writes)
├── generators/  # Write-only filesystem mutations (idempotent)
├── data/        # Skill registry + types loaded from templates/
└── index.ts     # Bin entrypoint
```

### Layer rule

```
commands → analyzers + generators + data
```

Dependencies point inward. `analyzers/` and `generators/` must not import from `commands/`. Generators never invoke analyzers — the command orchestrates the read→write flow.

| Layer | Contains | Can import from |
|-------|----------|-----------------|
| `data/` | Skill registry, types, template-resolution helpers | `glob`, `node:fs` (read-only) |
| `analyzers/` | Project introspection | `data/` |
| `generators/` | Template copy + scaffold | `data/` |
| `commands/` | CLI handlers | `analyzers/`, `generators/`, `data/` |

### Common violations to avoid

```ts
// Bad: generator calling an analyzer (commands orchestrate, generators just write)
import { detectProject } from '../analyzers/project'  // inside generators/ — no

// Bad: analyzer writing to disk
await fs.writeFile(...)  // analyzers are read-only

// Bad: importing templates as code
import skillBody from '../../templates/.../SKILL.md'  // templates are runtime data

// Good: command orchestrates, generator writes
const project = await analyze(target)
await templateCopier.copy(project, target)
```

---

## Code Patterns

### Naming

- **Files**: `PascalCase` for classes/types, `camelCase` for utilities
- **Code**: `camelCase` vars/functions, `PascalCase` types
- **Unused**: prefix with `_`

### Errors

- `analyzers/` and `data/` throw typed errors; never `process.exit()` from them
- `commands/` catch and render friendly CLI output
- `generators/` are idempotent — refuse to overwrite, don't crash on re-run

### Async

- Always `await` — no floating promises
- Use `node:fs/promises`, never sync FS in hot paths

### SKILL.md frontmatter (CRITICAL)

Bundled `templates/claude-code/.claude/skills/*/SKILL.md` files MUST contain ONLY these YAML frontmatter keys: `name`, `description`, `allowed-tools`, `argument-hint`. Any other key (e.g. `inherits`, `formats`, `cadence`, `length_target`, `applies_to`, `quota`) causes Claude Code to **silently reject the skill at load time** — the file appears in the bundle and the cache, but the slash command never registers. This bug is invisible in unit tests; only `/plugin install` + a Claude Code restart exposes it.

Operational metadata belongs in a `## Metadata` section at the top of the body (rendered as a bullet list), not in YAML.

After editing or adding any SKILL.md, run:

```bash
node scripts/normalize-skill-frontmatter.mjs
```

The script is idempotent — it only touches files that have non-spec keys.

### Skill content: format ↔ style decoupling (CRITICAL)

Skills under `templates/claude-code/.claude/skills/` are **format-only**. Never embed:

- Specific author or creator names
- References to specific posts, accounts, newsletters, or third-party content libraries
- The maintainer's own personal identifiers (real name, product names, internal project codenames, personal URLs)
- "X-style" labels that name a specific person ("<author>-style closer", "<author>-tag-line")

The single point of personalization is `writing-style/SKILL.md`, which ships as a **template the user fills in**. Every other skill remains universal — usable by any writer in any niche without editing.

When a skill needs to reference voice/tone/examples, it must say:

> "Voice and tone come from `writing-style/SKILL.md`."

Not embed the voice itself.

Detection is by **manual code review**, not by an automated allowlist or denylist of names. Keeping a ledger of forbidden names checked into the repo would defeat the purpose of removing them. Reviewers read every modified SKILL.md; anything name-shaped is rejected.

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
- **docs/skills.md** — All 22 skills documented
- **docs/cli-reference.md** — Full CLI reference
- **AGENTS.md** — Quick start for AI agents
- **CONTRIBUTING.md** — Contributor guide
