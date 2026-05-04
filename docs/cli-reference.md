# CLI Reference

Scribetronic exposes seven commands plus standard `--version` / `--help` flags.

```
scribetronic init [path]
scribetronic style [--reset] [--yes]
scribetronic list [--json]
scribetronic info <skill> [--json]
scribetronic update [path]
scribetronic doctor [path] [--json]
scribetronic uninstall [path]
scribetronic --version
scribetronic --help
```

All commands exit with code `0` on success, non-zero on failure. Exit codes follow a global contract: `1` unexpected, `2` usage error, `3` state error. Per-command details documented below; the full contract and agent-friendly modes are in the [Agent-friendly modes](#agent-friendly-modes) section at the bottom.

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
| 1 | Internal error (template missing, copy failed). |
| 2 | Target path does not exist or is not writable. |

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
| 1 | Internal error (bundled seed missing, editor spawn failed). |
| 2 | `--reset` in non-TTY without `--yes` / `SCRIBETRONIC_YES=1`. |
| _other_ | When `$EDITOR` exits non-zero, the command propagates that exit code. |

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

Total: 23 skills.

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
| 2 | Target path does not exist (Usage error). |

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
| 3 | At least one check failed (State error). |

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
| 2 | Target path does not exist (Usage error). |

---

## Agent-friendly modes

Every read-only command (`list`, `info`, `doctor`) supports `--json` for machine-readable output. Mutation commands (`init`, `update`, `uninstall`, `style`) follow stdout/stderr discipline by default and respect `NO_COLOR`.

### `--json` output

When `--json` is passed:

- The single payload is a newline-terminated JSON line on **stdout**.
- All chrome (progress, hints, decorations) is suppressed.
- Errors emit a structured envelope on **stdout** (yes, stdout — gh / kubectl convention) with shape `{"ok": false, "error": {"message": "...", "code": "..."}}`. The exit code is still non-zero.

#### Schemas

`scribetronic list --json`
```json
{
  "skills": [
    { "name": "agenda", "category": "Orchestrators", "path": "/abs/path/SKILL.md", "description": "..." }
  ]
}
```

`scribetronic info <skill> --json`
```json
{
  "name": "agenda",
  "path": "/abs/path/SKILL.md",
  "frontmatter": { "name": "agenda", "description": "...", "...": "..." },
  "body": "..."
}
```

`scribetronic doctor [path] --json`
```json
{
  "ok": true,
  "target": "/abs/path",
  "checks": [
    { "label": "scribetronic/ directory", "ok": true, "detail": "..." }
  ]
}
```

### Exit codes (global contract)

| Code | Meaning | When |
|---|---|---|
| 0 | Success | Command completed |
| 1 | Unexpected error | Uncaught throw, internal bug, FS failure mid-op |
| 2 | Usage error | Bad argument, missing path, unknown skill, `--reset` without TTY/`--yes` |
| 3 | State error | Plugin not registered when expected, `doctor` checks failed |

### Environment variables

| Variable | Effect |
|---|---|
| `NO_COLOR` | If set to any non-empty value, disables ANSI color and the clack `intro/spinner/note/outro` boxes. Same effect as not having a TTY. |
| `SCRIBETRONIC_YES` | Set to `1` to bypass `--reset` confirm prompts. Same as passing `--yes`. |
| `EDITOR` | Editor invoked by `scribetronic style` (existing target, TTY). Falls back to `$VISUAL`, then `vi`. |
| `VISUAL` | Fallback for `$EDITOR`. |

### stdout vs stderr discipline

| Stream | Contents |
|---|---|
| **stdout** | The command's data payload. In JSON mode: one JSON line. In human mode: only the value `style` prints when target exists in non-TTY (the absolute path). Everything else mutation-related goes to stderr. |
| **stderr** | All chrome: headers, summaries, progress spinners, hints, error messages, success confirmations. |

This means `scribetronic list | jq '.skills[].name' --raw-input` works; `scribetronic init >/dev/null 2>&1` is silent on success; `scribetronic doctor 2> doctor.log` keeps the report even with stdout discarded.

### Examples for agents

```bash
# Read-only introspection, parseable
scribetronic list --json | jq '.skills | length'                # → 22
scribetronic info agenda --json | jq -r '.frontmatter.description'

# Health check with structured output
scribetronic doctor /repo --json | jq '.checks[] | select(.ok == false)'

# Idempotent setup (silent on success)
scribetronic update /repo > /dev/null 2>&1
echo $?                                                          # → 0

# Non-interactive reset
scribetronic style --reset --yes
SCRIBETRONIC_YES=1 scribetronic style --reset                    # equivalent

# Capture writing-style path
path=$(scribetronic style)
cat "$path"
```
