# Skills Catalog

Scribetronic ships 21 skills, organised into four groups:

- **3 orchestrators** — user-invokable entry points.
- **4 shared** — voice, editing, slop-detection, style extraction.
- **6 long-form types** — newsletters, devlogs, retros, manifestos, etc.
- **8 short-form types** — derivatives produced from long-form.

Slash commands match the skill folder name verbatim. For example, `long-form-weekly-newsletter/SKILL.md` is invoked as `/long-form-weekly-newsletter`.

You typically only invoke the three orchestrators directly. Type skills are loaded by orchestrators.

---

## Orchestrators (3)

These are the only skills you should invoke routinely.

### `/agenda`

Cadence and week scaffolding. Owns `rules.yaml`, `plan.md`, and `history.md` reads.

**When to use:** at the start of a week (scaffold), to inspect today's slot (show), or to skip a day.

**Subcommands:**
- `/agenda show [date]` — print today's (or a specific date's) resolved slot.
- `/agenda plan-week <date>` — scaffold the week containing `<date>` with default rotation.
- `/agenda add <date> <type> [slug]` — add a row to a week's plan.
- `/agenda skip <date> [reason]` — set a row's status to `skipped`.
- `/agenda done <date>` — manually flip a row to `published` (rare; usually `/write-publish` does this).
- `/agenda rules` — pretty-print the active rules.

**Source-of-truth:** `calendar/rules.yaml`, `calendar/<week>/plan.md`, `calendar/history.md`.

---

### `/write`

Drafting pipeline: seed → draft → edit → slop-check → repurpose. Six phases.

**When to use:** any time you sit down to write a piece.

**Phases:**
1. Routing — consults the agenda if no type is given.
2. Seed — captures topic via positional arg, `--from <file>`, or 2–4 questions.
3. Draft — generates the post, saves to the week directory.
4. Edit — runs `/editing-pass`.
5. Slop check — runs `/ai-slop-check`. Cap of 2 passes.
6. Final output — sets `status: ready`, flips `plan.md` row to `drafted`, appends to `history.md`.

For long-form, Phase 5 (repurpose) generates derivatives from queued rows in the week's `plan.md`.

**Source-of-truth:** type templates under `long-form-*/SKILL.md` and `short-form-*/SKILL.md`, plus `writing-style/SKILL.md`.

---

### `/write-publish`

Publishing to blog target + social archive. Eleven steps.

**When to use:** when a draft is in `status: ready` and you want to ship.

**Behaviour:**
1. Reads `publish-config.yaml` for targets, frontmatter mappings, and gates.
2. Resolves the target draft by slug.
3. Pre-flight: blocks unless `status: ready`, blocks on HIGH slop (unless `--force`).
4. For long-form, generates publish frontmatter per config mappings.
5. Writes to the target path (idempotent — identical content no-ops).
6. Updates draft frontmatter to `status: published` with `published_date`.
7. Archives sibling derivatives to `social_archive/<platform>/`.
8. Appends to `calendar/history.md`.
9. Flips `plan.md` row to `published`.
10. Optionally archives the week if all rows are terminal (and `archive_completed_weeks: true`).

**Source-of-truth:** `publish-config.yaml`.

---

## Shared (4)

These are loaded by orchestrators, not invoked directly. Listed here for reference.

### `/writing-style`

The voice base. Every long-form template inherits from it.

**When loaded:** every drafting phase loads it first. Non-negotiable.

**Owned by:** the user, edited via `scribetronic style`.

---

### `/editing-pass`

Craft pass split into 5 sub-passes:
1. Sentence-level rhythm.
2. Cliché and dead phrase removal.
3. Concision (cut 10–20%).
4. Specificity (replace abstracts with concretes).
5. Voice alignment (snaps drift back to `writing-style/`).

**When loaded:** Phase 3 of `/write`.

---

### `/ai-slop-check`

Detects AI-slop signatures. Three severity levels:

- **HIGH** — disqualifying. Auto-fix attempted, capped at 2 passes.
- **MEDIUM** — flagged. Asks user (or auto-fixes if `--auto`).
- **LOW** — surfaced for awareness, no action required.

Common HIGH patterns: "in conclusion", "delve into", "the realm of", excessive em-dashes, three-part lists in every paragraph, hedging stacks ("it could be argued that perhaps").

**When loaded:** Phase 4 of `/write`. Also Phase 3 of `/write-publish` if `strict_slop_check: true`.

---

### `/style-extract`

Utility skill that reads a corpus and produces a `writing-style/SKILL.md` candidate.

**When to use:** rare. Useful when bootstrapping voice from existing writing samples.

**Inputs:** a directory of markdown files representing your published work.

**Outputs:** a draft `writing-style/SKILL.md` with extracted voice characteristics.

---

## Long-form types (6)

Inherit from `../writing-style/SKILL.md`. Saved to `calendar/<week>/newsletter.md`.

### `/long-form-weekly-newsletter`

Recurring Sunday default. The engine of the weekly cadence — every derivative comes from here.

