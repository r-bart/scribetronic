# CLI Reference

Scribetronic exposes seven commands plus standard `--version` / `--help` flags.

```
scribetronic init [path]
scribetronic style [--reset]
scribetronic list
scribetronic info <skill>
scribetronic update [path]
scribetronic doctor [path]
scribetronic uninstall [path]
scribetronic --version
scribetronic --help
```

All commands exit with code `0` on success, non-zero on failure. Exit codes documented per command below.

---

## `scribetronic init [path]`

Scaffold scribetronic into a project. Copies project-level templates into `<target>/scribetronic/` and registers the [plugin marketplace](./plugin-mode.md) in `<target>/.claude/settings.json`. **Skills are not copied** — they load at runtime from the marketplace as `/scribetronic:<name>`.

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
4. Walks `templates/project/` and copies into `<target>/scribetronic/`.
5. During copy, files matching `*.example.yaml` are renamed to `*.yaml` at the destination.
6. Existing files are **never overwritten** — each is logged with a yellow `exists` line and skipped.
7. Prints a summary: count copied, count skipped, count renamed.

### Idempotence

Running `scribetronic init` multiple times in the same directory is safe. The second run produces only `exists` lines and copies nothing new (unless you've added templates by upgrading scribetronic).

### What gets created

```
<target>/
├── .claude/
│   └── settings.json                       # registers the plugin marketplace
└── scribetronic/
    ├── README.md
    ├── publish-config.yaml                 # renamed from .example.yaml
    ├── calendar/
    │   ├── README.md
    │   ├── index.md
    │   ├── rules.yaml                      # renamed from .example.yaml
    │   ├── history.md
    │   └── archive/.gitkeep
    └── ideas/
        ├── README.md
        └── <14 type files>.md
```

`.claude/settings.json` is created (or merged into) with:

```json
{
  "extraKnownMarketplaces": {
    "scribetronic": {
      "source": { "source": "github", "repo": "r-bart/scribetronic-plugin" }
    }
  },
  "enabledPlugins": {
    "scribetronic@scribetronic": true
  }
}
```

Pre-existing keys (themes, third-party plugins) are preserved.

### What gets NOT created

- **`SKILL.md` files**. They live in [`r-bart/scribetronic-plugin`](https://github.com/r-bart/scribetronic-plugin) and load at runtime. Restart Claude Code after `init`.
- `writing-style.md` — this is left to `scribetronic style`. Voice is personal; the user should engage with it deliberately rather than have a generic seed silently appear.
- Week directories under `calendar/<YYYY-WNN>/` — created by `/scribetronic:agenda plan-week` once you start using the pipeline.

### Options

| Flag | Effect |
|---|---|
| `--help` | Print help for `init` and exit 0. |

### Examples

```bash
# Initialise the current project
$ scribetronic init
copied  scribetronic/calendar/rules.yaml         (from rules.example.yaml)
copied  scribetronic/publish-config.yaml         (from publish-config.example.yaml)
copied  scribetronic/README.md
...
plugin: scribetronic@scribetronic (r-bart/scribetronic-plugin)
✓ Done. Restart Claude Code — skills load as `/scribetronic:<name>`.

# Re-running is safe
$ scribetronic init
skipped  scribetronic/calendar/rules.yaml (exists)
skipped  scribetronic/publish-config.yaml (exists)
...
plugin: scribetronic@scribetronic (r-bart/scribetronic-plugin)
✓ no changes to existing files.
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

Seed or edit the writer's voice file at `scribetronic/style/writing-style.md`.

This is the only file scribetronic treats as personal-by-default. It defines the voice that all long-form templates inherit, so it's separated from `init` to make sure the user actually engages with it.

### Synopsis

```bash
scribetronic style              # seed-or-edit
scribetronic style --reset      # overwrite with seed (with confirmation)
```

### Behaviour (seed-or-edit semantics)

The command resolves to one of three modes based on file state and flags:

1. **Seed mode** (file does not exist, no `--reset` flag):
   - Copies `templates/claude-code/scribetronic/style/writing-style.md` to `<cwd>/scribetronic/style/writing-style.md`.
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
   - If the file exists, prompts via `@clack/prompts`: `Overwrite existing writing-style.md with the seed? (y/N)`.
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
✓ seeded /Users/jane/proj/scribetronic/style/writing-style.md
Edit it now: scribetronic style

# Second run — file exists, opens editor
$ scribetronic style
# (your $EDITOR opens with the file)

# Reset to the bundled seed
$ scribetronic style --reset
? Overwrite existing writing-style.md with the seed? (y/N) y
✓ reset to seed.

# Non-TTY (e.g. CI) — prints path
$ scribetronic style < /dev/null
/Users/jane/proj/scribetronic/style/writing-style.md
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

Total: 22 skills.

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
inherits:     ../writing-style.md
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
  init [path]        Scaffold writing system + register plugin marketplace
  style [options]    Seed or edit writing-style.md
  list               List bundled skills (mirrors what the marketplace ships)
  info <skill>       Show skill metadata
  update [path]      Refresh marketplace registration in .claude/settings.json
  doctor [path]      Verify the install end-to-end
  uninstall [path]   Disable the plugin (leaves your scribetronic/ intact)
  help [command]     display help for command
```

---

## `scribetronic update [path]`

Re-applies the plugin marketplace registration in `<target>/.claude/settings.json`. Use after a fresh `git clone` of a scribetronic project, after upgrading the CLI globally, or whenever `settings.json` drifts (legacy entries, manual edits, etc.).

Idempotent. If the marketplace source has changed (e.g. a stale local-directory pointer from a dev session), it gets rewritten to the canonical GitHub repo. Other settings keys are preserved.

### Behaviour

1. Reads `<target>/.claude/settings.json` (or starts empty).
2. Sets `extraKnownMarketplaces.scribetronic.source = { source: "github", repo: "r-bart/scribetronic-plugin" }`.
3. Sets `enabledPlugins["scribetronic@scribetronic"] = true` if undefined. **Does not flip an explicit `false`** (the user's choice wins).
4. Writes settings back.

### Exit codes

| Code | Meaning |
|---|---|
| 0 | Success. |
| 1 | Target path does not exist. |

---

## `scribetronic doctor [path]`

Health check for an existing installation. Verifies six things:

1. `scribetronic/` directory exists.
2. `scribetronic/calendar/` exists.
3. `scribetronic/publish-config.yaml` exists.
4. The plugin (`scribetronic@scribetronic`) is enabled in `.claude/settings.json`.
5. The marketplace source resolves to `r-bart/scribetronic-plugin`.
6. `writing-style.md` has been seeded.

Each check renders as `✓` (pass) or `✗` (fail) with a short detail line. Failed checks include a hint at how to fix them.

### Exit codes

| Code | Meaning |
|---|---|
| 0 | All six checks passed. |
| 1 | At least one check failed. |

### Example

```bash
$ scribetronic doctor
scribetronic doctor
/Users/me/blog

  ✓ scribetronic/ directory
  ✓ scribetronic/calendar/ directory
  ✓ scribetronic/publish-config.yaml
  ✓ scribetronic@scribetronic enabled in .claude/settings.json
  ✓ marketplace source resolves to r-bart/scribetronic-plugin
  ✗ writing-style.md seeded
     missing — run `scribetronic style`

1/6 check(s) failed
```

---

## `scribetronic uninstall [path]`

Disables the scribetronic plugin and removes its marketplace entry from `<target>/.claude/settings.json`. **Does not** touch `scribetronic/` content — drafts, calendar, history, and `publish-config.yaml` are yours; we never delete prose.

### Behaviour

1. If the plugin is not registered, prints "nothing to do" and exits 0.
2. Otherwise, removes `enabledPlugins["scribetronic@scribetronic"]` and `extraKnownMarketplaces.scribetronic`.
3. Reminds the user they can `rm -rf scribetronic/` manually if they no longer need it.

### Exit codes

| Code | Meaning |
|---|---|
| 0 | Success (including no-op). |
| 1 | Target path does not exist. |
