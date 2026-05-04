---
name: short-form-thread-from-longform
description: Derives an X thread (and optionally LinkedIn post + Threads post) from a long-form piece. Repurposing engine — chops one published long-form into 2-4 short-form derivatives so the writing system stays sustainable. Use after a long-form is drafted (and ideally edited) when you want to extract its substance for social channels.
---

## Metadata

- **inherits**: `../short-form-voice-adjustments/SKILL.md`
- **input**: a long-form piece from skills/long-form-* output (devlog, hot-take, how-to, launch-retro, manifesto)
- **formats**: X thread, LinkedIn post, Threads post

# short-form-thread-from-longform

Takes a finished long-form piece and produces 1-3 short-form derivatives. This is the engine that makes the writing system sustainable — without it, you're writing twice.

The repurposing principle: one well-structured long-form should yield 6-12 candidate short-form pieces; ship 2-4 of them, spread over 1-2 weeks.

## Inputs

The long-form post — must be already drafted and ideally already through `editing-pass`.

## Workflow

1. **Read the long-form. Identify the 1 thesis sentence.** That's your thread hook anchor.
2. **Identify 3-7 substantive sub-points** that compose the argument. These become thread tweets.
3. **Identify 1-2 standalone observations** that work without the rest of the post. These become candidates for `short-form-observation`-style standalone posts.
4. **Identify 1 listicle-shaped section** if any (lessons, mistakes, steps). Candidate for `short-form-listicle`.
5. **Pick the format that earns its keep.** Don't always do all 3. The thread is usually mandatory, the LinkedIn post often, the standalone observation only when one really stands out.

## Structure — X thread

```
1/ [Hook tweet — the thesis as a scroll-stopper. Number-led if applicable. Promise of what the thread delivers.]

2/ [Setup — 1-2 lines of context. The pain or the conventional wisdom you're addressing.]

3/ [Sub-point 1 — declarative line + 1 short example/number.]

4/ [Sub-point 2 — same.]

...

N/ [Closer tweet — the rule, the punch, the takeaway.]

N+1/ [Soft CTA: "Wrote about this in detail here: [link to long-form]"]
```

## Structure — LinkedIn post derivative

```
[Hook = thesis sentence, possibly rephrased to land in 1-2 lines.]

[3-5 short paragraphs walking the argument:
  - The pain
  - Why conventional wisdom fails (if hot-take)  OR  the surprise (if devlog/launch-retro)
  - 2-3 concrete points
  - The rule]

[Soft CTA to the long-form: "Full breakdown: [link]" — only if you have a destination.]
```

## Structure — Threads post derivative

```
[Often the hook tweet of the X thread, slightly more conversational.]

[Optional 1-2 line follow-up.]

[Threads tolerates more first-person, more "btw" energy than X. Use it.]
```

## Rules

- **Don't paste long-form sentences verbatim.** Threads need shorter, punchier construction. Rewrite, don't extract.
- **Each thread tweet must stand alone.** Reader who only sees tweet #4 should still get something useful.
- **Hook tweet is 80% of the work.** Spend disproportionate time on it. If the hook is weak, the rest is wasted.
- **No "1/" if you're not numbering.** Either number all or none.
- **Always link back to the long-form** in the closer if it's published. Drives the long-form's reach.
- **Quota check:** don't ship the thread + LinkedIn + Threads + observation all on the same day. Stagger across the week, or further (1-2 weeks for derivatives of a single long-form).

## Anti-patterns

- Thread that's just the long-form's H2s. Lazy. Each tweet must earn its place.
- Hook tweet that's clickbait without payoff. Reader will resent you.
- Closing tweet that's only "Follow me for more". Always lead with substance, then link.
- Cross-posting the EXACT same text on X, LinkedIn, and Threads. Each platform deserves a slight rewrite.

## Output

For a single long-form input, the default output is:
- 1 X thread (5-9 tweets)
- 1 LinkedIn post (rephrased, ~150-300 words)
- 0-1 Threads post
- 0-1 standalone observation (if one stood out)

That's 2-4 short-form pieces from 1 long-form. Spread over the next 1-2 weeks.
