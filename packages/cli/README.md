# scribetronic

Editorial calendar + weekly-newsletter pipeline for Claude Code.

Scaffolds a writing system into your project: a curated set of skills (orchestrators, long-form, short-form, shared) and editorial-calendar templates that plug into Claude Code via the `.claude/skills/` convention.

## Install

scribetronic is not on npm yet (planned for v1.0). Three options today:

```bash
# A. From GitHub source + npm link
git clone https://github.com/r-bart/scribetronic.git
cd scribetronic/packages/cli && npm install && npm run build && npm link

# B. Run direct without linking
node /path/to/scribetronic/packages/cli/dist/index.js init

# C. As a project dev-dependency (v0.2+, when release branch lands)
npm install --save-dev github:r-bart/scribetronic#release/v0.1.x
```

See the [repo root README](../../README.md#install) for full Quick Start.

## Usage

### `scribetronic init [path]`

Scaffolds skills and project templates into the target directory (default: cwd). Idempotent — already-existing files are skipped.

Behaviour:

- Copies `templates/claude-code/.claude/skills/*` → `.claude/skills/*`
- Copies `templates/project/scribetronic/*` → `scribetronic/*`
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
