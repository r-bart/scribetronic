# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- npm publish automation: `.github/workflows/release.yml` (tag `v*.*.*` → `npm publish --provenance`), `prepublishOnly` quality gate, `publishConfig` for public access + provenance attestation.
- CI matrix on Node 18 / 20 / 22 (`.github/workflows/ci.yml`) running typecheck, lint, test, build, and pack-dry-run on every push and PR.
- Maintainer release runbook (`docs/releasing.md`) covering pre-flight, tagging, post-publish verification, rollback, and failure modes.

### Planned

- Calendar export (ICS, Notion, Google Calendar)
- Multi-author voice profiles
- Claude Code plugin marketplace distribution
- Analytics hooks feeding back into `/agenda`

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
