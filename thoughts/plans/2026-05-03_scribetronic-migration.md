# Implementation Plan: Scribetronic Migration (devtronic-shaped)

**Date**: 2026-05-03
**Status**: Draft

---

## Overview

Extract the writing skill set currently living in `rbart-astro/.claude/skills/writing/` and `rbart-astro/thoughts/writing/` into a standalone OSS-grade project at `100-projects/24.scribetronic/` that mirrors the structure of `r-bart/devtronic`: monorepo with a publishable npm CLI (`packages/cli/`), `templates/` for Claude Code workspace + project scaffolding, full OSS docs, self-dogfooded `.claude/`, and `thoughts/` scratchpad.

After migration, `rbart-astro` consumes scribetronic via `npx scribetronic init` (or local link during dev), keeping only project-owned content (`thoughts/writing/calendar/`, `thoughts/writing/ideas/`, `src/content/blog/`).

## Requirements

- [ ] Repo `24.scribetronic/` matches devtronic's top-level layout (root files, `packages/cli/`, `templates/`, `docs/`, `thoughts/`, `.claude/`, `.github/`).
- [ ] CLI built with TypeScript + tsup, distributed as npm package `scribetronic` with `bin: scribetronic`.
- [ ] All current writing skills converted from flat `<name>.md` to devtronic's `<name>/SKILL.md` folder format.
- [ ] `/agenda`, `/write`, `/write-publish` and all 14 type-skills functional after migration (parity with current rbart-astro behaviour).
- [ ] `scribetronic init <project-root>` scaffolds `thoughts/writing/calendar/` and `thoughts/writing/ideas/` from templates.
- [ ] OSS files present: `LICENSE` (MIT), `README.md`, `CHANGELOG.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, `AGENTS.md`, `RECOMMENDED-SKILLS.md`, `CLAUDE.md`.
- [ ] `docs/` populated: `ARCHITECTURE.md`, `philosophy.md`, `cli-reference.md`, `customization.md`, `skills.md`, `tutorials/` (≥3).
- [ ] `rbart-astro` cleaned: writing skills removed from `.claude/skills/`, `CLAUDE.md` updated to reference scribetronic, content/calendar files preserved unchanged.
- [ ] Build passes (`npm run build` in `packages/cli/`), tests pass (vitest), lint clean.
- [ ] End-to-end smoke test: install local CLI link in rbart-astro, run `/agenda today`, confirm output matches pre-migration behaviour.

---

## Approach Analysis

### Option A: Big-bang monorepo at project root

**Description**: Create `24.scribetronic/` with full devtronic shape (monorepo, CLI, OSS files, docs) in a single multi-phase plan. Migrate rbart-astro at the end.

**Pros**:
- One coherent plan, no half-states.
- The "devtronic shape" is the explicit user request — match the spec, don't trim.
- Can dogfood scribetronic's own development with its own (still-empty) `.claude/`.

**Cons**:
- Larger surface area. Higher chance of contract drift between parallel agents.
- CLI scaffolding is unfamiliar territory if we want to mirror devtronic's `commander + @clack/prompts + tsup` toolchain exactly.

**Complexity**: High

### Option B: Phased graduation

**Description**: Phase 1 build minimal repo (skills + templates + bash scaffolder, no CLI). Phase 2 graduate to monorepo with TS CLI later.

**Pros**:
- Lower risk per phase. Can validate the abstraction with rbart-astro before paying CLI cost.

**Cons**:
- User explicitly asked for "misma estructura de devtronic" — this option re-litigates that decision.
- Defers decisions (skill folder format, monorepo) that we'd just have to make later anyway.

**Complexity**: Medium

### Recommendation

**Option A** — user spec is explicit. Manage risk via Shared Contracts (see below) and tight phase scoping rather than by descoping the target shape.

---

## Shared Contracts (CRITICAL — read before any task)

Multiple parallel subagents will produce files that reference each other. Drift here = broken pipeline. Every agent in every phase MUST receive these contracts verbatim.

### CC1 — Repo identity

| Key | Value |
|---|---|
| npm package name | `scribetronic` |
| CLI bin name | `scribetronic` |
| GitHub repo | `r-bart/scribetronic` (TBD; placeholder until created) |
| License | MIT |
| Author | Roberto Díaz (rbart) |
| Engines | node >=18 |
| Initial version | `0.1.0` |

### CC2 — Top-level layout (must match this exactly)

```
24.scribetronic/
├── .claude/                              ← self-dogfood (empty for v0.1, devtronic-help-equivalent)
│   ├── rules/{architecture.md, quality.md}
│   ├── settings.json
│   └── skills/
│       └── scribetronic-help/SKILL.md
├── .github/                              ← (empty for v0.1, .gitkeep)
├── docs/
│   ├── ARCHITECTURE.md
│   ├── philosophy.md
│   ├── cli-reference.md
│   ├── customization.md
│   ├── skills.md
│   ├── contracts.md                      ← the 8 writing-pipeline contracts
│   └── tutorials/{01-new-project.md, 02-existing-project.md, 03-weekly-flow.md, README.md}
├── packages/
│   └── cli/
│       ├── .gitignore
│       ├── README.md
│       ├── eslint.config.js
│       ├── package.json
│       ├── tsconfig.json
│       ├── src/
│       │   ├── index.ts                  ← bin entrypoint
│       │   ├── commands/{init.ts, list.ts, info.ts}
│       │   ├── analyzers/project.ts
│       │   ├── generators/templateCopier.ts
│       │   └── data/skills.ts
│       └── templates/
│           ├── claude-code/.claude/{agents,rules,skills}/...
│           └── project/thoughts/writing/{calendar,ideas}/...
├── thoughts/
│   ├── plans/                            ← this plan lives here
│   └── notes/
├── .gitignore
├── AGENTS.md
├── CHANGELOG.md
├── CLAUDE.md
├── CODE_OF_CONDUCT.md
├── CONTRIBUTING.md
├── LICENSE
├── README.md
├── RECOMMENDED-SKILLS.md
└── SECURITY.md
```

### CC3 — Skill folder format (devtronic convention)

Each skill is a folder containing `SKILL.md` with frontmatter:

```markdown
---
name: <skill-name>
description: <one-line>
inherits: <relative-path-to-other-SKILL.md>   ← optional
length_target: <words or N/A>
cadence: <weekly | monthly | ad-hoc | N/A>
---

