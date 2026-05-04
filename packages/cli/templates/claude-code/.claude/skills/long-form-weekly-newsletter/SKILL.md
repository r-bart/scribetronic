---
name: long-form-weekly-newsletter
description: Weekly newsletter — the parent piece of the week. ~600-1200 words. Drafted Sunday. Spawns 5-7 derivative short-form pieces for X / LinkedIn / Threads via /write Phase 5. The recurring Sunday default.
---

## Metadata

- **inherits**: `../writing-style/SKILL.md`
- **length target**: 600-1200 words
- **cadence**: weekly

# long-form-weekly-newsletter

The long-form parent piece of the week. Drafted Sunday. Designed so each section can be spun out into a short-form piece during the week (thread, observation, x-vs-y, listicle, carousel). If a section can't be spun out, it shouldn't be in the newsletter.

This is the default Sunday recurring piece — the one that anchors the week. Voice and tone come from `writing-style/SKILL.md` — this skill only owns the format and the spin-out contract with `/write --repurpose`.

## Structure

```
[Title: "Mw{N} — <hook>"]
[1-line subtitle: what this week was actually about]

[Opener — 2-3 sentences. Name what this week was about. Set the tone. No housekeeping, no "before we begin".]

[Theme 1 — ~150-250 words]
The biggest thing of the week. One concrete change, observation, or decision.
Lead with the number or the noun, never with "This week I…".
Change → context → takeaway.

[Theme 2 — ~150-250 words]
Same shape. Second-most-important thread of the week.

[Theme 3 — ~100-200 words]
Tighter. A smaller observation, a conversation that stuck, or a frame that
clicked. Optional fourth theme only if it earns its place.

[Insights / What I learned — 3-4 bullets, each 1-2 sentences]
- Observations from THIS week. Not evergreen wisdom.
- Each one tied to a thing that actually happened.
- If the bullet could've been written 6 months ago, cut it.

[Looking ahead — 2-3 concrete things shipping or shifting next week]
Concrete. Dated where possible. No "keep building".

[Closer — 1-2 sentences]
Question, stake, or clean stop. No "let's see where it takes us".
```

> **Every theme should be spinnable into at least one derivative.** If a section has no plausible thread / observation / x-vs-y / listicle / carousel angle, cut it or merge it.

## Rules specific to this format

- Lead with a number, a noun, or a concrete fact. Never with "This week was…".
- Length cap: 1200 words. If you blow past, you're writing a manifesto or a devlog — move it to `long-form-monthly-devlog` or split.
- 3-4 themes max. More than that → you're recapping, not selecting.
- Insights are dated to THIS week. If the insight could've been written 6 months ago, cut.
- Each theme must have a derivative angle in mind before you write it (see Workflow step 2).
- No section break should be wasted on housekeeping (no "before we begin…", no "quick housekeeping note").
- Numbers stay honest. €0 is €0. If conversion was 1.2% say 1.2%, not "early signal".
- Title format: `Mw{N} — <hook>` where N is the week number of the month-week sequence. The hook is a noun phrase or a stake, not a vibe.

## Anti-patterns specific to this format

- "This week was a good week." — start with content, not summary judgment.
- More than 4 themes — pick the ones that matter, kill the rest.
- A theme that has no derivative angle — kill it or merge it into another theme.
- Coach-speak (transformational, journey, embark, unleash, unlock) — strike on sight.
- "Not just X but Y" — banned construction.
- Three-adjective stacks ("clear, focused, intentional") — pick one.
- Soft closer ("Let's see where it takes us", "Onwards", "Here's to next week") — banned.
- Insights that read like LinkedIn quotes — kill on sight.
- TL;DR at the top — the structure IS the TL;DR.
- Emoji headers (this is the long-form piece).

## Workflow

1. Open with: what was the **single biggest thing** this week? That's Theme 1. If you can't name it in one sentence, you haven't found it yet.
2. Pick 2-3 supporting themes. For EACH, jot the derivative angle in 5 words max ("→ thread on shipping vs launching"). If you can't, drop the theme.
3. Draft each theme: change/observation → context → takeaway. Lead with the concrete. End with a frame, a feeling, or a next step — pick one, not all three.
4. Write the insights bullets — each tied to something that actually happened this week. 3-4 max.
5. Looking ahead: 2-3 concrete shippables. Dated where possible.
6. Closer: pick one shape (question / stake / clean stop). Re-read the last line aloud. If it fades, rewrite.
7. Run `editing-pass` and `ai-slop-check`.
8. Annotate which sections will spin out into which derivatives — this annotation is what `/write --repurpose` reads later. Use the spin-out map block below.

## Spin-out map (annotate as a comment in your draft)

Add this as an HTML comment at the bottom of the draft. `/write --repurpose` parses it to generate the week's short-form pieces:

```markdown
<!--
Spin-out map for /write --repurpose:
- Theme 1 (shipping vs launching): → x-vs-y (LinkedIn carousel)
- Theme 2 (the €0 sales week): → observation (X)
- Theme 3 (5 mistakes I keep making): → listicle (X)
- Insights bullet #2: → observation (Threads)
-->
```

Format rules for the map:
- One line per derivative.
- `<source>: → <format> (<channel>)`.
- Source must reference a real section or bullet in the draft.
- Aim for 5-7 derivatives total per newsletter. Fewer than 5 means the newsletter is under-mined; more than 7 means you're stretching.
