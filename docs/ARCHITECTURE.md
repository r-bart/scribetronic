# Architecture

Scribetronic is a monorepo that packages an editorial-calendar + writing pipeline as an npm-distributable Claude Code plugin. This document describes the repository layout and the boundaries between its parts.

For the conceptual rationale see [philosophy.md](philosophy.md). For the data contracts that the pipeline depends on see [contracts.md](contracts.md).

---

## Top-level layout

```
scribetronic/
├── .claude/                 # self-dogfood: scribetronic's own Claude Code workspace
│   ├── rules/               # architecture + quality rules for working on scribetronic itself
│   ├── settings.json
│   └── skills/
│       └── scribetronic-help/SKILL.md
├── .github/                 # placeholder (CI workflows, issue templates — v0.2+)
├── docs/                    # this directory — public documentation
│   ├── ARCHITECTURE.md
│   ├── philosophy.md
│   ├── cli-reference.md
│   ├── customization.md
│   ├── skills.md
│   ├── contracts.md         # the 8 writing-pipeline contracts (canonical)
│   └── tutorials/
│       ├── README.md
│       ├── 01-new-project.md
│       ├── 02-existing-project.md
│       └── 03-weekly-flow.md
├── packages/
│   └── cli/                 # the npm package (bin: scribetronic)
├── thoughts/                # working notes (not shipped to consumers)
│   ├── plans/
│   └── notes/
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

Three top-level concerns are deliberately separated:

- **`packages/cli/`** — the only thing that ships to npm. Everything outside this directory is for repo maintainers and contributors.
- **`docs/`** — narrative documentation for end users. Not bundled into the npm tarball; served from the GitHub repo.
- **`.claude/` and `thoughts/`** — scribetronic dogfooding itself. The repo uses Claude Code with its own house rules to develop scribetronic.

---

## CLI package layout (`packages/cli/`)

```
packages/cli/
├── .gitignore
├── README.md                # npm landing page
├── eslint.config.js
├── package.json             # name: "scribetronic", bin: "scribetronic"
├── tsconfig.json
├── src/
│   ├── index.ts             # bin entrypoint (commander wiring)
│   ├── commands/
│   │   ├── init.ts          # scribetronic init [path]
│   │   ├── style.ts         # scribetronic style [--reset]
│   │   ├── list.ts          # scribetronic list
│   │   ├── info.ts          # scribetronic info <skill>
│   │   └── __tests__/
│   │       ├── init.test.ts
│   │       └── style.test.ts
│   ├── analyzers/
│   │   ├── project.ts       # detects whether cwd already has scribetronic installed
│   │   └── __tests__/
│   │       └── project.test.ts
│   ├── generators/
│   │   ├── templateCopier.ts  # walks templates/, copies preserving structure
│   │   └── __tests__/
│   │       └── templateCopier.test.ts
│   └── data/
│       ├── skills.ts        # typed registry sourced from templates/claude-code/.claude/skills/*/SKILL.md
│       └── __tests__/
│           └── skills.test.ts
└── templates/
    ├── claude-code/         # SKILL.md source-of-truth (used by `list` / `info`
    │   └── .claude/         # and synced to r-bart/scribetronic-plugin on release)
    │       ├── agents/
    │       ├── rules/
    │       └── skills/      # NOT copied into user projects since v0.2 — see docs/plugin-mode.md
    │           ├── agenda/SKILL.md
    │           ├── write/SKILL.md
    │           ├── write-publish/SKILL.md
    │           ├── writing-style/SKILL.md
    │           ├── editing-pass/SKILL.md
    │           ├── ai-slop-check/SKILL.md
    │           ├── style-extract/SKILL.md
    │           ├── long-form-weekly-newsletter/SKILL.md
    │           ├── long-form-monthly-devlog/SKILL.md
    │           ├── long-form-hot-take/SKILL.md
    │           ├── long-form-how-to/SKILL.md
    │           ├── long-form-launch-retro/SKILL.md
    │           ├── long-form-manifesto/SKILL.md
    │           ├── short-form-x-vs-y/SKILL.md
    │           ├── short-form-listicle/SKILL.md
    │           ├── short-form-observation/SKILL.md
    │           ├── short-form-motivational/SKILL.md
    │           ├── short-form-present-vs-future/SKILL.md
    │           ├── short-form-thread-from-longform/SKILL.md
    │           ├── short-form-carousel-li/SKILL.md
    │           └── short-form-voice-adjustments/SKILL.md
    └── project/             # mirrors a consumer's scribetronic/ scaffold
        └── scribetronic/
            ├── README.md
            ├── publish-config.example.yaml
            ├── calendar/
            │   ├── README.md
            │   ├── index.md
            │   ├── rules.example.yaml
            │   ├── history.md
            │   └── archive/.gitkeep
            └── ideas/
                ├── README.md
                └── <14 type files>.md
```

### Source organisation rules

- Each `src/<group>/` folder owns its own `__tests__/` sibling. Tests never reach across group boundaries.
- `src/data/` owns the skill registry: types, frontmatter parser, category inference, and a lazy loader that reads bundled `templates/.../SKILL.md` files. The only I/O permitted here is read-only introspection of the package's own `templates/` tree — never the host project's filesystem (that belongs in `analyzers/`) and never writes (that belongs in `generators/`).
- `src/analyzers/` is read-only project introspection. Never writes to the filesystem.
- `src/generators/` performs filesystem mutations. Always idempotent — refuses to overwrite existing files.
- `src/commands/` is the thin orchestration layer. Each command file exports one function and delegates to `analyzers/` + `generators/`.

---

## Templates layout

Two template trees, one CLI command (`scribetronic init`) copies both.

### `templates/claude-code/`

Mirrors the structure of a Claude Code workspace. The CLI copies this tree into `<project>/.claude/` on `init`. Skills follow the devtronic convention of `<skill-name>/SKILL.md` (folder per skill, not flat `<name>.md`).

### `templates/project/`

Mirrors the structure of `scribetronic/` inside a consumer project. The CLI copies this tree into `<project>/scribetronic/` on `init`. Files ending in `.example.yaml` are renamed to `.yaml` during the copy so user edits never collide with template updates.

See [contracts.md](contracts.md) for the file schemas these templates produce.

---

## What ships vs what doesn't

| Path | Shipped to npm? | Notes |
|---|---|---|
| `packages/cli/src/` | Yes (compiled to `dist/`) | TypeScript built with tsup |
| `packages/cli/templates/` | Yes | Copied verbatim by the CLI |
| `docs/` | No | GitHub-hosted documentation |
| `.claude/`, `thoughts/` | No | Repo-internal |
| Root OSS files (LICENSE, README, etc.) | The package's own README ships; root README is the GitHub landing page | |

Run `npm pack --dry-run` inside `packages/cli/` to inspect the tarball contents.

---

## Key boundaries

1. **CLI never reads from `docs/`.** Documentation is for humans; the runtime never depends on it.
2. **Templates are the contract.** The CLI's job is to copy templates faithfully and rename `.example.yaml` files. Behaviour beyond that lives inside the skills (which run in Claude Code, not in Node).
3. **Skills are pure markdown.** No code in `templates/claude-code/.claude/skills/` is executed by the CLI. Claude Code interprets the SKILL.md files at runtime.
4. **`docs/contracts.md` is the source of truth for data formats** consumed by skills. If a skill disagrees with `contracts.md`, the skill is wrong.
