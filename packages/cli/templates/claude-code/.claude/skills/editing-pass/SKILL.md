---
name: editing-pass
description: Read-and-revise pass for any drafted post. Applies writing-style.md checklist, tightens prose, kills filler. Run after drafting and before ai-slop-check.
---

## Metadata

- **inherits**: `../writing-style/SKILL.md`
- **applies to**: long-form/*, short-form/*

# editing-pass

A structured editing pass for any draft. Three goals: enforce the voice, cut filler, sharpen the closer.

## Voice resolution

Before editing, load voice rules in this order:

1. **`scribetronic/style/writing-style.md`** in the project root, if it exists — this is the user's personalized voice override.
2. **The bundled `writing-style/SKILL.md`** template otherwise — generic baseline.

If both exist, the project-local file wins. The user creates it via `scribetronic style` or `/scribetronic:style-extract`.

## When to run

After drafting and BEFORE `ai-slop-check`. The two are complementary:
- `editing-pass` is craft (rhythm, structure, voice).
- `ai-slop-check` is detection (specific AI tells, anti-patterns).

## Workflow

### Pass 1 — Read for shape

Read the post top to bottom in one go. Don't edit yet. After reading, answer:
- Does the first paragraph give the point? If not, fix the opener before anything else.
- Does the closer close, or does it trail off? Note it.
- Is there a clear through-line, or does it sprawl? Mark sections that don't serve the through-line.

### Pass 2 — Apply the writing-style checklist

Run through the checklist in `writing-style/SKILL.md` section 8:

- [ ] First 2 sentences contain the point.
- [ ] Closer is declarative, not soft.
- [ ] At most ONE rhetorical question.
- [ ] At most ONE staccato 2-3 word paragraph (_"That's it."_, _"Why?"_).
- [ ] Zero "not just X, but Y" constructions.
- [ ] Zero adjective stacks of 3+.
- [ ] At least one concrete number, name, or date.
- [ ] No filler hedges unless load-bearing.
- [ ] No coach-speak.
- [ ] Sentence length varies — read aloud test.
- [ ] If "I" appears in a feeling-claim, it's earned by a fact next to it.

For each failure, fix it inline.

### Pass 3 — Tightening

Cut, don't rewrite, in this pass:
- Adverbs that don't change meaning ("really", "very", "quite").
- Hedges ("I think", "kind of", "in some sense").
- Sentence openers that delay the point ("Now, what's interesting is…").
- "Of course" / "obviously" / "needless to say" — if obvious, cut. If not, don't claim it is.
- Any sentence that COULD be cut without changing the argument.

Aim: cut 10-15% of word count without losing meaning.

### Pass 4 — Closer

Read just the closer. Ask:
- Could this closer appear at the end of any other post in any other niche? If yes, rewrite.
- Does it commit to something specific? If no, add a date, a number, or a next post.
- Does it match the post's energy? A hot-take needs a punch closer, a devlog needs a "next week" closer.

### Pass 5 — Read aloud

Literally read it out loud. Mark places where:
- You stumbled (rewrite for rhythm).
- You ran out of breath (sentence too long — split).
- You sounded bored (paragraph is filler — cut or sharpen).

## Output

The same draft, edited inline. No new file. Track changes are useful but not required — the goal is the final tightened text.

## Time budget

15-25 minutes for a long-form. 5-8 for short-form. If you're spending more, you're rewriting, not editing — make it a separate pass.
