---
name: ai-slop-check
description: Detection pass for AI-generated patterns and clichés. Final check before publishing. Returns a list of detected issues with severity and fix suggestions.
---

## Metadata

- **inherits**: `../writing-style/SKILL.md`
- **applies to**: long-form/*, short-form/*

# ai-slop-check

Last pass before publishing. Scans for the patterns that signal "AI wrote this" or "human writing in a hurry adopted AI defaults".

The detection list below is the default. The user's `writing-style/SKILL.md` may add or override patterns — load it first when running this pass so any user-specific tics are checked alongside.

## How to run

Read the draft once with each category in mind. Mark every hit. Fix the high-severity ones. Decide on the medium ones. Ignore noise.

## Detection categories

### Severity: HIGH (always fix)

| Pattern | Example | Why |
|---|---|---|
| "Not just X, but Y" | "Not just a tool, but a community." | Top AI signature. |
| "It's not [A], it's [B]" | "It's not about money, it's about freedom." | Same family. |
| "In today's fast-paced world" | self-evident | Banned. |
| "Whether you're a X or a Y" | "Whether you're a beginner or pro…" | AI scope-padding. |
| "Let's dive in" / "Let's dive deeper" | self-evident | Banned. |
| "At the end of the day" | self-evident | Filler. |
| "It's worth noting that" | "It's worth noting that…" | If it's worth noting, just note it. |
| "Game-changer" / "game-changing" | self-evident | Banned. |
| "Unleash your potential" / "unlock your X" | self-evident | Coach-speak. |
| "Embark on this journey" | self-evident | Banned. |
| "In the realm of" / "in the world of" | "In the world of solopreneurship…" | Padding. |
| Three-noun stacks | "growth, innovation, and impact" | Cut to one. |
| Three-adjective stacks | "comprehensive, in-depth, transformational" | Cut to one. |
| "Transformational" / "transformative" | self-evident | Coach-speak. |
| Closer: "I invite you to join me on this journey" | self-evident | Banned. |
| Closer: "Let's see where it takes us" | self-evident | Banned. |
| Closer: "Excited to see what comes next!" | self-evident | Banned. |

### Severity: MEDIUM (fix unless intentional)

| Pattern | Example | Why |
|---|---|---|
| "Imagine if you could…" opener | self-evident | Cliché opener. |
| "But here's the thing:" | "But here's the thing: …" | Used 1-2x is fine. More = tic. |
| "The truth is…" | "The truth is, most…" | Often filler. |
| "Don't get me wrong" | self-evident | Hedging without payoff. |
| Multiple rhetorical questions in a row | "Why? Because. How? Like this." | One per post max. |
| "Pro tip:" call-out | self-evident | Often used to bury weak content. |
| "Stay tuned!" | self-evident | Replace with date/specific. |
| "More to come" | self-evident | Same. |
| Em-dash overuse (>5 in a 1000-word post) | — | Ration. |
| "Furthermore" / "moreover" / "in addition" | self-evident | Robotic transitions. Cut or replace with period. |
| "Indeed" | self-evident | Almost never earns its place in modern prose. |
| "It's important to note" | self-evident | If important, state it without preface. |
| Words: "delve", "leverage" (as verb), "harness", "cultivate" | self-evident | AI vocabulary. |
| "A testament to" | "This is a testament to…" | Banned. |

### Severity: LOW (consider, don't always fix)

| Pattern | Example | Why |
|---|---|---|
| Excessive bullets in long-form | — | Sometimes earned, sometimes lazy. |
| Repeated sentence openers ("I", "I", "I" three paragraphs running) | — | Vary if possible. |
| Capitalized headers in title case | "How To Build A Newsletter" | Sentence case usually reads better — "How to build a newsletter". |
| Ending with "Cheers" or "Best" — fine for emails, weak for posts | — | Use sign-off pattern from style guide. |

## Output format

Generate a list of detected issues:

```
HIGH
- Line 23: "not just a number, but a vision" → rewrite as positive claim
- Line 47: closer is "Let's see where it takes us" → replace with specific commitment

MEDIUM
- Line 12: opens with "But here's the thing:" → consider cutting
- Line 31: 3rd "Pro tip:" of the post → consolidate or cut

LOW
- Title is in Title Case → consider sentence case
```

If zero HIGH and ≤2 MEDIUM, ship.
If 1+ HIGH or 3+ MEDIUM, revise and rerun.

## Quick "smell test"

If you're not sure, ask these 3 questions:

1. **Could a generic AI write this?** If yes, the post lacks personal-specific evidence. Add a number, a name, or a personal scene.
2. **Could this post appear in any other niche under any other byline?** If yes, it's too generic.
3. **Does the closer commit to something?** If not, the post leaks energy at the end.

If any answer is "no good", revise.
