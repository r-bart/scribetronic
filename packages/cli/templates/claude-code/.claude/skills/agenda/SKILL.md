---
name: agenda
description: Manages the writing cadence using per-ISO-week directories under scribetronic/calendar/. Combines recurring rules + per-week plan.md + history. Subcommands: show, plan-week, add, skip, done, rules. Used by /write router and /write-publish.
---

# /agenda

Manages writing cadence using ISO-week-scoped directories. Reads `scribetronic/calendar/rules.yaml` for recurring slot rules, reads and writes `scribetronic/calendar/<YYYY-WNN>/plan.md` for each week's planned posts, and reads `scribetronic/calendar/history.md` for the append-only event log.

This skill READS rules.yaml. It READS and WRITES `<week>/plan.md` (specifically: it seeds rows on `plan-week` and flips Status to `skipped` on `skip`). It only READS history.md. `/write` Phase 6 transitions plan.md rows to `drafted`; `/write-publish` transitions them to `published` and is the only writer of `history.md` rows tagged `published`.

## File inventory

| Path | Read | Write |
|---|---|---|
| `scribetronic/calendar/rules.yaml` | yes | no — `/agenda rules edit` opens the file in `$EDITOR`; user saves |
| `scribetronic/calendar/<YYYY-WNN>/plan.md` | yes | yes — `plan-week` scaffolds; `add` appends; `skip` flips Status |
| `scribetronic/calendar/history.md` | yes | no — owned by `/write` and `/write-publish` |
| `scribetronic/calendar/archive/<YYYY-WNN>/` | yes | no — historical week dirs moved here manually |

The week directory `scribetronic/calendar/<YYYY-WNN>/` is created ONLY by `/agenda plan-week`. No other skill creates it. Subdirectories `derivatives/` inside a week dir are created by `/write` Phase 5.

## Invocation

```
/agenda                                  → alias for `show 4`
/agenda show [N]                         → show next N WEEKS (default 4)
/agenda plan-week <YYYY-MM-DD> [flags]   → scaffold a week's plan.md
/agenda add <type> <date> "<seed>"       → add a row to <week>/plan.md
/agenda skip <date>                      → mark a date as skipped
/agenda done <slug>                      → mark a row as published (manual backfill)
/agenda rules [edit]                     → print or edit rules.yaml
```

## Subcommands

### `/agenda show [N]`

Default `N = 4` weeks. For each day in the window:

1. Compute `week_id` for the day (ISO week, `date +%G-W%V`).
2. If `scribetronic/calendar/<week_id>/plan.md` exists, read its rows and find the row matching the day's date.
3. Apply the resolution algorithm (see below): plan beats rules, skip beats both.
4. Print: Date, Day, Slot type, Slug, Seed (truncated), Status.

Footer: last 3 entries from `scribetronic/calendar/history.md` as "recently published". If the file is missing, omit the footer.

### `/agenda plan-week <YYYY-MM-DD> [flags]`

Scaffolds a single ISO week's `plan.md` from a recurring-rule pass plus a default rotation.

**Flags:**

- `--seed "<text>"` — newsletter seed for the week (required when `--auto`).
- `--auto` — non-interactive mode. Fail loud if `--seed` is missing.
- `--no-derivatives` — write only the Sunday newsletter row, omit Mon-Fri derivatives.
- `--replace` — delete the existing week dir first.

**Procedure:**

```
1. week_id = `date -d "<date>" +%G-W%V` (or equivalent ISO week calc).
   ALWAYS use %G-W%V (NOT %Y-W%V — %Y drifts at year boundaries).
2. week_start = Monday of that ISO week. week_end = Sunday.
3. Target dir: scribetronic/calendar/<week_id>/
   - If exists and --replace not passed: abort, print the path. Do NOT overwrite.
   - If exists and --replace passed: rm -rf the dir, continue.
4. Acquire newsletter seed:
   - Interactive: ask "What is this week's newsletter about? (1 sentence)"
   - --auto: require --seed "<text>"; fail loud if missing.
5. Compute newsletter slug:
     mw{week_num_no_zero}-{first 4-6 meaningful words of seed kebab-cased}
   Example: `mw18-product2-recap`. Cap at 60 chars.
6. For each of 7 days in the week:
   a. Run the agenda resolver for that date. plan.md doesn't exist yet, so this
      is effectively rules-only.
   b. If a rule resolves: use that type, slug = template-expanded slug,
      Source = "rule:<rule-name>".
   c. Otherwise apply the default rotation:
        Mon: observation,        platform=x
        Tue: x-vs-y,             platform=linkedin
        Wed: listicle,           platform=x
        Thu: carousel,           platform=linkedin
        Fri: observation,        platform=threads
        Sat: empty (skip the row entirely; no derivative)
        Sun: long-form-weekly-newsletter,  platform=(blog)
   d. Slug for derivatives: <newsletter-slug>-<day-token>
      (e.g. `mw18-product2-recap-mon-observation`). Truncate intelligently to ≤ 60 chars.
   e. Source for derivatives = "newsletter (thread)".
      Source for the Sunday newsletter row = "—" (em dash, U+2014).
   f. Status = "queued" for all rows.
7. Write <week>/plan.md with the frontmatter (see Contract: plan.md schema below)
   and the 6-7 row table.
8. Print:
     ✓ Scaffolded scribetronic/calendar/<week_id>/plan.md
     - 1 newsletter (Sun)
     - 5 derivatives (Mon-Fri)
     Next: /write long-form-weekly-newsletter (drafts the parent), then /write --repurpose for derivatives.
```