# <skill-name>

[body]
```

`name:` MUST equal the folder name. `inherits:` MUST be a path relative to the skill's own folder (e.g. `../writing-style/SKILL.md`).

Path examples (in templates):
- User-invocable orchestrators → `templates/claude-code/.claude/skills/<name>/SKILL.md`
  - `agenda/SKILL.md`, `write/SKILL.md`, `write-publish/SKILL.md`
- Shared style/quality skills → `templates/claude-code/.claude/skills/<name>/SKILL.md`
  - `writing-style/SKILL.md`, `editing-pass/SKILL.md`, `ai-slop-check/SKILL.md`, `style-extract/SKILL.md`
- Type templates (long-form) → `templates/claude-code/.claude/skills/long-form-<name>/SKILL.md`
  - `long-form-weekly-newsletter/SKILL.md`, `long-form-monthly-devlog/SKILL.md`, `long-form-hot-take/SKILL.md`, `long-form-how-to/SKILL.md`, `long-form-launch-retro/SKILL.md`, `long-form-manifesto/SKILL.md`
  - **NOT** migrated: `long-form-weekly-bip` (legacy, dropped — see Resolved Decisions §4)
- Type templates (short-form) → `templates/claude-code/.claude/skills/short-form-<name>/SKILL.md`
  - `short-form-x-vs-y/SKILL.md`, `short-form-listicle/SKILL.md`, `short-form-observation/SKILL.md`, `short-form-motivational/SKILL.md`, `short-form-present-vs-future/SKILL.md`, `short-form-thread-from-longform/SKILL.md`, `short-form-carousel-li/SKILL.md`, `short-form-voice-adjustments/SKILL.md`

**Rationale for flat naming with `long-form-` / `short-form-` prefix:** devtronic's distributed templates use a flat `skills/<name>/SKILL.md` layout (no nested subdirs). We preserve the long/short distinction via the prefix instead of by directory nesting.

### CC4 — Project template layout (what `scribetronic init` copies)

Source: `packages/cli/templates/project/`
Destination (consumer project root): copied to `<project>/`

```
templates/project/thoughts/writing/
├── README.md                              ← user guide (copied verbatim)
├── publish-config.example.yaml            ← renamed to publish-config.yaml on init
├── calendar/
│   ├── README.md
│   ├── index.md
│   ├── rules.example.yaml                 ← renamed to rules.yaml on init
│   ├── history.md                         ← starts empty (with header only)
│   └── archive/.gitkeep
└── ideas/
    ├── README.md
    └── <14 type files>.md
