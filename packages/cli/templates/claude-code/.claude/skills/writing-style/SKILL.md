---
name: writing-style
description: The shared style guide every long-form and short-form post inherits. Reference for tone, structure, sentence rhythm, signature moves, and anti-patterns. Always loaded by drafting and editing skills. This is the only skill that should be personalized — every other skill stays format-only.
---

## How this skill works

This SKILL.md ships as a **neutral template** inside the plugin marketplace. Your **personalized voice override** lives in your project at `scribetronic/style/writing-style.md`. Skills that need voice always look there first; this template is the fallback.

**To create the override** in your project:

```bash
scribetronic style    # copies this template to scribetronic/style/writing-style.md, then opens it
```

After that, every drafting/editing skill will read your override automatically.

If you don't have a `scribetronic/` directory in the project (i.e. you installed the plugin without the CLI), the rules below apply directly — they're a generic baseline good enough to start, but you'll want to personalize.

---

## Metadata

- **status**: template — fill in your specifics in `scribetronic/style/writing-style.md`
- **last reviewed**: <!-- YYYY-MM-DD -->

# Writing style — `<your-name>`

The voice every post inherits. Format-specific skills (newsletter, hot-take, listicle, etc.) override structure and length, never voice. **This file is yours to rewrite.** Replace every section's placeholder text with your actual voice, your actual references, your actual examples.

---

## 0. Reference sources

The authors / posts / accounts whose voice you actively model. Not for citation — for the slop-checker and the drafting skills to know what "in-voice" sounds like.

<!--
TODO: list 3-6 references with one line on what you draw from each.
Example shape:
- **<Author A>** — for sharp, declarative closers and short paragraph rhythm.
- **<Author B>** — for the contrarian-with-evidence framing.
- **<Account or Newsletter C>** — for x-vs-y comparison hooks.
-->

- **<reference 1>** — <what you draw from them>
- **<reference 2>** — <what you draw from them>
- **<reference 3>** — <what you draw from them>

**Own samples** (your published work that defines the baseline — `style-extract` reads these):

<!-- TODO: list 1-3 of your own published pieces that best represent the voice. -->

- **<your piece 1>** — <one-line note: what makes it on-voice>
- **<your piece 2>** — <one-line note>

---

## 1. Voice & tone

The 1-2 line answer to "what does this writer sound like?". Replace the defaults with your own.

**Default starting point** (delete and rewrite):

> Direct, confident, honest. The reader should feel they're hearing from someone who's actually done the thing — not someone teaching from a book.

Tensions to maintain (keep the ones that fit; cut or replace the rest):

- **Authoritative but not preachy.** State the rule. Don't lecture about why it matters for three paragraphs.
- **Personal but not confessional.** Use "I" freely. Don't dump emotion.
- **Educational but not flexing.** Numbers are evidence, not trophies.
- **Pragmatic over inspirational.** "If it doesn't work, kill it" beats "embrace the journey".

**Positive example (your own writing):** _<a 1-2 sentence quote from your own published work that is unmistakably you>_

**Negative example (your own writing):** _<a 1-2 sentence quote from a draft you later cut or regretted — the kind of writing you want to avoid>_

---

## 2. Structure

How a post is shaped at the macro level. Adjust to your defaults.

- **TL;DR or thesis up front.** First 2 sentences must give the reader the point. If you can cut everything after the third paragraph and still keep the message, do it.
- **Descriptive H2s, not clever ones.** _"What is X?"_ beats _"Meet the new kid on the block."_
- **Short paragraphs.** 1-3 sentences. Single-sentence paragraphs are punctuation.
- **Bullets only when enumerating.** Never to pad. Three bullets minimum or it's a list of 1-2 disguised as a list.
- **Closers must close, not soften.** Specific next action, declarative statement, or one-line punch. Never "let's see where it takes us."

---

## 3. Sentence-level

- **Length variance is the engine.** 4-12-20-6. Don't write three medium sentences in a row.
- **Em-dashes over parentheses for asides.** Cleaner rhythm. Reserve `(parens)` for genuine side-info that could be cut.
- **Cut hedges.** "I think", "probably", "kind of", "really", "truly", "honestly". One per post max — and only if it carries weight.
- **Strong verbs, plain nouns.** "Ship" not "deliver". "Tool" not "solution". "Built" not "created".

**Native-language interference** (delete if you write only in your native language):

<!--
TODO: if you write in a non-native language, list the 2-3 mistranslations
or stylistic leaks you catch yourself making. Example:
- "specially" → "especially"
- "actually" used as filler → cut or use "in fact"
-->