`--no-derivatives` produces only the Sunday newsletter row. `--replace` is destructive — only run when the user explicitly passes it.

### `/agenda add <type> <date> "<seed>"`

Append a new row to the relevant `<week>/plan.md`.

- Compute `week_id` from `<date>`. If `scribetronic/calendar/<week_id>/plan.md` does not exist: refuse and instruct the user to run `plan-week <date>` first. Do NOT auto-create.
- Validate `<type>` against the 13 writing types. If invalid, suggest the closest match and stop.
- Slug auto-generated from seed (Slug rules below) unless explicit.
- Date must fall in `[week_start, week_end]` for that `week_id`.
- Status set to `queued`.
- Conflict detection: if a non-skipped row already matches the Date, surface the conflict and stop. Ask the user to `skip` first or pick another date.
- Source defaults to `—` (manual addition).

### `/agenda skip <date>`

- Compute `week_id` from `<date>`. If `<week>/plan.md` does not exist: refuse and instruct the user to run `plan-week` first.
- Find the row matching Date and set its Status to `skipped`.
- If no row matches that Date, append a row: Type=`—`, Slug=`—`, Platform=`—`, Source=`—`, Status=`skipped`.
- Used to silence a recurring rule (holiday, travel). Does not delete the rule.

### `/agenda done <slug>`

- Search `<active week>/plan.md` first, then up to 4 prior weeks (`scribetronic/calendar/<week_id>/plan.md`).
- Find the row whose Slug column matches `<slug>`. Set its Status to `published`.
- Idempotent: if the row is already `published`, no-op.
- Auto-called by `/write-publish` after a successful publish — manual invocation is for backfilling.

### `/agenda rules [edit]`

- No arg: print current `scribetronic/calendar/rules.yaml` formatted as a table (name, when, type, active window, overrides).
- `edit`: open the file in `$EDITOR`. Do not mutate without user confirmation.

## Resolution algorithm

For a given date D:

```
1. week_id = ISO week containing D (date +%G-W%V).
2. Read scribetronic/calendar/<week_id>/plan.md (if exists).
   - Find row with Date == D. If found:
     - Status == skipped → return null.
     - Otherwise → return (type, slug, seed-equivalent, status). Source = "plan".
3. Read scribetronic/calendar/rules.yaml. Apply rule resolution per the inline algorithm:
   - Filter by active_from / active_until window.
   - Match `when`.
   - Apply `overrides` (each rule's `overrides` list contains `name`s of OTHER rules it beats).
   - If multiple still survive: latest in file wins.
   - Expand seed_template variables.
4. If nothing matches: return null.
```

**Order is fixed: plan beats rules. Skip beats both.**

## Status enums

Two distinct enums for two distinct files. Do not mix.

### `plan.md` `Status` column

| Value | Meaning |
|---|---|
| `queued` | Planned but not yet drafted. Default state when seeded by `plan-week` or `add`. |
| `drafted` | A draft exists for this slug. Set by `/write` Phase 6. |
| `published` | Published. Set by `/write-publish` (or `/agenda done` for backfill). |
| `skipped` | The row's date is suppressed. Set by `/agenda skip`. |

### Allowed `plan.md` Status transitions

| From | To | Writer |
|---|---|---|
| `queued` | `drafted` | `/write` Phase 6 |
| `queued` | `skipped` | `/agenda skip` |
| `drafted` | `published` | `/write-publish` |
| `published` | `published` | no-op (idempotent) |

### `plan.md` Status-write ownership

| Writer | Writes |
|---|---|
| `/agenda plan-week` | seeds rows as `queued` |
| `/agenda skip` | sets `skipped` |
| `/write` Phase 6 | sets `drafted` |
| `/write-publish` | sets `published` |

### `history.md` `Status` column

