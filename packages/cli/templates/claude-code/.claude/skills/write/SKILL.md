---
name: write
description: Master writing skill. Orchestrates the full pipeline (seed → draft → edit → slop-check → optional repurpose) for any post type — long-form (long-form-weekly-newsletter, long-form-monthly-devlog, long-form-hot-take, long-form-how-to, long-form-launch-retro, long-form-manifesto) or short-form (short-form-x-vs-y, short-form-listicle, short-form-observation, short-form-motivational, short-form-present-vs-future, short-form-thread-from-longform, short-form-carousel-li). Drafts live inside the active week's calendar directory. Invoke with `/write <type> "<seed>"` or just `/write` to be routed via interview. Interactive by default, autonomous with --auto.
---

# /write

Single entry point for the writing system. Loads the right templates, runs the pipeline, saves drafts inside the active week's calendar directory, and (for long-form) derives short-form repurposes.

## Invocation

```
/write                              → router: 2-3 question interview, picks type
/write <type>                       → directly to that type's draft flow
/write <type> "<seed>"              → with topic seed, skips topic interview
/write --from <file>                → seed from a notes/idea file
/write --repurpose <draft.md>       → skip everything, only run thread-from-longform
/write --edit <draft.md>            → skip drafting, only run editing-pass + ai-slop-check
/write --list                       → show the 13 types with one-line guidance
```

## Flags

| Flag | Effect |
|---|---|
| (none) | Default: interactive. Asks before each phase transition. |
| `--auto` | Run all phases end-to-end without confirmation prompts. Output the final draft. |
| `--step` | Alias for default (interactive). Explicit version. |
| `--draft-only` | Stop after Phase 2 (Draft). Skip edit + slop check + repurpose. |
| `--no-repurpose` | Run all phases except Phase 5 (Repurpose). |
| `--from <file>` | Use the file's content as input/notes for the draft. |
| `--repurpose <file>` | Jump to Phase 5 only. `<file>` must be an existing long-form draft. |
| `--edit <file>` | Jump to Phases 3+4 only. `<file>` must be an existing draft. |
| `--ignore-agenda` | Skip the agenda proposal in Phase 0; go directly to the type interview. |
| `--list` | Print the 13 types with one-line "use when" guidance. Exit. |

## Types (positional)

**Long-form:**
- `long-form-weekly-newsletter` — Sunday long-form weekly recap/newsletter (the recurring Sunday default)
- `long-form-monthly-devlog` — reflective monthly recap, ~1200-2000 words
- `long-form-hot-take` — contrarian opinion, ~800-1500 words
- `long-form-how-to` — actionable guide, ~1500-3500 words
- `long-form-launch-retro` — post-launch breakdown with numbers, ~800-1500 words
- `long-form-manifesto` — vision/strategy piece, ~1500-3000 words

**Short-form:**
- `short-form-x-vs-y` — comparison post
- `short-form-listicle` — numbered list post
- `short-form-observation` — single noticed thing
- `short-form-motivational` — motivational post (use sparingly, max 1-2/mo)
- `short-form-present-vs-future` — temporal contrast
- `short-form-thread-from-longform` — derives short-form pieces from existing long-form (alias for `--repurpose`-style flow when you want to start from a long-form file)
- `short-form-carousel-li` — LinkedIn carousel content

## Pipeline

### Phase 0 — Routing

If no type provided AND no `--repurpose`/`--edit` flag:

First, unless `--ignore-agenda` was passed, consult today's agenda via the active week's plan:

1. Compute `current_week` = ISO week of today using `date +%G-W%V` (note: `%G`, not `%Y` — required around year boundaries). Format is `YYYY-WNN` (e.g. `2026-W18`).
2. Look for `scribetronic/calendar/<current_week>/plan.md`.
   - If file missing: resolver returns null (no week scaffolded). The fallback interview (below) should suggest `/agenda plan-week today` before continuing.
3. Find rows in plan.md where `Date` == today AND `Status` == `queued`.
   - 0 matches → resolver returns null. Fall through to rules-only resolution per `/agenda`'s algorithm, then to the interview if still null.
   - 1 match → propose to the user:
     "Today's slot is `{type}` — '{seed}' (slug: `{slug}`). Proceed? (y / pick another / cancel)".
     - `y` → skip the interview; go to Phase 1 with that `type` + `seed` + `slug`.
     - `pick another` → fall through to the interview.
     - `cancel` → exit.
   - >1 matches → surface the conflict, list all rows, ask which one (or `pick another` / `cancel`).
