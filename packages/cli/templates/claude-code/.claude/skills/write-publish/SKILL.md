---
name: write-publish
description: Publishes a `status: ready` draft from the weekly calendar to its configured target (Astro blog collection) and archives social derivatives. Reads scribetronic/publish-config.yaml. Updates calendar history and per-week plan. Optionally archives completed weeks. Does NOT push to social platforms (out of scope v1).
---

# /write-publish

Moves a `status: ready` draft from `scribetronic/calendar/<week>/` into the Astro blog at `src/content/blog/`, generating frontmatter that matches the collection schema. Archives social derivatives — sourced from `<week>/derivatives/` — to `scribetronic/published/social/<channel>/`. Updates `scribetronic/calendar/history.md` and the matching row in `<week>/plan.md`. After publishing, optionally archives the entire week if every row in its plan is `published` or `skipped`. Does NOT auto-push to X, LinkedIn, or Threads — that is out of scope for v1.

All paths and frontmatter shapes come from `scribetronic/publish-config.yaml`. This skill never hardcodes them.

## Invocation

```
/write-publish                              → list ready drafts, prompt for selection
/write-publish <slug>                       → publish that draft directly
/write-publish <slug> --dry-run             → print the would-be MDX + paths, write nothing
/write-publish <slug> --social-only         → archive derivatives only, skip blog publish
/write-publish <slug> --date 2026-05-10     → set the date frontmatter (does NOT defer the write)
/write-publish <slug> --force               → bypass slop and status pre-flight checks
/write-publish <slug> --auto                → no prompts; fail loud on any conflict or missing input
```

## Flags

| Flag | Effect |
|---|---|
| (none) | Interactive. Lists ready drafts, prompts for selection, confirms each step. |
| `<slug>` | Resolve the draft by slug. Newsletters: match against `<week>/plan.md` Slug column where Type=`long-form-weekly-newsletter`. Derivatives: glob `scribetronic/calendar/*/derivatives/*-<slug>.md`. |
| `--dry-run` | Render frontmatter + target paths, show what would be written, write nothing. |
| `--social-only` | Skip the blog publish; only archive derivatives + update history + plan.md. |
| `--date <YYYY-MM-DD>` | Use this as the `date` frontmatter. Does NOT delay the file write. |
| `--force` | Bypass `require_ready_status` and `strict_slop_check`. Logs the bypass. |
| `--auto` | Non-interactive. Any missing input or unresolved conflict fails loud. No silent defaults beyond what `publish-config.yaml` declares. |

(Note: there is no `--schedule` flag. To schedule a future publish, you publish manually on that day. Astro builds whatever is in `src/content/blog/` at build time.)

## Pipeline

### 1. Load config

Read `scribetronic/publish-config.yaml`. If missing or malformed, block with the parse error. Do not auto-create.

### 2. Resolve target draft

Drafts now live under the weekly calendar layout:

```
scribetronic/calendar/<YYYY-WNN>/
├── plan.md
├── newsletter.md
└── derivatives/
    └── <weekday>-<type>-<slug>.md
```

Resolution rules:

- **Newsletter slug resolution:** newsletters are always named `newsletter.md` (no slug in the filename — only one per week). To find the newsletter for a given `<slug>`: scan each `scribetronic/calendar/*/plan.md`. If any row has `Type=long-form-weekly-newsletter` AND `Slug=<slug>`, the newsletter is at the same week's `calendar/<week>/newsletter.md`.
- **Derivative slug resolution:** glob `scribetronic/calendar/*/derivatives/*-<slug>.md`. The slug is the LAST `-`-separated segment of the filename pattern `<weekday>-<type>-<slug>.md` (before `.md`).
- **Listing ready drafts (no `<slug>` arg, interactive):** scan ALL of `scribetronic/calendar/*/newsletter.md` and `scribetronic/calendar/*/derivatives/*.md`. Filter to those whose frontmatter has `status: ready`. Display with their week, type, slug, and platform. Prompt for selection. In `--auto`, fail.
- **`--social-only`:** skip newsletter resolution; jump to step 8 with the resolved week (the directory containing the matched draft).

If multiple newsletters or multiple derivatives match the same slug: list them and stop. The plan/calendar layout should make collisions impossible — surfacing one means something is wrong upstream.

### 3. Pre-flight checks

Apply config gates:

- **Status:** if `require_ready_status: true` and frontmatter `status` is not `ready`, block. Bypass with `--force`.
- **Slop:** if `strict_slop_check: true`, run `ai-slop-check/SKILL.md` against the body. If any HIGH issues remain, block. Bypass with `--force`.
- **Derivatives readiness (newsletter publish only):** when publishing a newsletter, scan all sibling `<week>/derivatives/*.md` files. Each must have frontmatter `status` of either `ready` or `published`. Drafts still in `draft` or `edited` state are unfinished.
  - Interactive mode: warn for each unfinished derivative, ask continue/abort.
  - `--auto` mode: block.
- **Derivative publish:** no peer check needed. Derivatives can publish independently of the parent newsletter — by design — because newsletters publish Sunday while derivatives publish Mon–Fri ahead of them.

### 4. Generate publish frontmatter (long-form only)

This step runs ONLY when publishing a long-form piece destined for a blog target (e.g. `long-form-weekly-newsletter` → `targets.blog`). Derivatives do NOT go to `src/content/blog/` — they are only archived (step 8). When publishing a derivative, skip directly to step 7.

For each field in `targets.<target>.frontmatter` from config, resolve per the mapping rules documented in the config file:

| Mapping | Resolution |
|---|---|
| `{ from: draft.<field> }` | Read `<field>` from the draft frontmatter. |
| `{ from: draft.title }` | Use the first H1 (`# ...`) in the draft body. If no H1, block. |
| `{ from: prompt }` | Ask the user. In `--auto`, fail. |
| `{ from: prompt, fallback: X }` | Try `X` first. If unresolved, ask (interactive) or fail (`--auto`). |
| `{ from: <key>, default: <v> }` | Try `<key>`. If missing, use `<v>`. (Silent defaults are explicit only via this form — used in config for `tags: { default: [] }` because Astro's schema also defaults to `[]`.) |
| `{ value: <literal> }` | Use the literal. |

Special `from` keys:
- `published_date` — the resolved publish date for this run (`--date` value if passed, else today).

If `tags` in draft frontmatter is a string instead of a list, coerce to a single-item array and warn inline.

### 5. Convert draft body to MDX (long-form only)

- Strip the draft's internal frontmatter (everything between the first two `---` lines).
- Replace with the publish frontmatter from step 4 — only fields the schema accepts.
- Body unchanged.

Filename comes from `targets.<target>.filename` template — currently `{{date}}-{{slug}}.mdx`. Variables: `{{date}}` (resolved publish date), `{{slug}}` (the slug for the newsletter from its plan.md row).

### 6. Write to target (long-form only)

Target path: `targets.<target>.path` + filename. Currently resolves to `src/content/blog/{{date}}-{{slug}}.mdx`.

- If file does not exist: write.
- If file exists with **identical** content: no-op, log "already published, content matches".
- If file exists with **different** content:
  - Interactive: show diff, prompt `overwrite / abort`.
  - `--auto`: fail with the diff.

`--dry-run` stops after this step: print rendered MDX + target path, write nothing.

`src/content/blog/` MUST already exist (it's the Astro project's directory — not this skill's to create). If missing, block with a clear error.

### 7. Update draft frontmatter

In the original draft file (`<week>/newsletter.md` or `<week>/derivatives/<file>.md`):

- Set `status: published`.
- Append `published_date: YYYY-MM-DD` (the resolved publish date). If the field already exists, overwrite.

Body untouched. Only frontmatter mutates.

### 8. Archive social derivatives

Determine the source set:

- **Case A — newsletter publish:** archive ALL sibling derivatives in `<week>/derivatives/` whose frontmatter `status` is `ready` or `published`.
- **Case B — derivative publish:** archive ONLY this single derivative file.
- **Case C — `--social-only`:** apply Case A or B based on the resolved target draft's type.

For each derivative file to archive:

1. Read its frontmatter `platform` field. **REQUIRED** — if missing, block with the file path. Do not infer platform from the filename.
2. Validate: `platform` must be a key in `social_archive.layout`. If not, block.
3. Source: the derivative's path under `<week>/derivatives/`.
4. Target: `social_archive.base` + `social_archive.layout.<platform>` (with `{{date}}` = `published_date` and `{{slug}}` = the derivative's slug — the LAST `-`-separated segment of the filename before `.md`). Currently resolves to `scribetronic/published/social/<platform>/{{date}}-{{slug}}.md`.
5. Idempotency: same content → no-op. Different content → confirm overwrite (interactive) or fail (`--auto`).

**Archived filenames have NO platform suffix** — the subdirectory IS the channel. Under the new layout the SOURCE filename also has no platform suffix; platform information lives only in frontmatter (source) and directory (target).

This skill DOES create the platform subdirectories under `social_archive.base` if missing — they live entirely under `scribetronic/`, the user has full control of that tree.

### 9. Update calendar history

Append a row to `scribetronic/calendar/history.md` (markdown table — same format as the file's documented schema):

```
| {published_date} | {type} | {slug} | published | /write-publish |
```

If a row already exists with the same `slug` and `Status: published`, do NOT append a duplicate (idempotency).

`/write-publish` writes ONLY `published` rows to history. It never writes `queued`, `drafted`, or `skipped`.

### 9b. Update plan.md row

Find the row in the published piece's `<week>/plan.md` whose `Slug` column matches the published piece's slug. Set its `Status` cell to `published`.

- If no matching row is found: warn but do not error — the publish itself succeeded.
- This is the ONLY status transition `/write-publish` is allowed to write to plan.md: `drafted → published` (or the no-op `published → published`).
- `/write-publish` MUST NOT write `queued`, `drafted`, or `skipped` to plan.md.

### 10. Output

Print:

```
✓ Published: src/content/blog/2026-05-04-niches-are-dead.mdx
✓ Draft updated: scribetronic/calendar/2026-W19/newsletter.md (status → published)
✓ History appended: scribetronic/calendar/history.md
✓ Plan row updated: scribetronic/calendar/2026-W19/plan.md (Status → published)
✓ Derivatives archived:
  - scribetronic/published/social/x/2026-05-04-niches-are-dead.md
  - scribetronic/published/social/linkedin/2026-05-04-niches-are-dead.md
  - scribetronic/published/social/threads/2026-05-04-niches-are-dead.md

Next:
  [ ] Read the published file once in dev (`npm run dev`)
  [ ] Manually post derivatives (X / LinkedIn / Threads) — auto-push not in v1
  [ ] Stagger cross-platform: don't fire all three the same day
```

### 11. Week archival check

Compute the published piece's week from its file path (the `<week>` directory it lives in). Read `<week>/plan.md`.

- If EVERY row's `Status` is `published` or `skipped`:
  - **Interactive:** prompt `Move calendar/<week>/ to calendar/archive/<week>/? (y/n)`. On `y`, perform the rename. On `n`, leave the directory in place.
  - **`--auto`:** rename only if `archive_completed_weeks: true` in `publish-config.yaml`. Otherwise no-op silently.
- If any row is still `queued` or `drafted`: skip archival. The week stays active.

The move is a directory rename (`scribetronic/calendar/<week>/` → `scribetronic/calendar/archive/<week>/`). No content changes. The skill creates `scribetronic/calendar/archive/` if missing.

If `<week>/plan.md` is missing: skip archival entirely (the skill refuses to guess what "completed" means without a plan).

## Configuration contract

`scribetronic/publish-config.yaml` is the source of truth. The skill must read these keys:

- `content_types.<post-type>.target` — which target to use for a given post type.
- `targets.<name>.path` — destination directory.
- `targets.<name>.format` — file format (currently `mdx`).
- `targets.<name>.frontmatter` — field-by-field mapping (see step 4).
- `targets.<name>.filename` — Mustache template for the output filename.
- `social_archive.base` — root directory for archived social derivatives.
- `social_archive.layout.<platform>` — relative path template per platform.
- `strict_slop_check` — bool.
- `require_ready_status` — bool.
- `archive_completed_weeks` — bool, optional, default `false`. Controls step 11 behavior in `--auto` mode only. When `true`, weeks whose every plan row is `published`/`skipped` are auto-moved to `calendar/archive/<week>/`. When `false` (or absent), `--auto` skips archival; interactive mode still prompts. This is the ONLY setting that drives the new step 11.

If you find a hardcoded path, key name, or filename in this skill that contradicts the config: that's a bug. Config wins.

## `--auto` consistency

In `--auto`, every missing input fails loud. The only "silent" defaults are those declared in the config via `{ default: <v> }` — currently:

- `tags`: defaults to `[]` (matches Astro schema's own default).
- `date`: defaults to `today` if no `--date` flag.
- `archive_completed_weeks`: defaults to `false` (week archival is opt-in for `--auto`).

There are no other silent defaults. `description` has no default → if missing from draft frontmatter, `--auto` fails.

## Idempotency

Re-running this skill on an already-published draft is safe:

- Step 3 detects `status: published` in the draft frontmatter and warns.
- Step 6 detects identical target content and no-ops.
- Step 8 detects identical archived derivative content and no-ops per file.
- Step 9 detects the existing `published` row in `calendar/history.md` and does not append a duplicate.
- Step 9b is a no-op when the plan.md row is already `published`.
- Step 11 is a no-op when the week directory has already moved into `calendar/archive/`.

A second run only acts if `--force` is passed AND the user confirms the diff at step 6 (interactive), or `--auto` and the diff is non-empty (which fails per step 6's `--auto` rule).

## Failure modes

- **No H1 in draft body (long-form only):** block. Print draft path and instruct to add a `# Title` line.
- **`status` is not `ready` and `require_ready_status: true`:** block. Suggest `/write --edit <draft>` to mark ready, or pass `--force`.
- **HIGH slop issues and `strict_slop_check: true`:** block. Print the slop report. Suggest `/write --edit <draft>` or pass `--force`.
- **Target file exists with different content:** interactive → confirm overwrite. `--auto` → fail and print diff.
- **`tags` in draft is a string:** coerce to single-item array, warn inline, continue.
- **Astro schema mismatch (rendered frontmatter would fail Zod parse):** block. Print the offending field, expected type, produced value. Do not write the file.
- **`publish-config.yaml` missing or malformed:** block. Print path + parse error. Do not auto-create.
- **`src/content/blog/` missing:** block. This is the Astro project's directory — not this skill's to create.
- **Social archive subdir missing:** auto-create under `scribetronic/published/social/<platform>/`.
- **Unfinished derivative (newsletter publish, derivative not `ready`/`published`):** warn (interactive) or block (`--auto`). List the offending files.
- **Derivative frontmatter missing `platform`:** block. Print the file path. Do not infer platform from the filename.
- **Derivative `platform` not in `social_archive.layout`:** block. Print the unknown value and the valid keys.
- **No week directory found for the slug:** block. Print the slug and the search root (`scribetronic/calendar/`).
- **Plan.md missing for the published piece's week:** warn loudly. Skip step 9b (cannot find the row to update) and skip step 11 (cannot determine completion). Publish itself succeeded.
- **Week dir contains files but no plan.md:** treat as above — publish succeeds, plan.md updates and week archival are skipped, the user is told.
- **`calendar/archive/<week>/` already exists when step 11 tries to move:** block the rename. Interactive prompt or `--auto` failure. Do not merge.

## What this skill does NOT do

- Push to X, LinkedIn, or Threads. Archiving is the boundary; manual posting is the user's job.
- Defer a publish to a future date. `--date` only sets the `date` frontmatter; the file is written immediately.
- Send a newsletter email or trigger any external delivery hook.
- Mutate the draft body. Only the draft's frontmatter is updated (status + published_date).
- Create `src/content/blog/` (Astro's territory). DOES create `scribetronic/published/social/<platform>/` and `scribetronic/calendar/archive/` (its own territory).
- Resolve agenda slots or pick what to write. That's `/agenda` and `/write` Phase 0.
- Create week directories. `/write` owns that. `/write-publish` only consumes them and (optionally) archives them.
- Auto-archive a week that has no `plan.md` (refusing to guess what "completed" means without the plan).
- Write `queued`, `drafted`, or `skipped` to `plan.md`. The only allowed transition for this skill is `drafted → published` (and the no-op `published → published`).

## Anti-patterns

- Don't bypass pre-flight checks unless `--force` is explicitly passed. Silent overrides defeat the gate.
- Don't write to `scribetronic/calendar/history.md` from anywhere except this skill (for `published` rows). `/agenda` reads only; `/write` writes only to plan.md.
- Don't mutate the draft body during publish. The MDX in `src/content/blog/` is a copy with new frontmatter; the original draft body stays exactly as-is.
- Don't hardcode paths or key names. Read everything from `publish-config.yaml`.
- Don't infer `tags` or `description` from the body when the draft frontmatter has them. Frontmatter wins; only fall back to prompt when the field is absent.
- Don't put a platform suffix on archived derivative filenames. The subdirectory IS the channel marker.
- Don't infer platform from the derivative's filename. Read it from frontmatter — that is the contract.
- Don't archive a derivative whose `platform` is missing or unknown. Block, surface the file, let the user fix the frontmatter.
- Don't move a week to `calendar/archive/` while any plan row is still `queued` or `drafted`. The plan is the gate.