```

`scribetronic init` MUST refuse to overwrite existing files (idempotent, safe to re-run).

### CC5 — The 8 writing-pipeline contracts (carry over unchanged)

Already canonical in `rbart-astro/.claude/skills/writing/README.md`. Move verbatim to `docs/contracts.md`. Re-state here for parallel-agent reference:

1. **ISO week ID**: `YYYY-WNN` from `date +%G-W%V` (NOT `%Y-W%V`).
2. **Week directory layout**: `thoughts/writing/calendar/<YYYY-WNN>/{plan.md, newsletter.md, derivatives/}`.
3. **plan.md schema**: markdown table `| Date | Day | Type | Slug | Platform | Source | Status |`.
4. **history.md**: append-only markdown table; rows added by `/write` (status `ready`) and `/write-publish` (status `published`).
5. **rules.yaml**: cadence config; resolution order `plan beats rules, skip beats both`.
6. **Draft frontmatter**: newsletter and derivative formats specified in `docs/contracts.md` §6.
7. **Source-of-truth rule**: config files (`rules.yaml`, `publish-config.yaml`) win over hardcoded values; skills MUST read keys, never hardcode.
8. **Ideas pool**: writer-owned, no skill writes; promotion is manual copy-paste.

### CC6 — CLI command surface (v0.1)

```bash
scribetronic init [path]      # scaffold project templates (does NOT seed writing-style)
scribetronic style            # seed writing-style/SKILL.md if missing, else open in $EDITOR
scribetronic style --reset    # overwrite with seed (confirms first)
scribetronic list             # list bundled skills
scribetronic info <skill>     # show one skill's metadata
scribetronic --version
scribetronic --help
```

`scribetronic style` resolution:
1. If `<cwd>/.claude/skills/writing-style/SKILL.md` does not exist → copy from `<cli>/templates/claude-code/.claude/skills/writing-style/SKILL.md`, print created path, exit.
2. If exists and `--reset` passed → confirm via `@clack/prompts`, then overwrite.
3. If exists and no flag → spawn `${EDITOR:-${VISUAL:-vi}}` with the file path; if non-interactive (no TTY), print the path and exit 0.

Out of scope for v0.1: `add`, `addon`, `update`, `doctor`, `regenerate`, `uninstall`, `mode`, `diff`, `status`. (Future work; tracked in CHANGELOG roadmap.)

### CC7 — CLI tech stack (lock to match devtronic)

```json
{
  "type": "module",
  "engines": { "node": ">=18" },
  "dependencies": {
    "@clack/prompts": "^1.0.1",
    "chalk": "^5.3.0",
    "commander": "^12.1.0",
    "glob": "^13.0.6"
  },
  "devDependencies": {
    "@eslint/js": "^9.39.2",
    "@types/node": "^22.0.0",
    "eslint": "^9.39.2",
    "tsup": "^8.3.0",
    "typescript": "^5.7.0",
    "typescript-eslint": "^8.56.1",
    "vitest": "^4.0.18"
  }
}
```

Build: `tsup src/index.ts --format esm --dts --clean`. Test: `vitest run`. Lint: `eslint src/`.

### CC8 — Templates → consumed paths (post-init, in consumer project)

| Template source | Consumer destination |
|---|---|
| `templates/claude-code/.claude/skills/agenda/SKILL.md` | `<project>/.claude/skills/agenda/SKILL.md` |
| `templates/claude-code/.claude/skills/write/SKILL.md` | `<project>/.claude/skills/write/SKILL.md` |
| `templates/claude-code/.claude/skills/long-form-<type>/SKILL.md` | `<project>/.claude/skills/long-form-<type>/SKILL.md` |
| `templates/project/thoughts/writing/calendar/rules.example.yaml` | `<project>/thoughts/writing/calendar/rules.yaml` |
| `templates/project/thoughts/writing/calendar/publish-config.example.yaml` | `<project>/thoughts/writing/calendar/publish-config.yaml` |
| `templates/project/thoughts/writing/ideas/<file>.md` | `<project>/thoughts/writing/ideas/<file>.md` |

**Source-of-truth rule (per CC5#7):** all skills inside `.claude/skills/` reference paths under `thoughts/writing/calendar/` as relative-to-project-root. They MUST NOT hardcode the project root path.

---

## Files to Create/Modify

| File | Action | Purpose |
|---|---|---|
| `24.scribetronic/.gitignore` | Create | Node, dist, .DS_Store |
| `24.scribetronic/LICENSE` | Create | MIT |
| `24.scribetronic/README.md` | Create | OSS landing |
| `24.scribetronic/CLAUDE.md` | Create | Self-dogfood guide |
| `24.scribetronic/AGENTS.md` | Create | AI-agent guide |
| `24.scribetronic/CHANGELOG.md` | Create | v0.1.0 entry |
| `24.scribetronic/CONTRIBUTING.md` | Create | OSS contrib guide |
| `24.scribetronic/CODE_OF_CONDUCT.md` | Create | CoC (Contributor Covenant 2.1) |
| `24.scribetronic/SECURITY.md` | Create | Vuln reporting |
| `24.scribetronic/RECOMMENDED-SKILLS.md` | Create | Curated companions |
| `24.scribetronic/.claude/rules/{architecture,quality}.md` | Create | Self-rules |
| `24.scribetronic/.claude/settings.json` | Create | Self CC settings |
| `24.scribetronic/.claude/skills/scribetronic-help/SKILL.md` | Create | Self-help skill |
| `24.scribetronic/.github/.gitkeep` | Create | Placeholder |
| `24.scribetronic/docs/ARCHITECTURE.md` | Create | Repo layout doc |
| `24.scribetronic/docs/philosophy.md` | Create | Why scribetronic |
| `24.scribetronic/docs/cli-reference.md` | Create | All commands |
| `24.scribetronic/docs/customization.md` | Create | Override guide |
| `24.scribetronic/docs/skills.md` | Create | Skill catalog |
| `24.scribetronic/docs/contracts.md` | Create | The 8 contracts (CC5) |
| `24.scribetronic/docs/tutorials/{README,01,02,03}.md` | Create | Walkthroughs |
| `24.scribetronic/thoughts/plans/2026-05-03_*.md` | Create | This plan |
| `24.scribetronic/thoughts/notes/.gitkeep` | Create | Placeholder |
| `24.scribetronic/packages/cli/package.json` | Create | npm manifest |
| `24.scribetronic/packages/cli/tsconfig.json` | Create | TS config |
| `24.scribetronic/packages/cli/eslint.config.js` | Create | Lint config |
| `24.scribetronic/packages/cli/.gitignore` | Create | dist, node_modules |
| `24.scribetronic/packages/cli/README.md` | Create | Package readme |
| `24.scribetronic/packages/cli/src/index.ts` | Create | bin entry |
| `24.scribetronic/packages/cli/src/commands/{init,style,list,info}.ts` | Create | Command impls |
| `24.scribetronic/packages/cli/src/analyzers/project.ts` | Create | Project introspection |
| `24.scribetronic/packages/cli/src/generators/templateCopier.ts` | Create | Copy logic |
| `24.scribetronic/packages/cli/src/data/skills.ts` | Create | Skill registry |
| `24.scribetronic/packages/cli/src/__tests__/*.test.ts` | Create | Vitest suite |
| `24.scribetronic/packages/cli/templates/claude-code/.claude/skills/<24 skills>/SKILL.md` | Create | Migrated skills |
| `24.scribetronic/packages/cli/templates/project/thoughts/writing/calendar/{rules.example,publish-config.example,history,README,index}.{yaml,md}` | Create | Project scaffold |
| `24.scribetronic/packages/cli/templates/project/thoughts/writing/calendar/archive/.gitkeep` | Create | |
| `24.scribetronic/packages/cli/templates/project/thoughts/writing/ideas/{README,<14 types>}.md` | Create | Brainstorm pool |
| `24.scribetronic/packages/cli/templates/project/thoughts/writing/README.md` | Create | User guide |
| `rbart-astro/.claude/skills/writing/` | Delete | Post-migration cleanup |
| `rbart-astro/CLAUDE.md` | Modify | Point to scribetronic plugin |
| `rbart-astro/thoughts/writing/README.md` | Modify | Add "powered by" note |

Total new files: **~92** (21 skill folders × 1 SKILL.md + 14 ideas + 5 calendar + 3 root project + ~22 CLI src/test + 12 docs + 12 root OSS + 6 self-dogfood). The `+2` in CLI vs prior estimate accounts for the new `style.ts` command + its test.

---

## Implementation Phases

### Phase 1: Repo skeleton + OSS scaffolding

Sequential within phase but independent of Phase 2/3/4 — parallelizable across tasks 1.1-1.5.

#### Task 1.1: Root OSS files
**Files**: `LICENSE`, `README.md`, `CLAUDE.md`, `AGENTS.md`, `CHANGELOG.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, `RECOMMENDED-SKILLS.md`, `.gitignore`

Mirror devtronic's tone and structure. README hero, install snippet (`npx scribetronic init`), feature bullets, link to docs/. CHANGELOG starts with `## [Unreleased]` then `## [0.1.0] — 2026-05-03`.

#### Task 1.2: docs/ scaffolding
**Files**: `docs/ARCHITECTURE.md`, `docs/philosophy.md`, `docs/cli-reference.md`, `docs/customization.md`, `docs/skills.md`, `docs/contracts.md`, `docs/tutorials/{README,01-new-project,02-existing-project,03-weekly-flow}.md`

`docs/contracts.md` is the canonical home for CC5's 8 contracts (currently in `rbart-astro/.claude/skills/writing/README.md`). Tutorial 01 = fresh project bootstrap. 02 = retrofit existing repo. 03 = day-by-day week walkthrough.

#### Task 1.3: Self-dogfood `.claude/`
**Files**: `.claude/rules/architecture.md`, `.claude/rules/quality.md`, `.claude/settings.json`, `.claude/skills/scribetronic-help/SKILL.md`

Minimal. The help skill describes the project itself; mirrors `devtronic-help/SKILL.md`.

#### Task 1.4: thoughts/ + .github/
**Files**: `thoughts/plans/.gitkeep`, `thoughts/notes/.gitkeep`, `.github/.gitkeep`

#### Task 1.5: Move this plan in
**File**: `thoughts/plans/2026-05-03_scribetronic-migration.md`

Already done by this command. Verify it lives at the right path.

---

### Phase 2: CLI package skeleton

Depends on Phase 1 (tasks within Phase 2 parallelizable amongst themselves).

#### Task 2.1: package.json + tsconfig + eslint + .gitignore
**Files**: `packages/cli/{package.json, tsconfig.json, eslint.config.js, .gitignore, README.md}`

`package.json` per CC7. tsconfig with `module: ESNext`, `target: ES2022`, `strict: true`. eslint flat config matching devtronic.

#### Task 2.2: Entry point + command wiring
**File**: `packages/cli/src/index.ts`

```typescript
#!/usr/bin/env node
import { Command } from 'commander';
import { initCommand } from './commands/init.js';
import { styleCommand } from './commands/style.js';
import { listCommand } from './commands/list.js';
import { infoCommand } from './commands/info.js';

const program = new Command();
program
  .name('scribetronic')
  .description('Editorial calendar + weekly-newsletter pipeline for Claude Code')
  .version('0.1.0');

program.command('init [path]').description('Scaffold writing system into a project').action(initCommand);
program.command('style').description('Seed or edit writing-style/SKILL.md').option('--reset', 'overwrite with seed').action(styleCommand);
program.command('list').description('List bundled skills').action(listCommand);
program.command('info <skill>').description('Show skill metadata').action(infoCommand);

program.parse();
```

#### Task 2.3: `init` command
**Files**: `packages/cli/src/commands/init.ts`, `packages/cli/src/generators/templateCopier.ts`, `packages/cli/src/__tests__/init.test.ts`

`init.ts` resolves target path (default cwd), uses `@clack/prompts` for confirmations, calls `templateCopier`. `templateCopier` walks `packages/cli/templates/{claude-code,project}/`, copies preserving structure, renames `*.example.yaml` → `*.yaml`, refuses overwrites (skips with chalk-yellow "exists" line). Test verifies idempotence and rename rule.

#### Task 2.4: `list` and `info` commands
**Files**: `packages/cli/src/commands/list.ts`, `packages/cli/src/commands/info.ts`, `packages/cli/src/data/skills.ts`, `packages/cli/src/analyzers/project.ts`

`skills.ts` exports a typed registry sourced by globbing `templates/claude-code/.claude/skills/*/SKILL.md` at build time (or runtime — pick whichever doesn't bloat dist). `list` prints a chalk-styled tree. `info` parses one frontmatter and pretty-prints. `analyzers/project.ts` detects whether cwd already has scribetronic installed.

#### Task 2.5: `style` command
**Files**: `packages/cli/src/commands/style.ts`, `packages/cli/src/__tests__/style.test.ts`

Implements CC6's `style` resolution: seed if missing, open in `$EDITOR` if exists, `--reset` overwrites with confirmation. Uses `child_process.spawnSync` for editor launch. Test cases: (a) seed copies on missing target, (b) prints path and exits 0 on non-TTY, (c) `--reset` prompts and overwrites only on confirm.

---

### Phase 3: Skill migration (flat-naming format conversion)

Depends on Phase 1 (for repo paths). Parallel-safe across the 24 skill conversions because each writes one folder.

**Source** (rbart-astro): `.claude/skills/writing/`
**Destination**: `packages/cli/templates/claude-code/.claude/skills/`

Each task converts one skill from `<name>.md` to `<name>/SKILL.md` and adjusts:
- `inherits:` paths to be relative (e.g. `../writing-style/SKILL.md`).
- Internal cross-refs from `agenda.md` to `agenda/SKILL.md`.
- Path mentions from `.claude/skills/writing/long-form/<type>.md` to `.claude/skills/long-form-<type>/SKILL.md`.
- Drop the `writing/` infix everywhere — skills now sit flat at `.claude/skills/<name>/`.

#### Task 3.1: Orchestrator skills (3)
**Files**: `templates/claude-code/.claude/skills/{agenda,write,write-publish}/SKILL.md`

Source: `agenda.md`, `write.md`, `write-publish.md`. The most edited files. Verify after migration that all internal `<name>.md` references resolve under the new layout.

#### Task 3.2: Shared/quality skills (4)
**Files**: `templates/claude-code/.claude/skills/{writing-style,editing-pass,ai-slop-check,style-extract}/SKILL.md`

Source: `writing-style.md`, `editing-pass.md`, `ai-slop-check.md`, `style-extract.md`.

#### Task 3.3: Long-form type skills (6)
**Files**: `templates/claude-code/.claude/skills/long-form-{weekly-newsletter,monthly-devlog,hot-take,how-to,launch-retro,manifesto}/SKILL.md`

Source: `long-form/<type>.md`. Update `inherits: writing-style.md` → `inherits: ../writing-style/SKILL.md`. Rename frontmatter `name:` to `long-form-<type>` to match folder (CC3 strict). User-facing slash command becomes `/long-form-weekly-newsletter`, etc.

**`weekly-bip` is NOT migrated** — legacy skill superseded by `weekly-newsletter`. Source file (`long-form/weekly-bip.md`) stays in rbart-astro until Phase 5.3 cleanup, then disappears with the rest of `.claude/skills/writing/`.

#### Task 3.4: Short-form type skills (8)
**Files**: `templates/claude-code/.claude/skills/short-form-{x-vs-y,listicle,observation,motivational,present-vs-future,thread-from-longform,carousel-li,voice-adjustments}/SKILL.md`

Source: `short-form/<type>.md`. Same migration shape as 3.3.

#### Task 3.5: Skill README
**Files**: `templates/claude-code/.claude/skills/README.md`

Catalog of all 21 skills (3 orchestrators + 4 shared + 6 long + 8 short) with one-line descriptions and slash commands. Replaces the engineering README from `rbart-astro/.claude/skills/writing/README.md` (most of which moves to `docs/contracts.md` per CC5).

---

### Phase 4: Project templates

Depends on Phase 1. Parallel-safe.

**Source**: `rbart-astro/thoughts/writing/`
**Destination**: `packages/cli/templates/project/thoughts/writing/`

#### Task 4.1: Calendar template
**Files**: `templates/project/thoughts/writing/calendar/{README,index,history}.md`, `templates/project/thoughts/writing/calendar/{rules.example.yaml,publish-config.example.yaml}`, `templates/project/thoughts/writing/calendar/archive/.gitkeep`

Move (not copy) the existing `rbart-astro/thoughts/writing/calendar/{rules.yaml, publish-config.yaml}` content into the `.example.yaml` files, replacing project-specific values with generic defaults. The original files in rbart-astro stay (they're project-owned).

`history.md`: clean header only — no rbart-astro entries.
`README.md` and `index.md`: copy verbatim, they're already user-guide content.

#### Task 4.2: Ideas pool template (15 files)
**Files**: `templates/project/thoughts/writing/ideas/{README,<14 type files>}.md`

Move the structure from `rbart-astro/thoughts/writing/ideas/`, but each `<type>.md` template starts empty (only sections `## Active`, `## Used`, `## Cold / parked` with no bullets). Roberto's actual ideas stay in rbart-astro.