- _<your common leak 1>_ → _<the fix>_
- _<your common leak 2>_ → _<the fix>_

---

## 4. Signature moves (keep these)

The deliberate techniques you want every post to use when they fit. Replace with yours.

1. **<Move 1 — short name>.** _<1-2 sentence description>_ <!-- e.g. "Number up front. Lead with the real figure even when (especially when) it's embarrassing." -->
2. **<Move 2 — short name>.** _<description>_
3. **<Move 3 — short name>.** _<description>_
4. **Staccato 2-3 word paragraph.** A single one-line sentence used as punctuation. _"Why?"_ _"That's it."_ Limit: ONE per post. More than that = tic.
5. **Concrete artifact reference.** Name the tool, the URL, the dollar amount, the date. Vague references signal you don't actually do the thing.

---

## 5. Anti-patterns / blacklist

Patterns to kill on sight. The defaults below catch the worst of generic AI output. Add your own.

| Pattern | Why kill it | Fix |
|---|---|---|
| "not just X, but Y" | AI signature; vague | Drop the negation. Say what it IS. |
| Three-adjective stack ("ambitious, comprehensive, deep") | Padding | Pick the one adjective that earns its place. |
| Soft closer ("Let's see where it takes us", "I invite you to follow along") | Coward's exit | Replace with: specific next step, hard punch, or sign-off. |
| Vague future tense ("I'll naturally promote…") | Empty promise | Replace with: dated commitment or cut. |
| TL;DR that isn't a TL;DR | Mislabels content | A real TL;DR compresses the ARGUMENT in 1 sentence, not the structure. |
| Coach-speak ("transformational", "journey", "embark", "unleash") | LinkedIn-2017 energy | Use plain verbs. "Build", "ship", "learn", "fail". |
| Multiple rhetorical questions in a row | Tic when overused | One per post max. Earn it. |
| Adverb stack ("incredibly powerful", "truly remarkable") | Lazy intensifiers | Cut the adverb. If the noun is weak, fix the noun. |
| _<add your own here>_ | _<why>_ | _<fix>_ |

---

## 6. Positive examples (from your own published work)

Pull 2-4 short quotes that are unmistakably your voice. Annotate why each one works.

<!--
TODO: replace each placeholder with a quote from your own writing.
Format: 1-2 sentence quote, then a one-line "why".
-->

**Number-led opener:** _<your quote>_ — <why it works>

**Honest aside:** _<your quote>_ — <why it works>

**Punch closer:** _<your quote>_ — <why it works>

---

## 7. Negative examples (cut these on sight)

Pull 1-2 quotes from your own drafts (or published work you regret) that exemplify the anti-patterns above. Show the fix.

<!-- TODO: replace placeholders with your real "before / after" pairs. -->

**Before:** _<a sentence or paragraph from your own work that broke the rules>_

What's wrong: <name the specific anti-patterns it triggers>.

**Fix:** _<a rewrite that respects the rules>_

---

## 8. Revision checklist

Run before publishing any post:

- [ ] First 2 sentences contain the point.
- [ ] Closer is declarative, not soft. (No "Let's see…")
- [ ] At most ONE rhetorical question.
- [ ] At most ONE staccato 2-3 word paragraph (_"That's it."_, _"Why?"_).
- [ ] Zero "not just X, but Y" constructions.
- [ ] Zero adjective stacks of 3+.
- [ ] At least one concrete number, name, or date.
- [ ] No filler hedges (kind of, really, truly, honestly, probably) unless load-bearing.
- [ ] No coach-speak (journey, embark, transformational, unleash).
- [ ] Sentence length varies — read aloud test.
- [ ] If "I" appears in a feeling-claim, it's earned by a fact next to it.

If any check fails, revise. If 3+ fail, the draft isn't ready.

---

## How to fill this file

Two paths:

1. **Manual.** Read each section, replace placeholders with your real voice, references, examples. Best when you already have a clear sense of your style. Budget: 30-60 minutes.
2. **Assisted.** Run `/scribetronic:style-extract` and feed it 3-5 reference samples (other authors you admire) plus 1-2 of your own published pieces. It generates a first draft of all 8 sections. Then you edit. Best when you're starting from scratch or want a structured baseline.

## Refining this guide

This file should evolve as your published voice diverges from what's written here. Don't rewrite it from memory — run the `/scribetronic:style-refine` skill, which proposes concrete deltas based on your real (draft → published) edit history. You review, accept the deltas you agree with, and apply them by hand. No auto-rewrites.
