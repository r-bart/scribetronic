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

## [0.2.1] — 2026-05-04

### Fixed

- **All 22 skills now load correctly in Claude Code.** Previously the bundled SKILL.md frontmatter included custom keys (`inherits`, `length_target`, `cadence`, `formats`, `applies_to`, `input`, `format`, `quota`, `status`, `language`, `target_voice`, `sources`, `last_updated`) that the Claude Code skills loader silently rejected — only 4 of 22 skills were actually loading. Frontmatter now contains only the spec-allowed keys (`name`, `description`); the operational metadata moved to a `## Metadata` section at the top of each skill body where it remains visible to humans and to skills that read it.

### Changed

- **Skills decoupled from style.** Every `long-form-*`, `short-form-*`, `editing-pass`, and `ai-slop-check` SKILL.md is now format-only — no embedded references to specific authors, posts, or accounts. The skills describe how a piece is shaped (structure, length, anti-patterns); the voice/tone/reference layer lives entirely in `writing-style/SKILL.md`. This makes every format skill reusable by any user in any niche without editing.
- **`writing-style/SKILL.md` rewritten as a personalization template.** Ships with a new `## Reference sources` section, `<your-name>` placeholders throughout, "How to fill this file" instructions, and a generalized "native-language interference watch" section (was Spanish-specific). Users either fill it manually (~30-60 min) or run `/scribetronic:style-extract` against their own samples to get a first draft.
- Bumped CLI to `0.2.1` and plugin lockstep to `0.2.1`.

### Tooling

- `scripts/normalize-skill-frontmatter.mjs` — extracts non-spec keys from any SKILL.md frontmatter and migrates them to a `## Metadata` body section. Run after editing or adding skills.

### Voice override path (BREAKING for `scribetronic style`)

- **`scribetronic style` now writes to `scribetronic/style/writing-style.md` (project root) instead of `.claude/skills/writing-style/SKILL.md`.** The old path was a leftover from before the plugin marketplace and was effectively orphaned: skills loaded `writing-style` from the marketplace cache, never from the project, so user edits had no effect.
- The four voice-consuming skills (`/scribetronic:write`, `/scribetronic:editing-pass`, `/scribetronic:ai-slop-check`, `/scribetronic:short-form-voice-adjustments`) now read voice in this resolution order: project-local override (`scribetronic/style/writing-style.md`) → bundled `writing-style/SKILL.md` template fallback. The override always wins when present.
- `/scribetronic:style-refine` and `/scribetronic:style-extract` updated to read/write the new path.
- `init` scaffolds `scribetronic/style/README.md` with seeding instructions.
- `doctor` checks the new path.
- **Migration**: if you already ran `scribetronic style` on v0.2.0 and edited `.claude/skills/writing-style/SKILL.md`, move that content to `scribetronic/style/writing-style.md` and delete the old file. (v0.2.0 was live for hours with no users, so practical impact is zero.)

### Migration

- v0.2.0 was live for hours with no production users, so no migration is required for skill content.
- If you forked v0.2.0 and personalized `writing-style/SKILL.md`: port your customizations to the new template structure (sections renumbered; section 0 "Reference sources" is new).

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