#### Task 4.3: User-facing writing README
**File**: `templates/project/thoughts/writing/README.md`

The 243-line user guide currently in `rbart-astro/thoughts/writing/README.md`. Copy verbatim, scrub any rbart-astro-specific examples (week numbers, slugs, blog targets) to placeholders.

---

### Phase 5: Smoke-test + rbart-astro migration

Depends on Phases 2 + 3 + 4.

#### Task 5.1: Build + unit tests
**Commands**:
```bash
cd 24.scribetronic/packages/cli
npm install
npm run build
npm test
npm run lint
```

All must pass. Fix any drift between Phase 3 cross-refs and Phase 4 paths (this is the highest-risk seam — Shared Contracts CC3 and CC8 must hold).

#### Task 5.2: End-to-end install in a sandbox
**Commands**:
```bash
cd /tmp && mkdir scribe-smoke && cd scribe-smoke
npm link scribetronic   # from the dev build
scribetronic init
ls -la .claude/skills/ thoughts/writing/
```

Verify: 21 skill folders exist with SKILL.md, `thoughts/writing/calendar/{rules.yaml, publish-config.yaml}` exist (renamed from .example), ideas pool present, no .example files leaked.

#### Task 5.3: rbart-astro migration
**Files**: `rbart-astro/.claude/skills/writing/` (delete), `rbart-astro/CLAUDE.md` (modify), `rbart-astro/thoughts/writing/README.md` (modify)