4. The resolver is **resilient** — if `plan.md` is missing or malformed, it returns null. It will not throw.

Interview (fallback when no agenda slot, agenda declined, or `--ignore-agenda`):

Ask 2-3 questions, max:
1. "Long-form or short-form?"
2. (Long) "Is this about something you DID (devlog/retro/how-to) or something you THINK (hot-take/manifesto)?"
   (Short) "Comparing two things, listing items, sharing an observation, or repurposing a long-form piece?"
3. (If still ambiguous) one final disambiguating question.

Then proceed to Phase 1 with the chosen type.

If type IS provided: skip Phase 0.

### Phase 1 — Seed

Load context (mandatory order):

1. `writing-style/SKILL.md` (always).
2. The type's template file (e.g., `long-form-hot-take/SKILL.md`, `long-form-weekly-newsletter/SKILL.md`).
3. If short-form: also `short-form-voice-adjustments/SKILL.md`.

Then:

- If `--from <file>` was passed: read it as raw notes/seed.
- If a `"<seed>"` was passed positionally: treat it as the topic.
- If neither: ask 2-4 type-specific questions per the template's "Workflow" section.
   - Example for `long-form-hot-take`: "What's the conventional wisdom you're disagreeing with? What's your alternative? Concrete failure modes?"
   - Example for `long-form-weekly-newsletter`: "What did you ship this week? Any conversations/people moments? Insights from this specific week?"
   - Example for `long-form-launch-retro`: "What launched? When? What were the numbers? Pre-launch expectation?"

Stop after seed is captured. Confirm with user: "Ready to draft? (y / change seed / cancel)" — unless `--auto`.

### Phase 2 — Draft

Generate draft following the template's structure exactly. Apply `writing-style/SKILL.md` voice rules.

**Save path** — drafts live inside the active week's calendar directory:

1. Compute `current_week` = `date +%G-W%V` (format `YYYY-WNN`).
2. If `scribetronic/calendar/<current_week>/` does NOT exist, refuse with the message:
   > "No week scaffolded for `<current_week>`. Run `/agenda plan-week today` first."

   Do NOT auto-scaffold the week — that requires a newsletter seed and is owned by `/agenda plan-week`.
3. Determine the path:
   - For `type == long-form-weekly-newsletter`:
     ```
     scribetronic/calendar/<current_week>/newsletter.md
     ```
   - For all other types:
     ```
     scribetronic/calendar/<current_week>/derivatives/<weekday>-<type>-<slug>.md
     ```
     where `<weekday>` is today's weekday as a lowercase 3-letter abbreviation (`mon`/`tue`/`wed`/`thu`/`fri`/`sat`/`sun`).
   - Lazily create `derivatives/` if it doesn't exist yet.
   - **NO** `-x`/`-li`/`-threads`/`-carousel` suffix in the filename. ONE file per derivative — platform lives in the file's frontmatter.

**Frontmatter** — two shapes per Contract 6.

For `long-form-weekly-newsletter` at `<week>/newsletter.md`:

```yaml
---
type: long-form-weekly-newsletter
status: draft
created: YYYY-MM-DD
week: YYYY-WNN
seed: "<first 80 chars of seed>"
length_words: <N>
---
```

For derivatives at `<week>/derivatives/<weekday>-<type>-<slug>.md`:

```yaml
---
type: <one of the 7 short-form types>
status: draft
created: YYYY-MM-DD
week: YYYY-WNN
day: YYYY-MM-DD            # date this derivative is targeting
platform: x | linkedin | threads | carousel
parent: newsletter         # always
seed: "<first 80 chars>"
length_chars: <N>
---
```

> `published_date: YYYY-MM-DD` is appended later by `/write-publish` on successful publish. The `published` status is owned by `/write-publish` — `/write` never writes it.

Show the full draft to the user.

If interactive: ask "Continue to editing? (y / iterate draft / save & stop)".
If `--auto`: continue.
If `--draft-only`: stop here. Output draft path.

### Phase 3 — Edit

