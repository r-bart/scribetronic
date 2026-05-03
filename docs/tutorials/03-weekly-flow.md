# Tutorial 3 — A full week, day by day

Estimated time: **30 minutes** of reading; one actual week of writing.

This tutorial walks through a complete weekly cycle: planning, drafting, repurposing, publishing. Use it as a mental model for how scribetronic actually feels in practice.

We'll use ISO week `2026-W18` (Mon 2026-04-27 → Sun 2026-05-03) as the example.

Prerequisites:
- You've completed [tutorial 01](01-new-project.md) or [tutorial 02](02-existing-project.md).
- `scribetronic init` is done; `scribetronic style` has been run; voice is authored.
- `publish-config.yaml` points to your real blog target.

---

## Sunday evening (2026-04-26) — Plan next week

You're winding down, but tomorrow is Monday. You want to know what to ship each day.

```
/agenda plan-week 2026-04-27
```

What you'll see:

```
✓ created scribetronic/calendar/2026-W18/
✓ created scribetronic/calendar/2026-W18/plan.md
  scaffolded with default rotation. 6 rows queued.

  Mon  observation        x          queued
  Tue  x-vs-y             linkedin   queued
  Wed  listicle           x          queued
  Thu  carousel           linkedin   queued
  Fri  observation        threads    queued
  Sun  weekly-newsletter  (blog)     queued
```

Open the file:

```markdown
---
week: 2026-W18
week_start: 2026-04-27
week_end: 2026-05-03
newsletter_seed: "<placeholder — fill in>"
created: 2026-04-26
---

# Plan: Week of 2026-04-27 (W18)

| Date       | Day | Type              | Slug                       | Platform  | Source              | Status  |
|------------|-----|-------------------|----------------------------|-----------|---------------------|---------|
| 2026-04-27 | Mon | observation       | <slug>                     | x         | newsletter (thread) | queued  |
...
```

**Edit two things:**

1. `newsletter_seed` — the actual topic of next Sunday's newsletter. This is the seed that everything else derives from.
2. The `Slug` column for each row. Don't agonise — placeholder slugs are fine; they're just identifiers.

For this example, suppose your seed is: **"What I learned shipping product #2"**. Update the file:

```markdown
---
newsletter_seed: "What I learned shipping product #2"
---

| Date       | Day | Type              | Slug                       | Platform  | Source              | Status  |
|------------|-----|-------------------|----------------------------|-----------|---------------------|---------|
| 2026-04-27 | Mon | observation       | mw18-launch-tooling        | x         | newsletter (thread) | queued  |
| 2026-04-28 | Tue | x-vs-y            | mw18-shipping-vs-launching | linkedin  | newsletter (thread) | queued  |
| 2026-04-29 | Wed | listicle          | mw18-five-ship-mistakes    | x         | newsletter (thread) | queued  |
| 2026-04-30 | Thu | carousel          | mw18-product2-recap        | linkedin  | newsletter          | queued  |
| 2026-05-01 | Fri | observation       | mw18-friday-shipping       | threads   | newsletter (thread) | queued  |
| 2026-05-03 | Sun | weekly-newsletter | mw18-product2-recap        | (blog)    | —                   | queued  |
```

Save. Commit:

```bash
$ git add scribetronic/calendar/2026-W18/
$ git commit -m "plan: 2026-W18"
```

You're done for Sunday. The week is scoped.

---

## Monday (2026-04-27) — But where's the newsletter?

Reality check: scribetronic produces derivatives **from** the newsletter. You can't repurpose what doesn't exist yet.

There are two strategies:

### Strategy A — Write the newsletter on Sunday in advance

