# Voice override

This is where your personalized writing style lives — your voice, your references, your anti-patterns. Every drafting and editing skill (`/scribetronic:write`, `/scribetronic:editing-pass`, `/scribetronic:ai-slop-check`, etc.) reads `scribetronic/style/writing-style.md` first; the bundled template that ships with the plugin only applies when this file is missing.

## How to populate it

```bash
scribetronic style              # seed once from the bundled template, then opens in $EDITOR
scribetronic style              # subsequent runs: opens for editing
scribetronic style --reset      # overwrite with the seed (asks for confirmation)
```

Or, if you have published reference samples (3-5 from authors you admire + 1-2 of your own pieces):

```
/scribetronic:style-extract
```

This generates a first draft of all 8 sections of the style guide. You then edit by hand. Aim for ~30-60 minutes of deliberate work — voice is the only part of this system that you can't outsource.

## How it evolves

After publishing 3+ pieces:

```
/scribetronic:style-refine
```

This compares your drafts against the published versions, finds patterns where your voice consistently overrides the guide, and proposes deltas with textual evidence. You review the proposals and apply the ones you agree with. No auto-rewrites.

## What lives here

- `writing-style.md` — your voice guide. Created by `scribetronic style` or `/scribetronic:style-extract`.
- (this file) — the README you're reading.

That's it. Drafts live in `../calendar/<week>/`, ideas in `../ideas/`. Style stays here.