| Value | Meaning | Written by |
|---|---|---|
| `drafted` | `/write` recorded a draft event. | `/write` |
| `ready` | Phase 6 of `/write` completed. Draft has passed editing + slop check. | `/write` |
| `published` | `/write-publish` succeeded. | `/write-publish` |

**Ownership rule (do not violate):** only `/write` writes `drafted` and `ready` to `history.md`. Only `/write-publish` writes `published`. `/agenda` never writes to `history.md`.

## File contracts

### `plan.md`

Frontmatter:

```yaml
---
week: 2026-W18
week_start: 2026-04-27
week_end: 2026-05-03
newsletter_seed: "<the seed passed to /agenda plan-week>"
created: YYYY-MM-DD
---
```

Body H1: `# Plan: Week of <week_start> (<WNN>)`

Table — exact column order, exact column names:

```
| Date | Day | Type | Slug | Platform | Source | Status |
```

| Column | Format |
|---|---|
| Date | `YYYY-MM-DD`, must fall in `[week_start, week_end]` |
| Day | `Mon`/`Tue`/`Wed`/`Thu`/`Fri`/`Sat`/`Sun` (3-letter, capitalized) — must match Date's actual weekday |
| Type | one of the 13 writing types |
| Slug | kebab-case, ≤ 60 chars, unique within the week |
| Platform | `x` / `linkedin` / `threads` / `carousel` / `(blog)` — `(blog)` ONLY for the newsletter row |
| Source | `newsletter`, `newsletter (thread)`, `rule:<rule-name>`, or `—` (em dash, U+2014) |
| Status | one of: `queued`, `drafted`, `published`, `skipped` |

Example body:

```
# Plan: Week of 2026-04-27 (W18)

| Date | Day | Type | Slug | Platform | Source | Status |
|---|---|---|---|---|---|---|
| 2026-04-27 | Mon | observation | mw18-product2-recap-mon-observation | x | newsletter (thread) | queued |
| 2026-04-28 | Tue | x-vs-y | mw18-product2-recap-tue-xvsy | linkedin | newsletter (thread) | queued |
| 2026-04-29 | Wed | listicle | mw18-product2-recap-wed-listicle | x | newsletter (thread) | queued |
| 2026-04-30 | Thu | carousel | mw18-product2-recap-thu-carousel | linkedin | newsletter (thread) | queued |
| 2026-05-01 | Fri | observation | mw18-product2-recap-fri-observation | threads | newsletter (thread) | queued |
| 2026-05-03 | Sun | long-form-weekly-newsletter | mw18-product2-recap | (blog) | — | queued |
```

### `history.md`

Lives at `scribetronic/calendar/history.md`. Markdown table:

```
| Date | Type | Slug | Status | Source |
|---|---|---|---|---|
| 2026-04-26 | long-form-weekly-newsletter | mw17-shipping-the-store | ready | /write |
| 2026-04-26 | long-form-weekly-newsletter | mw17-shipping-the-store | published | /write-publish |
```

Append-only. One row per event. Status from the `history.md` enum above. Source is the slash command that produced the row. `/agenda` only READS this file.

### `rules.yaml`

Lives at `scribetronic/calendar/rules.yaml`. Source of truth is the inline schema in the file itself. Top-level key is `rules:` (a list). Each rule has `name`, `when`, `type`, optional `seed_template`, `active_from`, `active_until`, `overrides`. Selectors: `weekday` (full word), `monthday` (1..31 or negative), `nth_weekday_of_month` ("first sunday" etc).

The recurring Sunday rule is `long-form-weekly-newsletter`. **No `id`, no `priority`, no `cron`, no `schedule` field.** If you find them in code or docs, that's a bug — fix it to match this file.

### Draft frontmatter (for reference — written by `/write`, not `/agenda`)

Newsletter (`<week>/newsletter.md`):

```yaml
type: long-form-weekly-newsletter
status: draft
created: YYYY-MM-DD
week: YYYY-WNN
seed: "..."
length_words: <N>
```

Derivative (`<week>/derivatives/<weekday>-<type>-<slug>.md`):

```yaml
type: <short-form type>
status: draft
created: YYYY-MM-DD
week: YYYY-WNN
day: YYYY-MM-DD
platform: x | linkedin | threads | carousel
parent: newsletter
seed: "..."
length_chars: <N>
```

Derivative filenames use `<weekday>-<type>-<slug>.md` where weekday is `mon`/`tue`/`wed`/`thu`/`fri`/`sat`/`sun` (lowercase, 3 letters). NO `-x`/`-li`/`-threads` suffix — each derivative is ONE file, and its platform lives in the frontmatter.

## Seed templates

