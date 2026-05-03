---
name: scribetronic-help
description: Introduces the scribetronic project layout, CLI, and skills to AI agents working ON this codebase.
---

# scribetronic-help

Orientation skill for AI agents working ON the scribetronic codebase itself (not for projects scaffolded BY scribetronic). Loads the project layout, CLI surface, skill inventory, contracts, and quality command in one shot.

## When to Use

- First turn of a new session on this repo.
- An agent is about to make changes and needs a map.
- You're unsure where a feature lives or which file to edit.

## What scribetronic Is

A TypeScript ESM CLI that scaffolds AI-assisted project setups. It analyzes a target project, then writes `CLAUDE.md`, `.claude/rules/`, and a curated set of skills tailored to the stack.

## Top-Level Layout

The authoritative folder map lives in **`docs/ARCHITECTURE.md`**. Read it before navigating the tree. Quick reference:

```
scribetronic/
├── packages/cli/
│   ├── src/                    ← CLI source: commands/, analyzers/, generators/, data/
│   ├── templates/
│   │   ├── claude-code/        ← Distributed `.claude/` payload (skills, rules, settings)
│   │   └── project/            ← Distributed project files (CLAUDE.md, docs/)
│   └── package.json
├── docs/
│   ├── ARCHITECTURE.md
│   └── contracts.md            ← Shared contracts between modules and templates
├── thoughts/                   ← Plans, notes, state
└── .claude/                    ← THIS directory: rules and help for working on scribetronic itself
```

**Important distinction:**
- **`.claude/`** (this dir) — used when developing scribetronic. Not distributed.
- **`packages/cli/templates/claude-code/.claude/`** — what end users get. Distributed.

## CLI Commands (high level)

The CLI exposes 4 top-level commands. See `packages/cli/src/commands/` for entry points.

| Command | Purpose |
|---------|---------|
| `init` | First-time setup in a project. Analyzes the stack, writes CLAUDE.md, rules, and the default skill set. |
| `add` | Add an individual skill, rule, or template to an already-initialized project. |
| `update` | Pull updated templates and migrate existing project files to the latest schema. |
| `doctor` | Diagnose an existing setup — detect drift, broken references, outdated skills. |

Read the actual source under `packages/cli/src/commands/` for current flags and behavior — this table is a map, not a contract.

## The 21 Skills

The skill bundle distributed to end-user projects lives under:

```
packages/cli/templates/claude-code/.claude/skills/
```

Each skill is a folder containing a `SKILL.md` with YAML frontmatter (`name:` must equal the folder name) plus any supporting files. When editing skills, remember they target end-user projects — not this repo.

## Contracts

Shared contracts between modules (analyzers ↔ generators, generator ↔ template, skill ↔ config key) are documented in **`docs/contracts.md`**. Always read it before:

- Renaming a field consumed across module boundaries.
- Adding a new template that another generator will reference.
- Changing a skill's config key (skills must read keys from config, never hardcode).

## Quality Command

Run from repo root or wherever — it cd's into the CLI package:

```bash
cd packages/cli && npm run typecheck && npm run lint && npm test
```

Add `&& npm run build` when verifying the publishable artifact.

Full quality rules: `.claude/rules/quality.md`.
Architecture rules: `.claude/rules/architecture.md`.

## Recommended First Moves

1. Read `docs/ARCHITECTURE.md`.
2. Read `docs/contracts.md` if your change crosses module boundaries.
3. Skim `packages/cli/src/commands/` to find the entry point closest to your task.
4. Run the quality command once to confirm a clean baseline before editing.
