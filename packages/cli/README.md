# scribetronic

[![npm version](https://img.shields.io/npm/v/scribetronic)](https://www.npmjs.com/package/scribetronic)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Editorial calendar + writing pipeline for Claude Code.

scribetronic ships **23 writing skills** (3 orchestrators, 6 long-form formats, 8 short-form formats, 6 shared utilities) plus a CLI that scaffolds the editorial calendar into your project. The skills load from a [Claude Code plugin marketplace](https://github.com/r-bart/scribetronic-plugin) — auto-update, namespaced as `/scribetronic:<skill>`. The CLI handles everything that has to live in your project.

## Quick start

```bash
npx scribetronic init
```

The CLI will:

1. Scaffold the editorial calendar templates into `scribetronic/`
2. Register the [plugin marketplace](https://github.com/r-bart/scribetronic-plugin) in `.claude/settings.json`

Restart Claude Code; the 23 skills load as `/scribetronic:write`, `/scribetronic:agenda`, etc. The bare `/write` form also works.

To seed your voice:

```bash
scribetronic style
```

This copies a template into `scribetronic/style/writing-style.md` and opens it in `$EDITOR`. Every drafting and editing skill reads this file before generating prose — that's how the pipeline stays in *your* voice.

## Commands

```bash
scribetronic init [path]      # scaffold project + register plugin marketplace
scribetronic style [--reset]  # seed or edit your voice override at scribetronic/style/writing-style.md
scribetronic list             # list bundled skills (mirrors what the marketplace ships)
scribetronic info <skill>     # show one skill's metadata
scribetronic update [path]    # refresh marketplace registration in .claude/settings.json
scribetronic doctor [path]    # verify the install end-to-end
scribetronic uninstall [path] # disable the plugin (leaves your scribetronic/ content intact)
```

All commands accept `--help`. Read-only commands (`list`, `info`, `doctor`) accept `--json` for machine-readable output.

## Skills bundled

| Bucket | Count | Notable |
|---|---|---|
| Orchestrators | 3 | `/agenda`, `/write`, `/write-publish` |
| Long-form | 6 | `/long-form-weekly-newsletter`, `/long-form-monthly-devlog`, `/long-form-hot-take`, `/long-form-how-to`, `/long-form-launch-retro`, `/long-form-manifesto` |
| Short-form | 8 | `/short-form-x-vs-y`, `/short-form-listicle`, `/short-form-observation`, `/short-form-motivational`, `/short-form-present-vs-future`, `/short-form-thread-from-longform`, `/short-form-carousel-li`, `/short-form-voice-adjustments` |
| Shared | 6 | `/writing-style`, `/editing-pass`, `/ai-slop-check`, `/style-extract`, `/style-refine`, `/review` (parallel multi-focus draft review) |

## Plugin marketplace

If you only want the writing skills and don't need the editorial calendar, install the plugin directly inside Claude Code:

```
/plugin marketplace add r-bart/scribetronic-plugin
/plugin install scribetronic@scribetronic
```

The CLI's `init` does this for you — plus the project scaffold.

## Documentation

Full docs live in the [scribetronic repo](https://github.com/r-bart/scribetronic):

- [Architecture](https://github.com/r-bart/scribetronic/blob/main/docs/ARCHITECTURE.md)
- [Plugin Mode](https://github.com/r-bart/scribetronic/blob/main/docs/plugin-mode.md) — marketplace architecture, hooks, voice override
- [Skills Reference](https://github.com/r-bart/scribetronic/blob/main/docs/skills.md)
- [CLI Reference](https://github.com/r-bart/scribetronic/blob/main/docs/cli-reference.md) — all commands + `--json` schemas + exit codes
- [Philosophy](https://github.com/r-bart/scribetronic/blob/main/docs/philosophy.md)

## Requirements

- Node ≥ 20
- Claude Code (the slash commands and hooks live there)

## License

[MIT](./LICENSE) © 2026 Roberto Díaz