If you wrote the newsletter last Sunday (i.e. you're working a week ahead), the derivatives flow naturally. Run `/write --repurpose` on Monday morning to generate the week's social posts from the already-written newsletter.

### Strategy B — Write the newsletter and derivatives the same Sunday

Write the newsletter Sunday afternoon, generate derivatives the same evening, and queue them up for the upcoming week.

This tutorial uses **Strategy B** (the common case). So Monday–Saturday, you publish what was generated last Sunday evening. Sunday afternoon, you write the newsletter for THIS week's recap, generate derivatives from it, and the derivatives go out next Mon–Sat.

If you're just starting and have no past newsletter to derive from, you can either:

1. Write the newsletter today (Monday) and skip the early-week derivatives — `/agenda skip 2026-04-27 "no source yet"`.
2. Write a newsletter explicitly forward-looking (about what you'll ship this week), draft it Monday, then publish derivatives Tue–Sat.

For the rest of this tutorial, assume you wrote a newsletter LAST Sunday (`2026-W17/newsletter.md`) and derivatives are already generated in `2026-W18/derivatives/` from it.

---

## Monday (2026-04-27) — Publish the observation

Monday's row says `observation` on `x` with slug `mw18-launch-tooling`. The derivative file should already exist from last week's `/write --repurpose`:

```bash
$ ls scribetronic/calendar/2026-W18/derivatives/
mon-observation-mw18-launch-tooling.md
tue-x-vs-y-mw18-shipping-vs-launching.md
wed-listicle-mw18-five-ship-mistakes.md
thu-carousel-mw18-product2-recap.md
fri-observation-mw18-friday-shipping.md
```

Read Monday's file, do a final pass:

```bash
$ cat scribetronic/calendar/2026-W18/derivatives/mon-observation-mw18-launch-tooling.md
---
type: observation
status: ready
created: 2026-04-26
week: 2026-W18
day: 2026-04-27
platform: x
parent: newsletter
seed: "What I learned shipping product #2 — tooling note"
length_chars: 247
---

Three weeks of building. One day of polish. The polish is the part that turns
a thing-that-works into a thing people use. Stop trying to skip it.
```

Looks good. Publish:

```
/write-publish mw18-launch-tooling
```

What scribetronic does:

```
✓ resolved derivative: 2026-W18/derivatives/mon-observation-mw18-launch-tooling.md
✓ pre-flight: status=ready, slop=clean
✓ archived to: scribetronic/social_archive/x/2026-04-27-mw18-launch-tooling.md
✓ updated draft frontmatter: status → published, published_date: 2026-04-27
✓ updated 2026-W18/plan.md: row 1 → published
✓ appended to history.md

Manual next steps:
  - Copy the post body and paste into X.
  - Stagger cross-platform posts at least 30 minutes apart.
```

You manually post to X (scribetronic does NOT auto-post — that's deliberate). Mark it done in your head.

---

## Tuesday–Saturday — Same flow, different days

Each day:

1. Read the derivative for that day.
2. Final-pass the text. Edit if needed.
3. Run `/write-publish <slug>`.
4. Manually post to the listed platform.

Two notes:

- **Saturday is empty by default.** No derivative was generated. Take a day off.
- **If you skip a day:** run `/agenda skip 2026-04-30 "travel"` to mark the row `skipped`. The pipeline tolerates this — `/write-publish` is fine running on the remaining rows.

---

## Sunday afternoon (2026-05-03) — Write the newsletter

The week's recap. This is the engine.

```
/write
```

Phase 0 (routing) reads today's `plan.md` row, sees `weekly-newsletter` queued, and proposes:

```
Today's slot: weekly-newsletter, slug mw18-product2-recap.
Seed: "What I learned shipping product #2"
Proceed? (y/N)
```

Confirm. Phase 1 (seed) loads `writing-style/SKILL.md` and the `long-form-weekly-newsletter` template, asks 2–4 questions to deepen the seed:

```
1. What's the surprising lesson nobody told you?
2. Which moment in the build felt the most "this is actually working"?
3. What would you do differently next time?
4. What's the one-line takeaway?
```

Answer each. Phase 2 (draft) generates the newsletter and saves to `scribetronic/calendar/2026-W18/newsletter.md`:

```yaml
---
type: weekly-newsletter
status: draft
created: 2026-05-03
week: 2026-W18
seed: "What I learned shipping product #2"
length_words: 1247
---

# What I learned shipping product #2

[full newsletter body]
```

Phase 3 (edit) runs `/editing-pass` automatically. The 5 sub-passes happen inline; you see a summary:

```
✓ editing-pass complete
  rhythm:      2 rewrites
  cliché:      1 cut
  concision:   removed 137 words (down from 1247 to 1110)
  specificity: 4 abstracts replaced
  voice:       2 voice-snaps
  status → edited
```

Phase 4 (slop check) runs `/ai-slop-check`:

```
✓ ai-slop-check: clean (LOW: 1, MED: 0, HIGH: 0)
  status → ready
```

Phase 5 (repurpose) reads next week's `plan.md` (you'd run `/agenda plan-week 2026-05-04` first if it doesn't exist yet) and asks:

```
Phase 5 — Repurpose. Generate derivatives for 2026-W19?
  Mon  observation        x         from newsletter (thread)
  Tue  x-vs-y             linkedin  from newsletter (thread)
  Wed  listicle           x         from newsletter (thread)
  Thu  carousel           linkedin  from newsletter
  Fri  observation        threads   from newsletter (thread)

Proceed? (y/N)
```

Confirm. Five derivatives are generated, each going through Phase 4's slop check. Saved to `2026-W19/derivatives/`. Status `ready`.

Phase 6 (final output):

```
✓ /write complete
  newsletter:  2026-W18/newsletter.md  (1110 words, ready)
  derivatives: 2026-W19/derivatives/   (5 files, all ready)
  plan.md:     2026-W18 row 6 → drafted
  history.md:  6 ready rows appended
```

You did your week's work in a single ~2-hour session.

---

## Sunday evening — Publish the newsletter

The newsletter is `ready`. Publish:

```
/write-publish mw18-product2-recap
```

What scribetronic does:

```
✓ loaded publish-config.yaml
✓ resolved newsletter: 2026-W18/newsletter.md
✓ pre-flight: status=ready, slop=clean
  (sibling derivatives all status=ready — passes auto-gate)

? Publish frontmatter:
  title:       <prompt>     → "What I learned shipping product #2"
  description: <prompt>     → "Six lessons from three weeks of building."
  pubDate:     <derived>    → 2026-05-03
  tags:        <draft.tags> → [shipping, lessons]

✓ wrote: src/content/blog/2026-05-03-mw18-product2-recap.mdx
✓ updated draft frontmatter: status → published, published_date: 2026-05-03
✓ no derivatives in 2026-W18 to archive (they're scheduled for 2026-W19)
✓ updated 2026-W18/plan.md: row 6 → published
✓ appended to history.md

Manual next steps:
  - npm run dev and review at /blog/mw18-product2-recap
  - Push the commit when satisfied
  - Schedule next week's social posts on Mon–Fri
```

Run your dev server, check the rendered output, commit, push.

---

## Sunday late evening — Plan next week

Your `2026-W19` directory already has derivatives from Phase 5. But the `plan.md` for that week might still be stub. If you ran `/agenda plan-week 2026-05-04` earlier, it's there. If not, run it now.

```
/agenda plan-week 2026-05-04
```

If the file already exists (because you scaffolded it before Phase 5), this is a no-op — `/agenda` refuses to overwrite. If you need to regenerate, delete the file first.

Edit the seed and slugs the same way you did last week. Commit.

You're ready for next week.

---

## Week archival (optional)

After every row in `2026-W18/plan.md` is `published` or `skipped`, you can archive the week:

```bash
$ mv scribetronic/calendar/2026-W18 scribetronic/calendar/archive/
```

Or set `archive_completed_weeks: true` in `publish-config.yaml` and `/write-publish` will prompt to archive on the last publish.

The archive keeps the calendar tree shallow. You can always grep `archive/` for past content.

---

## The rhythm in one paragraph

**Sunday afternoon: write newsletter, generate derivatives. Sunday evening: publish newsletter. Mon–Fri: publish one derivative per day. Saturday: rest. Repeat.**

The pipeline handles status transitions, file paths, frontmatter mutations, slop detection, and archive layout. Your only jobs are: choose a topic, write well, and click publish on the right days.

---

## What's next

You've now seen scribetronic in motion. From here:

- [philosophy.md](../philosophy.md) explains why this rhythm works.
- [customization.md](../customization.md) covers bending the cadence to your real schedule.
- [contracts.md](../contracts.md) documents the data formats your weeks live in.
- [skills.md](../skills.md) catalogs every skill so you know what's available.

The first month feels mechanical. The third month feels automatic. The sixth month, your past content starts compounding into your future content — and that's the actual point.