Run `editing-pass/SKILL.md` against the draft. Apply changes inline.

Output: same file, edited. The pre-edit version is preserved as `{filename}.draft.md` (suffix `.draft` before `.md`) **in the same directory** so the user can recover the unedited version.

Update frontmatter `status` to `edited`.

Show the edits as a diff or as the new full version (user choice if interactive).

If interactive: "Continue to slop check? (y / iterate edit / save & stop)".
If `--auto`: continue.

### Phase 4 — Slop check

Run `ai-slop-check/SKILL.md` against the edited draft.

Output: a report with issues by severity (HIGH / MEDIUM / LOW).

For HIGH issues: propose fixes inline. If interactive, ask before applying. If `--auto`, apply automatically and log.
For MEDIUM: surface, ask for decision (interactive) or apply if confidence is high (auto).
For LOW: just surface.

After fixes, re-run if any HIGH was fixed. Re-run cap: 2 passes total. If still HIGH after 2 passes, flag for manual review.

Update frontmatter `status` to `ready` (passes Phase 4 cleanly) or leave as `edited` (HIGH still unresolved after cap).

If interactive: "Mark as ready to publish? (y / iterate / save & stop)".
If `--auto`: continue.

### Phase 5 — Repurpose (long-form only)

Skip if:
- Type is short-form.
- `--no-repurpose` flag.
- User declines in interactive mode.

Otherwise, derive short-form pieces from the just-finished long-form parent (the newsletter):

1. Read `scribetronic/calendar/<current_week>/plan.md`.
2. Find rows whose `Source` is `newsletter` (or `newsletter (thread)`) AND whose `Status` is `queued`. These are the planned derivatives for this week.
3. For each such row, generate one derivative draft using `short-form-thread-from-longform/SKILL.md`. Save to:
   ```
   scribetronic/calendar/<current_week>/derivatives/<weekday>-<type>-<slug>.md
   ```
   where:
   - `<weekday>` is the row's `Day` (lowercase 3-letter abbreviation),
   - `<type>` is the row's `Type`,
   - `<slug>` is the row's `Slug`.
4. Frontmatter follows Contract 6's derivative shape. The `platform` field is taken from the plan.md row's `Platform` column. `parent: newsletter`.
5. If a derivative type proposed by Phase 5 has NO matching plan.md row:
   - Interactive: ask the user for the platform (and confirm slug).
   - `--auto`: skip that derivative with a warning logged in the final output.
6. Each derivative goes through Phase 4 (slop check) before save. Same severity handling, same re-run cap.

There is ONE file per derivative. The channel (X, LinkedIn, Threads, carousel) is recorded in the file's `platform` frontmatter — never in the filename suffix.

### Phase 6 — Final output

Print:

```
✓ Long-form: scribetronic/calendar/<current_week>/newsletter.md
✓ Edited: yes
✓ Slop check: clean (or: 1 MEDIUM unresolved)
Derivatives:
  - thu-thread-niches-are-dead       (platform: x)
  - fri-carousel-niches-are-dead     (platform: carousel)

Ready to publish:
  [ ] Final read-through aloud
  [ ] Cross-platform cadence check (don't ship X+LI+Threads same day)
  [ ] Schedule or post
```

Update frontmatter `status` to `ready` on the main draft (and on each derivative that passed Phase 4 cleanly).

Then update calendar bookkeeping (both files use markdown tables — see `agenda/SKILL.md` for the full schema):

1. **history.md** — append a row to the markdown table at `scribetronic/calendar/history.md`:
   ```
   | YYYY-MM-DD | {type} | {slug} | ready | /write |
   ```
   Use today's date. Schema: `| Date | Type | Slug | Status | Source |`. If the file or table is missing (first run), create it with the header documented in `agenda/SKILL.md` § File contracts, then append. Append one row per finalized draft (the newsletter and each derivative).

