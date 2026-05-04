# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned

- Calendar export (ICS, Notion, Google Calendar)
- Multi-author voice profiles
- Analytics hooks feeding back into `/agenda`

---

## [0.2.0] — 2026-05-04

### Added

- **Claude Code plugin marketplace distribution.** Skills now ship from a separate repo (`r-bart/scribetronic-plugin`) and are loaded by Claude Code at runtime. Auto-update, no `init` re-run needed.
- New CLI commands:
  - `scribetronic update [path]` — re-applies the marketplace registration in `.claude/settings.json` (corrects drift, refreshes after CLI upgrades).
  - `scribetronic doctor [path]` — verifies the install (project skeleton, publish-config, plugin registration, marketplace source, writing-style seed). Exits 1 on failure.
  - `scribetronic uninstall [path]` — disables the plugin and removes the marketplace entry. Leaves `scribetronic/` content untouched.
- Workflow hooks shipped with the plugin:
  - `SessionStart` — surfaces today's editorial slot from `scribetronic/calendar/<week>/plan.md`. Silent in non-scribetronic projects.
  - `Stop` — reminds about `/editing-pass` + `/ai-slop-check` if drafts under `scribetronic/calendar/*/drafts/` were touched in the session.
- Skills become namespaced as `/scribetronic:write`, `/scribetronic:agenda`, etc. The bare `/write` form continues to work.
- `npm run test:coverage` (`@vitest/coverage-v8`).
- 29 new tests (settings, doctor, update, uninstall). Total suite: 78 tests across 12 files.
- npm publish automation: `.github/workflows/release.yml` (tag `v*.*.*` → `npm publish --provenance`), `prepublishOnly` quality gate, `publishConfig` for public access + provenance attestation.
- CI matrix on Node 18 / 20 / 22 (`.github/workflows/ci.yml`).
- Maintainer release runbook (`docs/releasing.md`).

### Changed (BREAKING)

- **`scribetronic init` no longer copies `SKILL.md` files into the project.** Skills are loaded from the plugin marketplace at runtime. Migration for existing v0.1.x installs:

  ```bash
  npx scribetronic update     # registers the marketplace
  rm -rf .claude/skills/agenda .claude/skills/write .claude/skills/write-publish \
         .claude/skills/long-form-* .claude/skills/short-form-* \
         .claude/skills/writing-style .claude/skills/editing-pass \
         .claude/skills/ai-slop-check .claude/skills/style-extract \
         .claude/skills/style-refine
  ```

  Then restart Claude Code. Skills will reappear under the `/scribetronic:` namespace, sourced from the marketplace.

- `init` now writes `.claude/settings.json` with `extraKnownMarketplaces.scribetronic` and `enabledPlugins["scribetronic@scribetronic"]`. Pre-existing keys (themes, third-party plugins, etc.) are preserved.

---

## [0.1.1] — 2026-05-04

### Added

- `/style-refine` skill — proposes evidence-backed deltas to `writing-style/SKILL.md` from the user's `(draft → published)` edit history. Requires ≥2 supporting pairs per delta. Manual review only; never auto-rewrites the voice guide. Cross-referenced from `/agenda` and `/write-publish` as a periodic maintenance nudge after 3+ pieces published.

### Changed (BREAKING)

- **Editorial root renamed from `thoughts/writing/` to `scribetronic/`.** The scaffolded directory tree is now top-level under your project root, decoupled from the devtronic `thoughts/` convention (which is reserved for internal dev notes/plans/design). Migration for existing v0.1.0 installs:

  ```bash
  mv thoughts/writing scribetronic
  rmdir thoughts 2>/dev/null  # only if empty
  ```

  All bundled skills (`/agenda`, `/write`, `/write-publish`, `/style-extract`) and `publish-config.yaml` examples have been updated to reference the new path. No content or schema changes — only the directory location.

---

## [0.1.0] — 2026-05-03

Initial public release. Migrated from a private editorial pipeline into a standalone OSS package.

### Added

- **CLI** (`scribetronic`) with four commands:
  - `scribetronic init [path]` — scaffold editorial calendar templates and install skills
  - `scribetronic style [--reset]` — seed or edit the `/writing-style` skill
  - `scribetronic list` — list all bundled skills with metadata
  - `scribetronic info <skill>` — show detailed metadata for a single skill

- **21 skills** bundled under `.claude/skills/`:
  - **Orchestrators (3)**: `/agenda`, `/write`, `/write-publish`
  - **Shared utilities (4)**: `/writing-style`, `/editing-pass`, `/ai-slop-check`, `/style-extract`
  - **Long-form (6)**: `/long-form-weekly-newsletter`, `/long-form-monthly-devlog`, `/long-form-hot-take`, `/long-form-how-to`, `/long-form-launch-retro`, `/long-form-manifesto`
  - **Short-form (8)**: `/short-form-x-vs-y`, `/short-form-listicle`, `/short-form-observation`, `/short-form-motivational`, `/short-form-present-vs-future`, `/short-form-thread-from-longform`, `/short-form-carousel-li`, `/short-form-voice-adjustments`

- **Templates** for editorial calendar structure (`drafts/`, `published/`, `notes/`, weekly planning files)
- **Quality gates** wired into `/write-publish` (`/ai-slop-check` + `/editing-pass`)
- **Voice-first architecture**: every skill reads `/writing-style` before generating
- MIT license, CONTRIBUTING guide, Code of Conduct (Contributor Covenant 2.1), Security policy

### Removed

- `/weekly-bip` skill — superseded by `/long-form-weekly-newsletter` + `/agenda`. The previous "build-in-public weekly" format is now expressible as a configuration of the newsletter skill.

### Notes

- This release is the first public extraction. Skills were refined across ~12 months of personal use before publishing.
- Repo will be created at `https://github.com/r-bart/scribetronic` when v0.1.0 is tagged.

[Unreleased]: https://github.com/r-bart/scribetronic/compare/v0.1.1...HEAD
[0.1.1]: https://github.com/r-bart/scribetronic/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/r-bart/scribetronic/releases/tag/v0.1.0