Steps:
1. Backup current `rbart-astro/.claude/skills/writing/` (git stash or rename).
2. From rbart-astro root: `npm link scribetronic && scribetronic init`. Confirm new skills land flat at `.claude/skills/<name>/SKILL.md`.
3. Compare new skill content against backup — they must be byte-identical to Phase 3 outputs.
4. Run `/agenda today` in rbart-astro. Must succeed and produce same output as pre-migration (no week active currently → null result is fine; check no errors).
5. Delete backup.
6. Update `rbart-astro/CLAUDE.md` "Available Skills" section: replace the writing-related lines with `Writing pipeline: see scribetronic plugin (./node_modules/scribetronic or 24.scribetronic/)`.
7. Append to `rbart-astro/thoughts/writing/README.md`: "Powered by scribetronic. Skills live in `.claude/skills/<name>/SKILL.md` (installed via `scribetronic init`). This directory contains only project-owned content and configuration."
8. Run `npm run build` in rbart-astro — must pass (Astro doesn't depend on these skills, but sanity check).

#### Task 5.4: Git init + first commit
**Commands**:
```bash
cd 24.scribetronic
git init
git add -A
git commit -m "feat: initial scribetronic v0.1.0 — devtronic-shaped monorepo with writing skills"
```

Do NOT push to a remote in this plan — user will create the GitHub repo manually when ready.

---

## Task Dependencies

```yaml
dependencies:
  1.1: []
  1.2: []
  1.3: []
  1.4: []
  1.5: []
  2.1: [1.4]              # CLI package needs repo skeleton
  2.2: [2.1]              # entry needs package.json
  2.3: [2.2, 4.1, 4.2, 4.3, 3.1, 3.2, 3.3, 3.4]  # init copies templates
  2.4: [2.2, 3.5]         # list/info read skill registry
  2.5: [2.2, 3.2]         # style command needs writing-style template
  3.1: [1.4]
  3.2: [1.4]
  3.3: [3.2]              # long-form inherits writing-style → 3.2 first
  3.4: [3.2]              # short-form inherits writing-style → 3.2 first
  3.5: [3.1, 3.2, 3.3, 3.4]
  4.1: [1.4]
  4.2: [1.4]
  4.3: [1.4]
  5.1: [2.3, 2.4, 2.5]
  5.2: [5.1]
  5.3: [5.2]
  5.4: [5.3]
```

**Phase fan-out**:
- Phase 1 wave: tasks 1.1–1.5 in parallel (5 agents).
- Phase 2 wave A: 2.1 alone (after 1.4).
- Phase 3 + 4 + 2.2 wave: 2.2, 3.1, 3.2, 4.1, 4.2, 4.3 in parallel (6 agents).
- Phase 3 wave B: 3.3, 3.4 in parallel (2 agents, after 3.2).
- Phase 3 close: 3.5 alone (after 3.3, 3.4).
- Phase 2 close: 2.3, 2.4, 2.5 in parallel (3 agents).
- Phase 5: 5.1 → 5.2 → 5.3 → 5.4 sequential.

---

## Risk Analysis

### Edge Cases

- [ ] **Existing files in target project on `scribetronic init`**: must skip with chalk-yellow line, never overwrite. Tested in 2.3.
- [ ] **`.example.yaml` rename collisions**: if `rules.yaml` already exists, skip the example. Tested in 2.3.
- [ ] **Empty `inherits:` chain**: skills without `inherits` should not break the parser. Test in 2.4.
- [ ] **Skill name vs folder name mismatch**: linter check in CLI tests — frontmatter `name` must equal folder.
- [ ] **rbart-astro CLAUDE.md drift**: post-migration grep must find zero references to `.claude/skills/writing/` in rbart-astro.

### Technical Risks

- [ ] **Skill format conversion drift**: 24 skills × ~3 cross-references each = ~72 paths to update. Mitigation: regex sweep post-Phase-3 for `.claude/skills/writing/` and `<name>.md` strings.
- [ ] **CLI tests on filesystem**: vitest needs tmp dirs. Use `node:fs.mkdtempSync` + `node:os.tmpdir()`.
- [ ] **tsup ESM import paths**: must use `.js` extensions in TS source for ESM compat. Mitigation: lock `tsconfig.json` `moduleResolution: "Bundler"` per devtronic's pattern.
- [ ] **npm link in rbart-astro**: if rbart-astro has no `package.json` for the writing system specifically, `npm link scribetronic` may need `--no-save` or a direct `.bin` symlink. Document fallback in `docs/customization.md`.
- [ ] **Long-form / short-form prefix breaks user habits**: slash commands change from `/weekly-newsletter` to `/long-form-weekly-newsletter`. Mitigation: optional `aliases:` field in SKILL.md frontmatter (deferred to v0.2; for v0.1 accept the breaking change because we have no users yet).

---

## Testing Strategy

- **Unit tests** (vitest in `packages/cli/`):
  - `init.test.ts`: copies templates, renames `.example.yaml`, refuses overwrites, idempotent.
  - `templateCopier.test.ts`: walks dirs, preserves structure, handles `.gitkeep`.
  - `skills.test.ts`: registry has 22 entries, every entry has valid frontmatter, every `name:` matches folder.
- **Integration** (manual, Phase 5.2):
  - Fresh `/tmp` dir + `scribetronic init` → verify 22 skills + project scaffold.
- **Migration validation** (Phase 5.3):
  - rbart-astro post-init: skill folder count matches, no leftover `writing/` infix, `npm run build` passes.
  - Smoke `/agenda today` runs without error.

---

## Done Criteria

### Phase 1: Repo skeleton
- [ ] `24.scribetronic/{LICENSE, README.md, CLAUDE.md, CHANGELOG.md, CONTRIBUTING.md, CODE_OF_CONDUCT.md, SECURITY.md, AGENTS.md, RECOMMENDED-SKILLS.md, .gitignore}` all exist and are non-empty: `find 24.scribetronic -maxdepth 1 -type f | wc -l` ≥ 10.
- [ ] `docs/{ARCHITECTURE,philosophy,cli-reference,customization,skills,contracts}.md` exist and are non-empty.
- [ ] `docs/tutorials/` contains at least 4 files including `README.md`.
- [ ] `.claude/{rules,settings.json,skills/scribetronic-help/SKILL.md}` exist.
- [ ] `docs/contracts.md` contains all 8 writing-pipeline contracts (CC5).

### Phase 2: CLI package
- [ ] `packages/cli/package.json` has `"name": "scribetronic"`, `"version": "0.1.0"`, `"bin": { "scribetronic": "./dist/index.js" }`.
- [ ] `packages/cli/src/index.ts` exposes 4 commands (init, style, list, info) via commander.
- [ ] `cd packages/cli && npm install && npm run build` exits 0.
- [ ] `cd packages/cli && npm run typecheck && npm run lint && npm test` exits 0.
- [ ] `node packages/cli/dist/index.js --help` prints all 4 commands.
- [ ] `node packages/cli/dist/index.js style --help` shows the `--reset` flag.

### Phase 3: Skill migration
- [ ] `find packages/cli/templates/claude-code/.claude/skills -name SKILL.md | wc -l` returns 21.
- [ ] `grep -rn "skills/writing/" packages/cli/templates/` returns nothing (all infix paths scrubbed).
- [ ] `grep -rn "<name>.md" packages/cli/templates/` returns no live cross-refs (only inside example/template strings).
- [ ] Every `SKILL.md` has frontmatter with `name:` matching its parent folder.
- [ ] Every `inherits:` value resolves to an existing file when interpreted relative to the SKILL.md location.

### Phase 4: Project templates
- [ ] `find packages/cli/templates/project/thoughts/writing -type f | wc -l` returns at least 21 (1 README + 5 calendar + 15 ideas).
- [ ] `templates/project/thoughts/writing/calendar/rules.example.yaml` and `publish-config.example.yaml` exist; the non-example versions do NOT exist in templates.
- [ ] `templates/project/thoughts/writing/calendar/history.md` is clean (header only, no entries).

### Phase 5: Smoke + migration
- [ ] CLI install works: `cd /tmp && mkdir scribe-smoke && cd scribe-smoke && npx /path/to/scribetronic init && find .claude/skills -name SKILL.md | wc -l` returns 21.
- [ ] After migration, `rbart-astro/.claude/skills/writing/` does not exist.
- [ ] After migration, `find rbart-astro/.claude/skills -name SKILL.md | wc -l` returns 21.
- [ ] `cd rbart-astro && npm run build` exits 0.
- [ ] `grep -rn "\.claude/skills/writing/" rbart-astro/` returns nothing.
- [ ] `git -C 24.scribetronic log --oneline | head -1` shows the initial commit.

### Overall
- [ ] All 5 phases complete.
- [ ] No TODO/FIXME/HACK in `packages/cli/src/`.
- [ ] OSS files match Contributor Covenant 2.1 / standard MIT formats.
- [ ] CHANGELOG.md has a `## [0.1.0] — 2026-05-03` entry listing the 21 migrated skills and the `weekly-bip` removal note.

---

## Verification

Package manager: rbart-astro uses npm (see CLAUDE.md). Scribetronic uses npm too (matches devtronic).

After implementation:
```bash
# In 24.scribetronic
cd 24.scribetronic
find . -maxdepth 2 -type f | sort                              # layout sanity
cd packages/cli && npm install && npm run build && npm test    # CLI works

# In a fresh sandbox
mkdir -p /tmp/scribe-smoke && cd /tmp/scribe-smoke
npm link scribetronic    # uses the local build
scribetronic init
find .claude/skills -name SKILL.md | wc -l                     # → 22
ls thoughts/writing/calendar/                                  # → README, index, rules.yaml, etc.

# In rbart-astro
cd ~/Desktop/ventures/rbart-astro
ls .claude/skills/                                             # writing/ gone, individual folders present
npm run build                                                  # exits 0
```

Manual final smoke: open Claude Code in rbart-astro, type `/agenda today`. Must respond as before migration.

After plan completion, `/post-review` will be auto-invoked to verify done criteria and capture lessons.

---

## Resolved Decisions (2026-05-03)

1. **GitHub repo**: local-only for v0.1; remote (`r-bart/scribetronic`) created manually by Roberto in parallel and pushed once the v0.1.0 tag is cut. README links use placeholder `<TBD: github.com/r-bart/scribetronic>` until then.
2. **Slash command naming**: long form (`/long-form-weekly-newsletter`, `/short-form-x-vs-y`, etc.). Folder name = frontmatter `name:` = slash command. CC3 strict.
3. **`writing-style.md` lifecycle**: dedicated CLI command, editable by user.
   - On first `scribetronic init`: NOT seeded automatically. The user runs `scribetronic style` separately.
   - `scribetronic style` (new v0.1 command):
     - If `.claude/skills/writing-style/SKILL.md` does not exist → copies the template seed and prints the path.
     - If it exists → opens it in `$EDITOR` (fallback to `$VISUAL`, then `vi`); on platforms without an editor env var, prints the absolute path so the user can open it manually.
     - `scribetronic style --reset` overwrites with the seed (with confirmation prompt).
   - This adds a 4th CLI command. CC6 updated below.
4. **`weekly-bip` legacy skill**: drop entirely from v0.1. Was Sebastian Röhl-style short build-in-public weekly recap (~400-700 words, sectioned with emoji headers); replaced by `weekly-newsletter` as the recurring Sunday default on 2026-05-03 and tagged legacy in its own frontmatter. Removing it means: (a) skill count drops from 22 to 21, (b) Phase 3 Task 3.3 covers 6 long-form skills not 7, (c) `rules.yaml` recurring rule already points to `weekly-newsletter` (no further change), (d) CHANGELOG note: "Legacy `weekly-bip` skill not migrated; superseded by `weekly-newsletter`."