- **Length:** 800–1500 words.
- **Cadence:** weekly.
- **Inherits:** `writing-style/`.
- **Structure:** opening hook → central tension → 3–7 enumerated points → forward-looking conclusion.

This is what scribetronic optimises for. If you only use one long-form type, use this one.

---

### `/long-form-monthly-devlog`

Monthly build retrospective. What you shipped, what you learned, what's next.

- **Length:** ~1500 words.
- **Cadence:** monthly (first Sunday by default; configurable).
- **Inherits:** `writing-style/`.
- **Structure:** highlights → numbers → what shipped → what didn't → next month.

---

### `/long-form-hot-take`

Opinion piece. Defends a single position with conviction.

- **Length:** 600–900 words.
- **Cadence:** ad-hoc.
- **Inherits:** `writing-style/`.
- **Structure:** thesis → 2–3 supporting arguments → counter → reaffirmation.

---

### `/long-form-how-to`

Tutorial. Step-by-step instruction with code examples.

- **Length:** variable (often 1000–2500 words).
- **Cadence:** ad-hoc.
- **Inherits:** `writing-style/`.
- **Structure:** problem → setup → numbered steps → verification → troubleshooting.

---

### `/long-form-launch-retro`

Launch retrospective. What you shipped, how it went, what worked, what didn't.

- **Length:** ~1200 words.
- **Cadence:** ad-hoc (one per launch).
- **Inherits:** `writing-style/`.
- **Structure:** what shipped → numbers → what worked → what didn't → lessons.

---

### `/long-form-manifesto`

Position piece. Stake out a worldview.

- **Length:** 800–1500 words.
- **Cadence:** ad-hoc (rare — typically quarterly or less).
- **Inherits:** `writing-style/`.
- **Structure:** opposing view → why it's wrong → your view → implications.

---

## Short-form types (8)

Used by Phase 5 of `/write` to produce derivatives from a long-form piece. Saved to `calendar/<week>/derivatives/<weekday>-<type>-<slug>.md`.

Inherit from `../writing-style/SKILL.md` and apply deltas from `../short-form-voice-adjustments/SKILL.md`.

### `/short-form-x-vs-y`

Comparison post. Two things juxtaposed; the contrast IS the content.

- **Length:** 100–280 chars (X) / 1300 chars (LinkedIn).
- **Pattern:** "X is [property]. Y is [opposite property]. Pick one."
- **Best for:** controversial-but-defensible takes.

---

### `/short-form-listicle`

Numbered list. 3–7 items. Each item one line.

- **Length:** 280 chars (X thread possible) / variable (LinkedIn).
- **Pattern:** Hook + N items + close.
- **Best for:** distilling a long-form's enumerated points.

---

### `/short-form-observation`

Single-thought observation. One sentence, sharp.

- **Length:** 100–280 chars.
- **Pattern:** "[surprising claim]." or "[setup]. [punchline]."
- **Best for:** a long-form's opening hook, repurposed.

---

### `/short-form-motivational`

Encouragement / conviction. Direct address to the reader.

- **Length:** 200–280 chars.
- **Pattern:** "[Reader belief]. [Counter]. [Action]."
- **Best for:** mid-week energy posts.

---

### `/short-form-present-vs-future`

Where-we-are vs where-we-go. Time-axis comparison.

- **Length:** 200–280 chars.
- **Pattern:** "Now: [state]. Soon: [forecast]. Get ready."
- **Best for:** a long-form's forward-looking conclusion, repurposed.

---

### `/short-form-thread-from-longform`

Multi-tweet thread derived from a newsletter's structure.

- **Length:** 5–10 tweets, each 200–280 chars.
- **Pattern:** Hook → N points (one per tweet) → CTA.
- **Best for:** a long-form's enumerated points, repurposed for thread format.

---

### `/short-form-carousel-li`

LinkedIn carousel. 6–10 slides, each one strong sentence.

- **Length:** 6–10 slides × ~80 chars per slide.
- **Pattern:** Cover slide → N content slides → close slide.
- **Best for:** a long-form's enumerated points, repurposed for LinkedIn carousel format.

---

### `/short-form-voice-adjustments`

Voice deltas applied on top of `writing-style/` for short-form. Captures what changes when you go from 1000 words to 280 characters: more punch, less hedging, no bridges.

**This is not a content type — it's a modifier loaded by the other 7 short-form skills.**

---

## Quick lookup

| You want to... | Run |
|---|---|
| See what's scheduled today | `/agenda show today` |
| Plan next week | `/agenda plan-week monday` |
| Skip a day | `/agenda skip 2026-05-08 "travel"` |
| Write the Sunday newsletter | `/write` (auto-routes via agenda) |
| Write an ad-hoc hot take | `/write long-form-hot-take "<seed>"` |
| Generate this week's derivatives | `/write --repurpose` |
| Publish a finished draft | `/write-publish <slug>` |
| Edit your voice | `scribetronic style` (in your shell) |

For the data contracts these skills depend on, see [contracts.md](contracts.md).
