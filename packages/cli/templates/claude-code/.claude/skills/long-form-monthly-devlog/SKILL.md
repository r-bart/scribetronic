---
name: long-form-monthly-devlog
description: Monthly devlog — longer, more reflective recap. ~1200-2000 words. Stitches together the month's work, names the pattern, draws a non-obvious lesson. Goes deeper than a weekly recap.
inherits: ../writing-style/SKILL.md
length_target: 1200-2000 words
cadence: monthly
---

# long-form-monthly-devlog

The monthly version of a devlog. Longer, denser, more reflective. The reader should finish with a clear picture of where the project stands, what shifted this month, and one sharp lesson they can use.

Difference vs the weekly recap: weekly is a list of updates with thin reflection. Monthly is a story with updates as evidence.

## Structure

```
[Title — month + theme, not "Month X Recap". Theme is the through-line.]
[Subtitle: the one-sentence thesis of the month.]

[Opener (3-5 sentences): name the through-line of the month. The reader should know in paragraph 1 what made this month different from last.]

## What shipped

[Project-by-project, 1-2 paragraphs each. Same shape as a weekly but with more context: what was the goal at the start of the month, what changed mid-way, what's the state now.]

## What I learned

[The reflective core. 2-4 sub-sections, each with H3 or bold lead-in. NOT generic lessons — specific to what this month showed you.]

[Each lesson: 2-4 paragraphs. Open with the lesson stated as a rule. Show the evidence (what happened that taught you this). Name the non-obvious implication.]

## Numbers

[Concrete numbers from the month. Revenue, users, churn, posts published, conversions. Even if they're zero or embarrassing — especially then. This is your differentiation.]

## Next month

[3-5 dated commitments. Same rules as weekly goals — shippable, concrete.]

[Closer (1-2 sentences): one-line punch tying back to the opener's through-line. NO soft exits.]
```

## Rules specific to this format

- **Theme up front.** A monthly devlog without a through-line is just four weeklies stapled together.
- **Numbers section is non-negotiable.** Even if everything was zero. Especially if everything was zero. The honesty is the value.
- **Lessons must be earned by evidence in the post.** If the lesson is "ship faster", show what slow shipping cost you this month.
- **Length budget: 1200-2000 words.** Below 1200 = should've been a weekly. Above 2000 = split into a devlog + a separate hot-take or how-to.

## Anti-patterns specific to this format

- Generic lessons that could appear in any month ("consistency matters", "users surprise you"). If you can paste it into next month's devlog without changes, it's not a lesson.
- Hiding bad numbers behind framing. If MRR dropped, lead with the number, then explain.
- Sermon mode at the end ("here's what this all means for the future of solopreneurship…"). Not your job. Stick to your project.

## Workflow

1. Before drafting: scan your last 4 weekly recaps. What's the pattern?
2. Write the through-line as a single sentence. That's your subtitle and the spine of the post.
3. Write "What shipped" by collapsing 4 weeklies into project-by-project paragraphs.
4. Pick 2-4 lessons. Each must be backed by something in "What shipped".
5. Pull the numbers cold from your tools. Don't round generously.
6. List next month's commitments.
7. Run `editing-pass` and `ai-slop-check`.
