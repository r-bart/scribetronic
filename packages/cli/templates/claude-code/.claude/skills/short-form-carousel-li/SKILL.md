---
name: short-form-carousel-li
description: LinkedIn carousel — multi-slide PDF post (8–10 slides typical). Derives from a long-form piece OR a strong listicle / how-to topic. Use when repurposing a published long-form into LinkedIn's highest-engagement format, or when a user has a step-by-step / numbered insight that benefits from one-idea-per-slide pacing.
inherits: ../short-form-voice-adjustments/SKILL.md
input: a long-form piece OR a strong listicle/how-to topic
format: LinkedIn carousel (PDF, 8-10 slides)
---

# short-form-carousel-li

A LinkedIn carousel is a swipe-through PDF post. High engagement on LinkedIn, requires its own structure — not a thread, not a post, not a slide deck for a talk.

This skill produces the **content** for the carousel, in slide-by-slide form. The visual design is a separate concern (Figma / Canva / Tella, etc.).

## When to use

- You have a strong listicle (5-8 items) that benefits from one-item-per-slide pacing.
- You have a how-to with 5-7 steps.
- You have a launch-retro with strong numbers — carousel format makes the numbers POP.

When NOT to use:
- Hot-takes — they need flow, not slide breaks.
- Observations — single slide isn't worth a carousel.
- Devlogs — too granular per item.

## Structure (8-10 slides)

```
SLIDE 1 — Cover
  - Bold title (5-9 words)
  - Subtitle (one line — the promise / outcome)
  - Author handle/photo

SLIDE 2 — The hook / pain
  - 1-2 sentence statement of the problem or contrarian claim
  - Optional: a strong number

SLIDES 3 to N-2 — Content (1 idea per slide)
  - Header: the point as a short line (3-7 words)
  - Body: 1-3 short sentences elaborating
  - Optional: a single concrete example, number, or short quote

SLIDE N-1 — Summary or "what to do now"
  - Restate the takeaway as a list of 3 actions OR 1 punchy summary

SLIDE N — CTA
  - "Found this useful? Follow [@handle] for more on [topic]."
  - Optional: link to long-form ("Full breakdown in my newsletter")
  - Save / share prompt OK here (LinkedIn norm) but kept simple
```

## Rules

- **One idea per slide.** If a slide has two points, split it.
- **Headers do the work.** Reader will skim headers first. Each header must convey the point standalone.
- **Bodies are short.** Max 30-40 words per slide.
- **Numbers, names, and dates earn slides.** A slide with a specific number is 3x more memorable than a slide with abstraction.
- **8-10 slides is the sweet spot.** Fewer = use a regular post. More = lose the audience by slide 12.
- **Cover slide must promise + deliver.** Don't bait. If your cover says "5 mistakes", the carousel must contain exactly 5 mistakes, named.

## Anti-patterns

- Carousels that are just a long post split into slides. The format requires reshaping.
- Slide bodies longer than 50 words. Reader is swiping, not reading an essay.
- Walls of text on cover slide. Cover = promise + author. That's it.
- "Save this!" / "Share this!" / 10 emojis on the CTA slide. Restrained CTA wins.
- Inconsistent slide structure. Once you set the pattern (header + body + example), stick with it across all content slides.

## Workflow

1. Confirm the source content is carousel-shaped (listicle, how-to with discrete steps, retro with numbers).
2. Draft the cover: title + 1-line promise.
3. Draft slides 3 to N-2, one idea per slide. Headers first, then bodies.
4. Draft the summary slide (N-1). Restate as actions or one punch.
5. Draft the CTA slide.
6. Read top-to-bottom. Cut any slide that doesn't earn its place. Aim for 8.
7. Hand off to design (Figma / Canva). Content is locked at this point.

## Output

A markdown file with one section per slide, ready to be designed visually.

```markdown
## Slide 1 — Cover
**Title:** [...]
**Subtitle:** [...]

## Slide 2 — Hook
[Body]

## Slide 3 — [point name]
**Header:** [...]
**Body:** [...]

...
```
