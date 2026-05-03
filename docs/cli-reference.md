# CLI Reference

Scribetronic exposes four commands plus standard `--version` / `--help` flags.

```
scribetronic init [path]
scribetronic style [--reset]
scribetronic list
scribetronic info <skill>
scribetronic --version
scribetronic --help
```

All commands exit with code `0` on success, non-zero on failure. Exit codes documented per command below.

---

## `scribetronic init [path]`

Scaffold scribetronic into a project. Copies the bundled templates into the target project's `.claude/` and `thoughts/writing/` directories.

### Synopsis

```bash
scribetronic init                  # initialise the current working directory
scribetronic init ./my-project     # initialise a specific path
scribetronic init /abs/path        # absolute path also works
```

### Behaviour

1. Resolves the target path (default: `process.cwd()`).
2. Verifies the target is a directory and writable.
3. Walks `templates/claude-code/` and copies into `<target>/.claude/`.
4. Walks `templates/project/` and copies into `<target>/thoughts/writing/`.
5. During copy, files matching `*.example.yaml` are renamed to `*.yaml` at the destination.
6. Existing files are **never overwritten** — each is logged with a yellow `exists` line and skipped.
7. Prints a summary: count copied, count skipped, count renamed.

### Idempotence

Running `scribetronic init` multiple times in the same directory is safe. The second run produces only `exists` lines and copies nothing new (unless you've added templates by upgrading scribetronic).

### What gets created

```
<target>/
├── .claude/
│   ├── agents/
│   ├── rules/
│   └── skills/                                  # 21 skills
│       ├── agenda/SKILL.md
│       ├── write/SKILL.md
│       ├── write-publish/SKILL.md
│       └── ... (18 more)
└── thoughts/
    └── writing/
        ├── README.md
        ├── publish-config.yaml                  # renamed from .example.yaml
        ├── calendar/
        │   ├── README.md
        │   ├── index.md
        │   ├── rules.yaml                       # renamed from .example.yaml
        │   ├── history.md
        │   └── archive/.gitkeep
        └── ideas/
            ├── README.md
            └── <14 type files>.md
```

### What gets NOT created

- `writing-style/SKILL.md` — this is left to `scribetronic style` (see below). The reasoning is that voice is personal; the user should be prompted to author it deliberately rather than have a generic seed silently appear.
- Week directories under `calendar/<YYYY-WNN>/` — these are created by `/agenda plan-week` once you start using the pipeline.

### Options

| Flag | Effect |
|---|---|
| `--help` | Print help for `init` and exit 0. |

### Examples

```bash
# Initialise the current project
$ scribetronic init
created  .claude/skills/agenda/SKILL.md
created  .claude/skills/write/SKILL.md
...
created  thoughts/writing/calendar/rules.yaml         (from rules.example.yaml)
created  thoughts/writing/calendar/publish-config.yaml (from publish-config.example.yaml)
✓ scribetronic installed. Run `scribetronic style` next.

# Re-running is safe
$ scribetronic init
exists   .claude/skills/agenda/SKILL.md
exists   .claude/skills/write/SKILL.md
...
✓ no changes.
```

### Exit codes

| Code | Meaning |
|---|---|
| 0 | Success (including no-op idempotent runs). |
| 1 | Target path does not exist or is not a directory. |
| 2 | Target path is not writable. |
| 3 | Internal error (template missing, copy failed). |

---

## `scribetronic style [--reset]`

Seed or edit the writer's voice file at `.claude/skills/writing-style/SKILL.md`.

This is the only file scribetronic treats as personal-by-default. It defines the voice that all long-form templates inherit, so it's separated from `init` to make sure the user actually engages with it.

### Synopsis

```bash
scribetronic style              # seed-or-edit
scribetronic style --reset      # overwrite with seed (with confirmation)
```

### Behaviour (seed-or-edit semantics)

The command resolves to one of three modes based on file state and flags:

1. **Seed mode** (file does not exist, no `--reset` flag):
   - Copies `templates/claude-code/.claude/skills/writing-style/SKILL.md` to `<cwd>/.claude/skills/writing-style/SKILL.md`.
   - Prints the absolute path of the created file.
   - Suggests the user run `scribetronic style` again to open in their editor.
   - Exits 0.

2. **Edit mode** (file exists, no `--reset` flag):
   - Resolves the editor in this order: `$EDITOR` → `$VISUAL` → `vi`.
   - If a TTY is attached, spawns the editor with the file path as its argument and waits.
   - If no TTY (CI, non-interactive shell), prints the absolute path and exits 0 without opening an editor.
   - Exits with the editor's exit code.

3. **Reset mode** (`--reset` flag passed):
   - If the file does not exist, behaves like seed mode.
   - If the file exists, prompts via `@clack/prompts`: `Overwrite existing writing-style/SKILL.md with the seed? (y/N)`.
   - On `y`: overwrites with the bundled seed and exits 0.
   - On `n` or cancel: exits 0 without modifying the file.
   - In non-interactive mode (`--reset` with no TTY), the command refuses and exits 4.

### `$EDITOR` resolution

The exact lookup chain:

```
$EDITOR → $VISUAL → "vi"
```

The first non-empty value wins. If `$EDITOR` is set but the binary doesn't exist on `$PATH`, the spawn fails and the command exits 5.

### Examples

```bash
# First run — file doesn't exist
$ scribetronic style
✓ seeded /Users/jane/proj/.claude/skills/writing-style/SKILL.md
Edit it now: scribetronic style

# Second run — file exists, opens editor
$ scribetronic style
# (your $EDITOR opens with the file)

# Reset to the bundled seed
$ scribetronic style --reset
? Overwrite existing writing-style/SKILL.md with the seed? (y/N) y
✓ reset to seed.

# Non-TTY (e.g. CI) — prints path
$ scribetronic style < /dev/null
/Users/jane/proj/.claude/skills/writing-style/SKILL.md
```

### Exit codes

| Code | Meaning |
|---|---|
| 0 | Success (seeded, edited, reset, or no-op). |
| 1 | `.claude/skills/` parent directory missing — run `scribetronic init` first. |
| 4 | `--reset` passed in non-interactive mode (would skip the confirmation prompt). |
| 5 | Editor binary not found on `$PATH`. |

---

## `scribetronic list`

List all skills bundled with scribetronic. Output is grouped by category.

### Synopsis

```bash
scribetronic list
```

### Output format

```
ORCHESTRATORS
  /agenda           Cadence and week scaffolding
  /write            Drafting pipeline (seed → draft → edit → slop-check → repurpose)
  /write-publish    Publishing to blog and social archive

SHARED
  /writing-style    Voice base (inherited by every long-form template)
  /editing-pass     Craft pass (5 sub-passes)
  /ai-slop-check    AI-slop detection (HIGH/MED/LOW severity)
  /style-extract    Style extraction utility

LONG-FORM (6)
  /long-form-weekly-newsletter   Recurring Sunday default — 800–1500 words
  /long-form-monthly-devlog      Monthly build retrospective — ~1500 words
  /long-form-hot-take            Opinion piece — 600–900 words
  /long-form-how-to              Tutorial — variable length
  /long-form-launch-retro        Launch retrospective — ~1200 words
  /long-form-manifesto           Position piece — 800–1500 words

SHORT-FORM (8)
  /short-form-x-vs-y              Comparison post
  /short-form-listicle            Numbered list
  /short-form-observation         Single-thought observation
  /short-form-motivational        Encouragement / conviction
  /short-form-present-vs-future   Where-we-are vs where-we-go
  /short-form-thread-from-longform   Multi-tweet thread from a newsletter
  /short-form-carousel-li         LinkedIn carousel
  /short-form-voice-adjustments   Voice deltas for short-form
```

Total: 21 skills.

### Exit codes

| Code | Meaning |
|---|---|
| 0 | Success. |
| 3 | Bundled templates missing (broken install). |

---

## `scribetronic info <skill>`

Print the metadata of a single skill: frontmatter, inheritance chain, and a short description.

### Synopsis

```bash
scribetronic info agenda
scribetronic info long-form-weekly-newsletter
scribetronic info short-form-x-vs-y
```

### Output format

```
$ scribetronic info long-form-weekly-newsletter

skill:        long-form-weekly-newsletter
description:  Recurring Sunday default — 800–1500 word newsletter
inherits:     ../writing-style/SKILL.md
length_target: 800-1500 words
cadence:      weekly

slash command:  /long-form-weekly-newsletter
file:           templates/claude-code/.claude/skills/long-form-weekly-newsletter/SKILL.md
```

If the skill name does not match any bundled skill, the command suggests close matches:

```
$ scribetronic info weekly
✗ no skill named 'weekly'.
did you mean: long-form-weekly-newsletter
```

### Exit codes

| Code | Meaning |
|---|---|
| 0 | Success. |
| 1 | Skill not found. |
| 3 | Bundled templates missing. |

---

## Global flags

### `--version` / `-V`

Prints the CLI version (matches `package.json`'s `version` field). Exits 0.

```bash
$ scribetronic --version
0.1.0
```

### `--help` / `-h`

Prints top-level help (command list + brief descriptions) and exits 0. Each subcommand also accepts `--help` to print command-specific help.

```bash
$ scribetronic --help
Usage: scribetronic [options] [command]

Editorial calendar + weekly-newsletter pipeline for Claude Code

Options:
  -V, --version      output the version number
  -h, --help         display help for command

Commands:
  init [path]        Scaffold writing system into a project
  style              Seed or edit writing-style/SKILL.md
  list               List bundled skills
  info <skill>       Show skill metadata
  help [command]     display help for command
```

---

## Out of scope for v0.1

The following commands are reserved for future versions and are NOT available in v0.1:

- `scribetronic add <skill>` — install one skill into an existing project.
- `scribetronic addon <name>` — install an optional addon (e.g. cross-poster).
- `scribetronic update` — refresh skills from the latest scribetronic release.
- `scribetronic doctor` — diagnose installation issues.
- `scribetronic regenerate` — re-derive skill content from sources.
- `scribetronic uninstall` — remove scribetronic from a project.
- `scribetronic mode` — switch between strict / lenient modes.
- `scribetronic diff` — diff installed skills against bundled templates.
- `scribetronic status` — show project state (active week, pending drafts).

These are tracked in the v0.2+ roadmap.
