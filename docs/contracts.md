# Contracts

This document is the **canonical home** for the 8 writing-pipeline contracts. Every skill bundled with scribetronic — the three orchestrators (`/agenda`, `/write`, `/write-publish`), the 4 shared skills, and the 14 type templates — depends on these contracts.

If a skill contradicts one of these contracts, the skill is wrong. Fix the skill, not the contract.

These contracts are preserved verbatim from the source-of-truth in the original `rbart-astro/.claude/skills/writing/README.md`. They are reproduced here so the documentation site is the single authoritative reference, with no need to read individual SKILL.md files.

---

## Contract 1: ISO week identifier

- **Format**: `YYYY-WNN` where `NN` is zero-padded ISO week number (1..53).
- **Example**: `2026-W18` for the week containing 2026-04-27 (Mon) through 2026-05-03 (Sun).
- **Resolution function** (every consumer must use this same logic):
  - "Current week" = the ISO week containing today.
  - "Week of <date>" = the ISO week containing that date.
  - Week boundary: Monday 00:00 to Sunday 23:59 (ISO 8601, not US Sunday-start).
- **Owners**: `agenda.md` (writes via `plan-week`), `write.md` (computes for save path), `write-publish.md` (computes for resolution).
- **Always use** `date +%G-W%V`. Never `%Y-W%V` — `%Y` drifts at year boundaries (e.g. 2025-12-31 is in ISO week 2026-W01 under `%G` but `%Y` returns `2025`).

---

## Contract 2: Week directory layout

```
scribetronic/calendar/<YYYY-WNN>/
├── plan.md                          # required — the week's table (see Contract 3)
├── newsletter.md                    # optional — present once /write drafts the newsletter
└── derivatives/                     # optional — present once any derivative is drafted
    ├── <day>-<type>-<slug>.md       # e.g. mon-observation-mw18-hook.md
    └── ...
```

- The week directory itself (`<YYYY-WNN>/`) is created by `/agenda plan-week`. No other skill creates week directories.
- `derivatives/` is created lazily by `/write` Phase 5 when the first derivative is drafted.
- **Filename convention for derivatives** inside `derivatives/`:
  - Pattern: `<weekday>-<type>-<slug>.md`
  - `<weekday>`: lowercase three-letter (`mon`, `tue`, `wed`, `thu`, `fri`, `sat`, `sun`).
  - `<type>`: matches the `Type` column in plan.md (e.g. `observation`, `x-vs-y`, `listicle`, `carousel`).
  - `<slug>`: kebab-case, max 60 chars.
