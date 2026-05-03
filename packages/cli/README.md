# scribetronic

Editorial calendar + weekly-newsletter pipeline for Claude Code.

Scaffolds a writing system into your project: a curated set of skills (orchestrators, long-form, short-form, shared) and editorial-calendar templates that plug into Claude Code via the `.claude/skills/` convention.

## Install

```bash
npm install -g scribetronic
# or one-shot via npx
npx scribetronic init
```

## Usage

### `scribetronic init [path]`

Scaffolds skills and project templates into the target directory (default: cwd). Idempotent — already-existing files are skipped.

Behaviour:

- Copies `templates/claude-code/.claude/skills/*` → `.claude/skills/*`
- Copies `templates/project/thoughts/writing/*` → `thoughts/writing/*`
- Renames `*.example.yaml` → `*.yaml` at the destination
- Skips any file that already exists (printed in yellow)

### `scribetronic style [--reset]`

Manage the `writing-style/SKILL.md` voice profile.

- First run: copies the seed template into `.claude/skills/writing-style/SKILL.md`.
- Re-runs in a TTY: opens the file in `$EDITOR` (or `$VISUAL`, falling back to `vi`).
- Re-runs without TTY: prints the absolute path.
- `--reset`: prompts for confirmation, then overwrites with the seed.

### `scribetronic list`

Lists bundled skills grouped by category (Orchestrators, Long-form, Short-form, Shared).

### `scribetronic info <skill>`

Pretty-prints one skill's frontmatter and body.

## Development

```bash
npm install
npm run build
npm test
npm run lint
npm run typecheck
```

## Repository

This package lives in the [scribetronic](https://github.com/r-bart/scribetronic) monorepo. See the repo root for full documentation, contracts, and contribution guide.

## License

MIT — see `LICENSE` at the repo root.
