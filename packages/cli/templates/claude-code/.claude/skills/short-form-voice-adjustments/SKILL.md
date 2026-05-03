---
name: short-form-voice-adjustments
description: Voice deltas for short-form (X, LinkedIn, Threads). Inherits writing-style and overrides specific rules where short-form requires it. Always loaded by short-form skills.
inherits: ../writing-style/SKILL.md
applies_to: [X/Twitter, LinkedIn, Threads]
---

# Short-form voice adjustments

The base voice (`writing-style/SKILL.md`) still applies. This file lists the deltas — where short-form requires you to break or sharpen a long-form rule.

## Why short-form is different

Three forces are stronger here than in long-form:

1. **The first 1-2 lines must earn the scroll-stop.** No setup. The hook IS the first sentence.
2. **Density beats nuance.** No room for the honest aside, the contrarian steelman, the worked example. Pick one move per piece.
3. **Closers are punches, not invitations.** No "let me know in the comments" — it screams engagement-bait.

## What's the same

- Voice, tone, anti-patterns from `writing-style/SKILL.md` all apply.
- Numbers up front still wins.
- "Not just X, but Y" still banned.
- Coach-speak still banned.
- Em-dash > parens still preferred.

## What changes

| Long-form rule | Short-form override |
|---|---|
| TL;DR up front | The hook IS the TL;DR. First line does both. |
| Sentence length variance (4-12-20-6) | Lean shorter. Most lines 3-12 words. One longer line for breathing. |
| Max 1 rhetorical question per piece | Same cap. But often the hook IS the question. |
| Paragraphs of 1-3 sentences | Single-line "paragraphs" are normal — visual rhythm via line breaks. |
| Cite tools/numbers/names | Even more critical. Specifics are 80% of why short-form posts work. |
| One Welsh-punctuation paragraph allowed | Still one cap. (Don't turn every line into "Why?".) |

## Hook patterns that work

Use one of these openers, never neutral framing:

1. **The number reveal.** _"€0 in sales after 3 months. Here's why I'm not stopping."_
2. **The contrarian assertion.** _"Choosing a niche is dead advice. Here's what to do instead."_
3. **The unexpected admission.** _"I haven't shipped a single thing this week. Here's what I did instead."_
4. **The list promise.** _"5 things I'd tell my 2024 self about launching solo. ↓"_
5. **The specific scene.** _"3am, debugging a Stripe webhook that worked yesterday."_

## Closer patterns that work

Use one, never the soft exit:

1. **Repeat the thesis as a command.** _"Just ship."_
2. **Specific next-action.** _"Try this for one week. Tell me if I'm wrong."_
3. **One-liner reframe.** _"The conversation is the work."_
4. **Sign-off with date/CTA.** _"Newsletter goes out Sunday. Link in bio."_

## Banned in short-form (in addition to base anti-patterns)

- "Hot take:" preface — show, don't label.
- "Hear me out…" — same.
- "Unpopular opinion…" — same. If it's actually unpopular, the post will prove it.
- Listing 5+ ideas that don't compose into one point. Pick one.
- Emoji bullet lists in LinkedIn (🔥 ✅ 🚀 X 5). Reads as 2018 spam.
- "What's your take? 👇" — engagement bait.
- "Save this for later 🔖" — engagement bait.

## Platform-specific notes

### X / Twitter
- Single posts: ~280 chars. Hook + payoff. No fluff.
- Threads: see `short-form-thread-from-longform/SKILL.md`.
- Line breaks every 1-2 sentences for scannability.

### LinkedIn
- 1300 char "see more" cutoff — first 3 lines must earn the click.
- Slightly more structure than X (2-4 short paragraphs OK).
- Still no emoji bullets.
- Carousels: see `short-form-carousel-li/SKILL.md`.

### Threads
- Closer to X in tone but tolerates slightly longer.
- Conversational > authoritative. Slightly more first-person, slightly less Welsh-tone.
- Lower stakes — Threads is where you can be more playful with the rules.