- **No `-x`, `-li`, `-threads` suffix in derivatives/.** Each derivative file is one piece, not one-per-platform. The platform a piece publishes to is read from the draft frontmatter (`platform: x | linkedin | threads | carousel`).
- Newsletter file is always `newsletter.md` (no slug — there's only one per week).
- **Owners**: `agenda.md` (creates dir + plan.md), `write.md` (creates newsletter.md + derivatives/*.md), `write-publish.md` (reads both, never creates).

---

## Contract 3: `plan.md` schema

Markdown table, frontmatter optional. Exact column order, exact column names:

```markdown
---
week: 2026-W18
week_start: 2026-04-27
week_end: 2026-05-03
newsletter_seed: "What I learned shipping product #2"
created: 2026-04-26
---

# Plan: Week of 2026-04-27 (W18)

| Date       | Day | Type              | Slug                       | Platform  | Source              | Status  |
|------------|-----|-------------------|----------------------------|-----------|---------------------|---------|
| 2026-04-27 | Mon | observation       | mw18-tooling-observation   | x         | newsletter (thread) | queued  |
| 2026-04-28 | Tue | x-vs-y            | mw18-shipping-vs-launching | linkedin  | newsletter (thread) | queued  |
| 2026-04-29 | Wed | listicle          | mw18-five-ship-mistakes    | x         | newsletter (thread) | queued  |
| 2026-04-30 | Thu | carousel          | mw18-product2-recap        | linkedin  | newsletter          | queued  |
| 2026-05-01 | Fri | observation       | mw18-friday-shipping       | threads   | newsletter (thread) | queued  |
| 2026-05-03 | Sun | weekly-newsletter | mw18-product2-recap        | (blog)    | —                   | queued  |
```

**Column rules**:

| Column | Format | Notes |
|---|---|---|
| `Date` | `YYYY-MM-DD` | Must fall inside `[week_start, week_end]`. |
| `Day` | `Mon`/`Tue`/.../`Sun` | Three letters, capitalized. Must match Date's actual weekday. |
| `Type` | one of the 14 writing types | See `/write --list`. `weekly-newsletter` is the new long-form. |
| `Slug` | kebab-case, max 60 chars | Globally unique within the week (collisions across weeks are allowed). |
| `Platform` | `x`/`linkedin`/`threads`/`carousel`/`(blog)` | `(blog)` for the newsletter row. Lowercase otherwise. |
| `Source` | `newsletter`, `newsletter (thread)`, or `—` | `—` for the newsletter row itself. `(thread)` if it's part of a multi-piece thread. |
| `Status` | `queued` / `drafted` / `published` / `skipped` | Same enum as the old top-level queue (which is gone — plan.md is the only queue now). |

**Status transitions** (only allowed transitions; everything else is a bug):

- `queued → drafted` — written by `/write` Phase 6 when a matching draft is saved.
- `queued → skipped` — written by `/agenda skip <date>`.
- `drafted → published` — written by `/write-publish` step 9.
- `published → published` — no-op, idempotent.

**Status-write ownership** (do not violate):

| Writer | Writes status |
|---|---|
| `/agenda plan-week` | seeds all rows as `queued` |
| `/agenda skip` | sets `skipped` |
| `/write` Phase 6 | sets `drafted` |
| `/write-publish` step 9 | sets `published` |

---

## Contract 4: `history.md` (at `calendar/history.md`)

Append-only markdown table:

```markdown
| Date | Type | Slug | Status | Source |
|---|---|---|---|---|
```

Status enum: `drafted` / `ready` / `published`. `Source` is the slash command that produced the row (`/write` or `/write-publish`).

**Ownership rule**: only `/write` writes `drafted` and `ready` to `history.md`. Only `/write-publish` writes `published`. `/agenda` never writes to `history.md`.

---

## Contract 5: `rules.yaml` (at `calendar/rules.yaml`)

Schema is documented inline in the file's header — that header is the source of truth. Top-level key is `rules:` (a list). Each rule has `name`, `when`, `type`, optional `seed_template`, `active_from`, `active_until`, `overrides`. Selectors: `weekday` (full word), `monthday` (1..31, negative counts from end), `nth_weekday_of_month` (e.g. "first sunday").

The recurring Sunday rule is `weekly-newsletter`. **No `id`, no `priority`, no `cron`, no `schedule` field.** Tie-breaker: if multiple rules survive `overrides`, the one defined LATER in the file wins.

**Resolution order (the `/agenda` resolver), for a given date `D`:**

```
1. week_id = ISO week containing D (date +%G-W%V).
2. Read calendar/<week_id>/plan.md (if it exists).
   - Find row with Date == D. If found:
     - Status == skipped → return null.
     - Otherwise → return (type, slug, seed-equivalent, status). Source = "plan".
3. Read calendar/rules.yaml. Apply rule resolution:
   - Drop rules whose active_from / active_until window excludes D.
   - Match each rule's `when` against D.
   - Apply `overrides`: for each pair (A, B), if A.overrides contains B.name, drop B.
   - If multiple still survive: latest in file wins.
   - Expand seed_template variables.
4. If nothing matches: return null.
```

**Order is fixed: plan beats rules. Skip beats both.** The resolver is resilient — missing/malformed `rules.yaml`, missing week directory, missing `history.md` all degrade gracefully (warn or omit). It never throws.

---

## Contract 6: Draft frontmatter (newsletter + derivatives)

**Newsletter** (`calendar/<week>/newsletter.md`):

```yaml
---
type: weekly-newsletter
status: draft
created: YYYY-MM-DD
week: YYYY-WNN
seed: "<first 80 chars of seed>"
length_words: <N>
# published_date: appended by /write-publish on success
---
```

**Derivative** (`calendar/<week>/derivatives/<weekday>-<type>-<slug>.md`):

```yaml
---
type: <one of the 7 short-form types>
status: draft
created: YYYY-MM-DD
week: YYYY-WNN
day: YYYY-MM-DD
platform: x | linkedin | threads | carousel
parent: newsletter            # always 'newsletter' for derivatives in this layout
seed: "<first 80 chars>"
length_chars: <N>
# published_date: appended by /write-publish on success
---
```

**Required fields when reading**: `/write-publish` MUST find `type`, `status`, and (for derivatives) `platform`. Missing → block.

Status transitions through the pipeline:

- `draft` → set by `/write` Phase 2.
- `edited` → set by `/write` Phase 3.
- `ready` → set by `/write` Phase 4 (after slop check passes) and Phase 6.
- `published` → set by `/write-publish` step 7. Same step appends `published_date: YYYY-MM-DD`.

---

## Contract 7: Source-of-truth rule

When a config and a consumer skill split responsibilities, the **config wins**. Specifically:

- `publish-config.yaml` declares paths and frontmatter mappings. `write-publish.md` MUST read from it; never hardcode.
- `rules.yaml` inline header declares the rules schema. `agenda.md` MUST match it; never invent fields.
- `plan.md` Contract 3 above is the canonical week-row shape. `agenda.md`, `write.md`, `write-publish.md` MUST all match it; if a column is added or renamed, update Contract 3 first, then update all three skills in the same task.

---

## Contract 8: Ideas pool

Pure brainstorming backlog. Lives at `scribetronic/ideas/`, ONE file per content type. **Not** consumed automatically by any skill — it's a writer's notebook the user grep/skims when they need a seed.

**File schema** (every `<type>.md`):

```markdown
---
type: <one of the 14>
description: <one-line description copied from the type's template frontmatter>
---

# Ideas — <type>

> Loose backlog. Add bullets freely. Promote to a week with `/agenda plan-week` (manual copy for now).

## Active

- [ ] <idea — short hook, can be one line or a small paragraph>
- [ ] <idea>

## Used

- [x] <idea> → published 2026-04-26 as `week-17-shipping-the-store`
- [x] <idea> → drafted 2026-04-30, slug `mw18-tooling-observation`

## Cold / parked

- <idea, no checkbox — explicitly de-prioritised>
```

**Status conventions**:

- `- [ ]` = active, available for promotion to a week.
- `- [x]` = used (turned into a draft or published). Append a one-line trail (`→ published <date> as <slug>` or `→ drafted <date>, slug <slug>`) so you can find it later.
- Plain bullet (no checkbox) under `## Cold / parked` = explicitly shelved.

**Ownership**: writer-owned (manual). No skill writes to these files.

---

## Versioning

These contracts evolve via repository changes. If you change a contract:

1. Update this file FIRST.
2. Propagate to the affected skills (`agenda/SKILL.md`, `write/SKILL.md`, `write-publish/SKILL.md`) in the same change.
3. Bump the scribetronic version in `packages/cli/package.json`.
4. Add a CHANGELOG entry describing the contract change.

The source-of-truth rule (Contract 7) is what makes this safe — config wins over code, this document's contracts win over individual skills.

There is no version number embedded in this document. Changes are tracked via git history.

---

## Anti-patterns (do not do these)

- Don't hardcode paths or key names. Read from `publish-config.yaml` (publish stuff) or `calendar/rules.yaml` + `calendar/<week>/plan.md` (cadence stuff).
- Don't write to `history.md` from `/agenda`. Only `/write` and `/write-publish` write there.
- Don't put a platform suffix on derivative filenames. Platform lives in frontmatter; the derivative is one file.
- Don't auto-scaffold week directories from `/write` or `/write-publish`. Only `/agenda plan-week` creates them.
- Don't infer status from filename or path. Read frontmatter.
- Don't use `%Y-W%V` for ISO week — always `%G-W%V`. `%Y` drifts at year boundaries.
- Don't introduce new fields to `rules.yaml`. Schema is closed.
- Don't run any drafting phase without loading `writing-style/SKILL.md` first. The voice base is non-negotiable.
- Don't auto-fix MEDIUM slop without asking unless `--auto`.

---

## Failure modes

| Failure | Skill | Behavior |
|---|---|---|
| `rules.yaml` missing | `/agenda` | resolver returns null; `show` prints warning |
| `<week>/plan.md` missing | `/agenda show` / `/write` Phase 0 | falls through to rules-only |
| `<week>/` missing for `/write` | `/write` Phase 2 | refuses; instructs `/agenda plan-week today` |
| `publish-config.yaml` missing | `/write-publish` | block, parse error |
| draft `status` ≠ `ready` | `/write-publish` step 3 | block (bypass `--force`) |
| HIGH slop and `strict_slop_check` | `/write-publish` step 3 | block (bypass `--force`) |
| derivative `platform` missing | `/write-publish` step 8 | block — read from frontmatter |
| target file exists, different content | `/write-publish` step 6 | interactive: confirm; `--auto`: fail |
| year boundary / ISO week edge | any | use `date +%G-W%V` (NOT `%Y-W%V`) |