2. **plan.md** — for each finalized draft, find the row in `scribetronic/calendar/<current_week>/plan.md` whose `Slug` matches the draft's slug, and set its `Status` from `queued` to `drafted`. Plan column schema:
   ```
   | Date | Day | Type | Slug | Platform | Source | Status |
   ```
   The only transition `/write` is allowed to make is `queued → drafted`. ONE write per matched row. If no row matches: surface a warning (don't error — the user may have written off-plan).

**Status-write ownership (do not violate):**

- `/write` writes `drafted` (to plan.md) and `ready` (to history.md). Nothing else.
- `/write-publish` owns `published` rows in history.md and the `published` transition on plan.md.
- `/agenda skip` owns the `skipped` transition on plan.md.

This avoids race conditions when multiple flows touch the same files.

## Interactive prompts — phrasing rules

- Always offer 3 choices: continue (`y`), iterate (`change seed` / `iterate draft` / etc.), abort (`save & stop`).
- Never ask open-ended "what would you like to do?" — too vague.
- After a phase produces output, show the output IN the chat (don't just say "draft saved"). User must see what was written.
- If user says "iterate", ask ONE specific question: "What should change?" — don't run a 5-question questionnaire mid-flow.

## Slug rules

`{slug}` derivation, in priority order:
1. Slug from the matched plan.md row (if Phase 0 routed via agenda).
2. Explicit slug in seed (if user wrote one).
3. First 4-6 meaningful words from seed → kebab-case.
4. Auto from headline → kebab-case, max 60 chars.

## Examples

```
/write
→ Phase 0: reads scribetronic/calendar/2026-W18/plan.md. Finds today's queued slot.
→ "Today's slot is `long-form-weekly-newsletter` — 'shipping fast is overrated...'. Proceed? (y / pick another / cancel)"
→ y → loads long-form-weekly-newsletter template + writing-style.
→ Drafts to scribetronic/calendar/2026-W18/newsletter.md. Edits. Slop-checks.
→ Phase 5 reads plan.md, derives the queued thread + carousel rows. Done.

/write long-form-hot-take "shipping fast is overrated when you have no audience"
→ Loads long-form-hot-take template + writing-style.
→ Asks: "Whose advice are you disagreeing with? What's your alternative?"
→ Drafts to scribetronic/calendar/2026-W18/derivatives/mon-long-form-hot-take-shipping-fast-overrated.md.
→ Edits. Slop-checks. Repurpose? → derives matching plan.md rows.

/write --from scribetronic/ideas/idea-launch-retro.md
→ Reads file. Auto-detects type if possible (else asks).
→ Drafts using file as seed, into the active week's directory.

/write --repurpose scribetronic/calendar/2026-W18/newsletter.md
→ Skips Phases 0-4. Reads same week's plan.md, generates queued derivatives.

/write --edit scribetronic/calendar/2026-W18/derivatives/wed-short-form-thread-from-longform-niches-are-dead.md
→ Runs editing-pass + ai-slop-check on existing draft only.

/write --auto long-form-launch-retro "Product #2 — Boilerplate kit"
→ Asks zero questions beyond seed details. Runs end-to-end. Outputs final.

/write --list
→ Prints 13 types with one-line "use when" each.
```

## Anti-patterns

- Don't run any phase without loading `writing-style/SKILL.md` first. The voice base is non-negotiable.
- Don't skip the seed interview for ambiguous types — the 2-4 quick questions save 10 minutes of bad draft.
- Don't auto-fix MEDIUM slop issues without asking unless `--auto`.
- Don't generate a draft + 4 derivatives in one phase. Repurpose is its own phase, optional, separate output.
- Don't write outside `scribetronic/calendar/<current_week>/`. The week directory is the unit of organization.
- Don't append `-x`/`-li`/`-threads`/`-carousel` to filenames. ONE file per derivative; platform is in frontmatter.
- Don't auto-scaffold a missing week directory. Refuse and instruct the user to run `/agenda plan-week today`.

## Failure modes

- **No week scaffolded:** refuse with a message pointing to `/agenda plan-week today`. Do not create the directory.
- **User asks for a type that doesn't exist:** suggest the closest match from the 13. Don't invent.
- **No seed and `--auto`:** abort with error. `--auto` requires a seed (positional or `--from`).
- **Type is long-form but user wants only a thread:** suggest `/write short-form-thread-from-longform` or `/write --repurpose <file>` instead.
- **Edit conflicts (user already modified the draft between phases):** detect via mtime; ask before overwriting.
- **Slug not in plan.md at Phase 6:** warn ("off-plan draft — no plan.md row updated") but still complete the run and append to history.md.