Variables are expanded by the resolver before returning the slot to its caller. Available variables (all derived from the slot's date):

| Variable | Resolves to | Example |
|---|---|---|
| `{{date}}` | ISO date | `2026-05-03` |
| `{{weekday}}` | full weekday name, lowercase | `sunday` |
| `{{week_start}}` | Monday of slot's ISO week | `2026-04-27` |
| `{{week_end}}` | Sunday of slot's ISO week | `2026-05-03` |
| `{{month_name}}` | full English month name | `May` |
| `{{month_num}}` | 2-digit month | `05` |
| `{{year}}` | 4-digit year | `2026` |

Unknown variables are left literal and a warning is printed. The expansion happens BEFORE the slot is returned — `/write` Phase 0 receives a fully-expanded seed string.

## Output format for `show`

Compact tables, one block per week in the window. One row per day. Empty days are listed (the gap is information).

```
Week of 2026-04-27 (W18) — scribetronic/calendar/2026-W18/plan.md
  Date        Day  Slot                          Slug                                  Status
  2026-04-27  Mon  observation                   mw18-product2-recap-mon-observation   queued
  2026-04-28  Tue  x-vs-y                        mw18-product2-recap-tue-xvsy          queued
  2026-04-29  Wed  listicle                      mw18-product2-recap-wed-listicle      drafted
  2026-04-30  Thu  carousel                      mw18-product2-recap-thu-carousel      queued
  2026-05-01  Fri  observation                   mw18-product2-recap-fri-observation   queued
  2026-05-02  Sat  —                             —                                     —
  2026-05-03  Sun  long-form-weekly-newsletter   mw18-product2-recap                   queued

Week of 2026-05-04 (W19) — (no plan.md — run /agenda plan-week 2026-05-04)
  Date        Day  Slot               Slug                                  Status
  2026-05-04  Mon  —                  —                                     —
  ...

Recently published
  2026-04-26  long-form-weekly-newsletter  mw17-shipping-the-store
  2026-04-19  long-form-weekly-newsletter  mw16-the-store-redesign
  2026-04-12  long-form-hot-take           stop-launching-on-product-hunt
```

## Slug rules

Same convention as `/write`:

1. Explicit slug if user wrote one.
2. Otherwise: first 4-6 meaningful words from the seed → kebab-case.
3. Max 60 chars. Strip stopwords if needed to fit.
4. Newsletter slug carries the `mw{week_num}-` prefix. Derivative slugs extend the newsletter slug with `-<day-token>`.

## Anti-patterns

- Don't write to `history.md` from `/agenda`. That file is owned by `/write` and `/write-publish`.
- Don't auto-resolve a `plan.md` conflict (two non-skipped entries on the same date). Surface it.
- Don't silently mutate `rules.yaml`. `/agenda rules edit` opens the file; the user confirms changes by saving.
- Don't infer rules from history. The recurring schedule is declarative — only `rules.yaml` defines it.
- Don't show a 12-week window by default. 4 weeks is the working horizon.
- Don't introduce new fields to `rules.yaml`. The schema is closed (see the file).
- Don't put a platform suffix on derivative filenames (no `-x`/`-li`/`-threads`). Platform lives in the frontmatter.
- Don't auto-create week directories. The week dir is created ONLY by `/agenda plan-week`.
- Don't reference or re-introduce a top-level queue file. The week's `plan.md` is the only queue.
- Don't consume from `scribetronic/ideas/`. The ideas pool is writer-owned and out of scope for this skill.

## Failure modes

Resolver behavior is **resilient by default**:

- **`rules.yaml` missing or invalid:** treat as "no rules". Resolver falls through to plan-only resolution. Print a one-line warning on `show`.
- **`<week>/plan.md` missing:** treat as empty for that week. Resolver falls through to rules-only.
- **`history.md` missing:** `show` simply omits the "recently published" footer.
- **Week dir missing for `/agenda add`:** refuse, print: "no plan for <week_id> — run /agenda plan-week <date> first".
- **Week dir missing for `/agenda skip`:** same — refuse, instruct to run `plan-week` first.
- **All sources missing:** resolver returns null for every date. `show` prints: "calendar not initialized — use `/agenda plan-week <date>` to start".
- **Unknown type in `plan.md` or `add`:** suggest the closest match from the 13. Don't invent.
- **Date in the past for `add`:** warn but allow (backfill is valid).
- **Unknown variable in `seed_template`:** leave literal, warn once.
- **`plan-week` with existing dir and no `--replace`:** abort, print the existing path. Never overwrite.

`/agenda plan-week` is the only operation that creates a week directory. `/agenda add` and `/agenda skip` only modify an existing `plan.md`. `/agenda show`, `/agenda done`, and `/agenda rules` are read-mostly (only `done` writes, and only to flip a Status cell).
