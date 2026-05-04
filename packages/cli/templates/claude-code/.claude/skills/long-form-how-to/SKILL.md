---
name: long-form-how-to
description: Actionable guide (~1500-3500 words). Teaches the reader to do something specific you've actually done end-to-end. Use when you've completed a process, project, or workflow worth teaching — and you can ship a worked example, not just theory.
---

## Metadata

- **inherits**: `../writing-style/SKILL.md`
- **length target**: 1500-3500 words
- **cadence**: ad-hoc — when you've completed a process worth teaching

# long-form-how-to

A guide that teaches the reader to do something specific. Authority comes from having done it, not from research. If you haven't done it, don't write it.

Voice, tone, and any author/post references come from `writing-style/SKILL.md`.

## Structure

```
[Title: states what the reader will be able to do. NOT "Ultimate guide to X" — use the actual outcome.]
[Subtitle: 1 sentence — who this is for and what they'll have at the end.]

[Opener (3-5 sentences): the reader's current pain. The cost of the status quo. Why most existing solutions don't work for the case you're addressing.]

[Credibility line: 1-2 sentences naming WHY you can teach this. Concrete: "I did X. Here's what worked."]

## The setup

[What the reader needs before they start. Tools, accounts, prerequisites. Be honest about cost and effort.]

## Step 1 — [Action verb + outcome]

[Explanation. Then concrete instruction. Code/screenshots/examples if relevant.]

[1-paragraph callout: where you tripped up the first time, so the reader doesn't.]

## Step 2 — [Action verb + outcome]

[Same shape.]

## Step 3+ — [...]

[Same shape. 3-7 steps total. More than 7 = split the post.]

## What this looks like in practice

[1 worked example end-to-end. NOT another step list — a story showing the steps in motion.]

## Common pitfalls

[3-5 mistakes you've seen (or made) and how to avoid them.]

## What's not covered

[Honest scope statement. What this guide doesn't address. Pointers to where to go for those.]

[Closer (1-2 sentences): one-line invitation to try it. NO "let me know how it goes" — replace with a specific question they could ask if they get stuck, or a concrete next step.]
```

## Rules specific to this format

- **You must have done it.** This format is non-negotiable on lived experience. If you're synthesizing from research, write a hot-take or analysis, not a how-to.
- **Steps are verbs and outcomes.** "Set up your tracking" not "Tracking".
- **Show the worked example.** A step list without a worked example is theory. The example is the proof.
- **Name what's NOT covered.** Honest scope = trust. Pretending the guide is complete = AI energy.
- **Tools and prices up front.** "This requires a $20/mo PostHog plan and a GitHub account" beats discovering it in step 4.
- **Length is earned by completeness, not bloat.** A 3500-word how-to better cover 7 steps with examples. A 1500-word how-to better cover 3-4 steps tightly.

## Anti-patterns specific to this format

- "In this post you will learn…" intro — cut. Just teach.
- Step that's actually 4 steps disguised as one. Split.
- Generic prerequisites ("a willingness to learn"). Cut.
- "Pro tip:" call-outs that aren't actually pro tips. Either it's central enough to be in the step or it's noise.
- Closer that asks for engagement ("comment below!"). Replace with substance.

## Workflow

1. Confirm you've actually done this end-to-end. If you haven't, switch format.
2. Write the steps as bare outcomes first — verbs.
3. Fill each step with: the action, the gotcha, the proof it worked.
4. Write the worked example LAST so it can reference the actual steps.
5. Add "what's not covered". Be honest.
6. Run `editing-pass` and `ai-slop-check`.
