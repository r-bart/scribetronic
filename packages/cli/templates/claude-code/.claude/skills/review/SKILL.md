---
name: review
description: Parallel review of a draft along multiple focuses (voice, structure, slop, hook, closer, optional factual). Spawns N subagents concurrently — each with a single focus and the user's writing-style — then aggregates findings into one severity-grouped report. Use full mode mid-draft or as a pre-publish gate; use delta mode (--since-last / --since <ref>) to review only what changed since the last snapshot or git ref — 3 focuses instead of 5, ~5s instead of ~10s, ~80% fewer tokens.
allowed-tools: Read, Glob, Grep, Bash, Task, Write
argument-hint: "<draft-path> [--focus voice,structure,slop,closer,hook,factual] [--since-last | --since <revspec> | --since-staged] [--with-evidence] [--quiet]"
---

# /scribetronic:review

Multi-focus review of a draft. The orchestrator dispatches one subagent per focus in **parallel** (single message, multiple Task calls), each with a narrow brief and a copy of the user's writing-style override. Each subagent returns findings as a structured table; the orchestrator merges them into a single severity-grouped report.

This is the parallel counterpart to `/scribetronic:editing-pass` + `/scribetronic:ai-slop-check`. Two modes:

- **Full mode** (default) — review the entire draft against 5 focuses. ~10s wall time. Use as a pre-publish gate or when you want a fresh full read.
- **Delta mode** (`--since-last` / `--since <revspec>` / `--since-staged`) — review only the lines that changed since the last snapshot or git ref. 3 focuses (voice, slop, continuity), ~5s wall time, ~80% fewer tokens. Use when you've just written a paragraph or two and want fast feedback before continuing.

When to pick:

- **Mid-draft, just wrote 2 paragraphs** → delta mode (`--since-last`)
- **Mid-draft, "let me check the whole thing"** → full mode
- **Pre-publish gate** → full mode (sometimes with `--with-evidence`)
- **On a worked snippet from a long-form** → full mode

## Voice resolution

Before dispatching, load the voice base in this order:

1. **`scribetronic/style/writing-style.md`** in the project root, if it exists — user's personalized override.
2. **Bundled `writing-style/SKILL.md`** template otherwise — generic baseline.

Pass the resolved voice content to every subagent so they all check against the same rules.

## Inputs

| Argument | Required? | Description |
|---|---|---|
| `<draft-path>` | Yes | Path to the draft markdown file (e.g. `scribetronic/calendar/2026-W18/drafts/manifesto.md`). Resolved relative to project root. |
| `--focus <list>` | No | Comma-separated list of focuses to run. Default in **full mode**: `voice,structure,slop,hook,closer`. Default in **delta mode**: `voice,slop,continuity`. Add `factual` to either mode when you have a verifiable evidence source. |
| `--since-last` | No | **Delta mode.** Review only what changed since the last `/review` invocation on this file (snapshot stored in `.scribetronic/snapshots/<basename>.md`, git-ignored by default). On first invocation per file, snapshots and falls back to full mode with a note. |
| `--since <revspec>` | No | **Delta mode.** `git diff <revspec> -- <draft-path>`. Examples: `--since HEAD`, `--since HEAD~3`, `--since main`. Errors if the file is not in a git repo. |
| `--since-staged` | No | **Delta mode.** `git diff --staged -- <draft-path>`. Useful if you stage as you write. |
| `--with-evidence` | No | Enables the `factual` focus. Reads `scribetronic/calendar/<week>/notes.md` (or `scribetronic/notes.md`) as the evidence source. Subagent only flags claims that contradict the evidence; never invents facts. |
| `--quiet` | No | Suppress per-focus progress lines; only print the final aggregated report. |

`--since-last`, `--since`, `--since-staged` are mutually exclusive — passing more than one is a usage error.

If `<draft-path>` doesn't exist, refuse with a hint to check the path.

## Focuses

Each focus is one Task subagent invocation. The subagent reads the draft + the resolved voice base + the focus-specific brief.

### voice

> **Brief**: "Read the writing-style rules below. Then read the draft. Report every line where the draft violates a writing-style rule. Cite the rule from the style guide and quote the offending line. Severity: HIGH if the violation breaks a 'never' rule (e.g. 'not just X, but Y'), MEDIUM if it's a tic-overuse, LOW if it's borderline. Skip everything that doesn't violate a rule."

Output shape:
```
HIGH  L23  "...not just a number, but a vision"  ← rule: "not just X, but Y" banned
MEDIUM L41  third rhetorical question in 5 paragraphs  ← rule: max 1 per piece
LOW   L7   adverb stack ("incredibly powerful")
```

### structure

> **Brief**: "Read the draft. Evaluate it on these structural axes: (1) thesis in first 2 sentences? (2) descriptive vs clever H2s? (3) section length variance? (4) bullets used for enumeration only or padding? (5) closer declarative or trailing? Report problems only."

Output shape:
```
HIGH  L1-2   thesis missing — opener is "I want to share what happened this week" (no point until L8)
MEDIUM ## Why  H2 is "Meet the new kid on the block" — clever, not descriptive
LOW   §3-§4   two consecutive 200-word sections — vary length
```

### slop

> **Brief**: "Run the ai-slop-check detection list (HIGH/MEDIUM/LOW patterns) over the draft. Report every hit. Be conservative on LOW — only flag if it's definitely lazy."

This subagent essentially re-uses `/scribetronic:ai-slop-check`'s detection table. Same output shape as that skill.

### hook

> **Brief**: "Read only the first 3 sentences of the draft. Apply the 5 hook patterns from the writing-style guide (number reveal, contrarian assertion, unexpected admission, list promise, specific scene). Verdict: does the hook earn the scroll-stop? If not, propose one rewrite that fits the post's actual subject."

Output shape:
```
HIGH  L1-3  hook is neutral framing ("This week was about shipping")
            → propose: "I shipped 4 things this week. Three flopped. Here's why I'm doing more of one of them."
```

### closer

> **Brief**: "Read only the final 2 sentences of the draft. Apply the 4 closer patterns (repeat-thesis-as-command, specific-next-action, one-liner reframe, sign-off with date/CTA). Verdict: does the closer commit to something? If it trails off, propose one rewrite."

Output shape:
```
HIGH  L156-157  soft closer ("Onwards. Let's see what next week brings.")
                → propose: "Next week: ship the publishing pipeline. Newsletter on Sunday. Same time."
```

### continuity *(delta mode only)*

> **Brief**: "Read the BEFORE block (last 1-2 paragraphs of the draft as it was) and the AFTER block (the same 1-2 paragraphs plus what was just added). Evaluate ONLY whether the AFTER continues the BEFORE coherently. Check: tone consistency (no genre shift), argument flow (does the new content build on or pivot from what was there?), no orphan references (does the AFTER name a noun the BEFORE didn't introduce?), tense/perspective consistency. Report breaks only."

Output shape:
```
HIGH  L78-82  AFTER shifts from past tense to present, mid-paragraph (BEFORE was past throughout)
MEDIUM L84   "the framework" — first mention; BEFORE never introduced one
LOW   L80   tone tightens (BEFORE conversational, AFTER didactic) — intentional?
```

This focus is **only run in delta mode**. In full mode it doesn't fire (the whole draft is the content; there's no "before" to compare against).

### factual *(opt-in via `--with-evidence`)*

> **Brief**: "Compare every numeric claim, named person, named tool, dated event in the draft against the evidence file <evidence-path>. Report contradictions only. Never invent corrections — only flag the discrepancy and quote both."

Skip silently if no evidence file is found.

Output shape:
```
HIGH  L34  draft says "8 free signups, zero paid" — evidence (notes.md L12) says "12 free signups, 1 paid"
MEDIUM L51 draft says "MakerOps launched on August 16" — evidence has no date for that launch
```

## Workflow

### Phase 1 — Resolve and validate

1. Resolve `<draft-path>`. If missing → refuse with `error: draft not found at <path>`.
2. Resolve voice base (`scribetronic/style/writing-style.md` → bundled template).
3. Determine mode:
   - If `--since-last`, `--since <revspec>`, or `--since-staged` is present → **delta mode**.
   - Otherwise → **full mode**.
   - More than one delta flag → usage error.
4. Parse `--focus` list (default depends on mode):
   - Full default: `voice,structure,slop,hook,closer`
   - Delta default: `voice,slop,continuity`
   - In delta mode, silently drop `structure`, `hook`, `closer` from `--focus` if present (they don't apply to deltas) and emit a `note:`.
5. If `factual` is in the list, locate the evidence source. If absent, drop `factual` silently and warn (`note: skipping factual focus — no scribetronic/calendar/<week>/notes.md found`).
6. **Delta mode only — compute the delta**:
   - `--since-last`: read `.scribetronic/snapshots/<basename>.md` if it exists; if not, snapshot the current draft, emit `note: first --since-last on this file — snapshotted, falling back to full mode this run`, then run as full mode.
   - `--since <revspec>`: `git diff <revspec> -- <draft-path>` (must be in a git repo; error otherwise).
   - `--since-staged`: `git diff --staged -- <draft-path>`.
   - The delta is the unified diff. Extract the AFTER hunks (lines prefixed `+`, excluding the `+++` header) and locate them in the current file with line numbers.
   - If the delta is empty (no changes since the reference), emit `note: nothing changed since <reference> — nothing to review` and exit 0 successfully.
   - Build the BEFORE/AFTER context per added hunk: 1-2 paragraphs of unchanged content immediately above and below, used as continuity anchor.
7. **Delta mode only — at the end, update the snapshot** (only for `--since-last`): write the current draft to `.scribetronic/snapshots/<basename>.md` so the next `--since-last` invocation diffs against this run.

### Phase 2 — Dispatch in parallel

Spawn one Task subagent per focus, **all in a single message** (parallel tool calls).

**Full mode** prompt skeleton:

```
You are running the "<focus>" review pass for scribetronic.

## Draft
<paste full draft content>

## Writing-style rules (your reference)
<paste resolved voice base>

## Your brief
<focus-specific brief from the table above>

## Output format
Return a markdown table with columns: Severity | Location | Finding.
Severity: HIGH | MEDIUM | LOW. Location: line number(s) or section heading.
Finding: 1 sentence description, optionally followed by "→ propose:" rewrite.
Return ONLY the table, no preamble, no closer. Empty table if nothing to flag.
```

**Delta mode** prompt skeleton (per-focus):

```
You are running the "<focus>" review pass for a delta in a scribetronic draft.

## What changed (AFTER block — review THIS only)
<lines added in the diff, with their line numbers in the current file>

## What was there before (BEFORE block — context, do NOT flag issues here)
<1-2 paragraphs of unchanged content immediately above the AFTER, plus 1 paragraph below if any>

## Writing-style rules (your reference)
<paste resolved voice base>

## Your brief
<focus-specific brief — for continuity, the brief explicitly compares BEFORE to AFTER>

## Output format
Same as full mode. ONLY flag findings located in the AFTER block.
Empty table if the delta is clean.
```

The BEFORE block exists to give the subagent context (so it doesn't flag a pronoun whose antecedent lives in BEFORE) but is NOT itself reviewed.

Subagent type: **`general-purpose`** for all focuses. Model: **`haiku`** is fine for voice/slop/hook/closer (pattern-matching tasks); use **`sonnet`** if `factual` is enabled (cross-referencing requires more reasoning).

### Phase 3 — Aggregate

Collect each subagent's table. Merge into one table grouped by severity, with a `Focus` column added:

```
HIGH
| Focus     | Location | Finding                                              |
|-----------|----------|------------------------------------------------------|
| voice     | L23      | "not just X, but Y" construction (rule violation)    |
| closer    | L156-7   | soft closer — propose: "Next week: ship..."          |
| factual   | L34      | claim contradicts notes.md (8 vs 12 signups)         |

MEDIUM
| Focus     | Location | Finding                                              |
|-----------|----------|------------------------------------------------------|
| voice     | L41      | 3rd rhetorical question — rule: max 1 per piece      |
| structure | ## Why   | clever H2 ("Meet the new kid on the block")          |

LOW
| Focus | Location | Finding                                                  |
|-------|----------|----------------------------------------------------------|
| voice | L7       | adverb stack ("incredibly powerful")                     |
| slop  | L98      | "Pro tip:" call-out — consider cutting                   |
```

### Phase 4 — Verdict

Below the tables, print a one-line verdict:

```
verdict: SHIP — 0 HIGH, ≤2 MEDIUM
verdict: REVISE — 1+ HIGH or 3+ MEDIUM
```

The thresholds match `/scribetronic:ai-slop-check`'s "If 1+ HIGH or 3+ MEDIUM, revise and rerun" rule.

If `--quiet` is set, only print the verdict and the HIGH table (skip MED/LOW).

## Output discipline

- The aggregated report goes to **stdout** (it's the data).
- Per-focus progress lines (e.g. `dispatching voice... (haiku)`, `voice: 3 findings`) go to **stderr** unless `--quiet`.
- Errors (missing draft, missing evidence) → stderr.

This lets an agent or script do `result=$(/scribetronic:review draft.md); echo "$result"` and get clean output, while a human running interactively still sees progress.

## Anti-patterns

- **Don't run focuses sequentially.** The whole point is parallelism. If you find yourself awaiting one subagent before dispatching the next, re-read this skill.
- **Don't let subagents propose rewrites for HIGH violations they didn't find.** Each subagent owns its focus — voice doesn't propose hook rewrites.
- **Don't aggregate verbatim findings if multiple focuses flag the same line.** Dedupe by `(line, finding-essence)` and keep the most specific source.
- **Don't run `factual` without an evidence file.** Without grounding, the subagent will hallucinate corrections. Drop it silently.
- **Don't run full mode on drafts shorter than ~100 words.** The overhead of dispatching 5 subagents isn't worth it. Below that, just use `/scribetronic:editing-pass`.
- **Don't run `continuity` outside delta mode.** It needs a BEFORE/AFTER pair. If a user tries `--focus continuity` in full mode, drop it silently with a `note:`.
- **Don't update the `--since-last` snapshot if dispatch failed.** The snapshot only advances on a successful run, so a failed review doesn't lose its reference point.
- **Don't snapshot in any mode other than `--since-last`.** Other delta modes use git refs and don't need a snapshot file.

## When to use which

| Situation | Use |
|---|---|
| **Just wrote 1-3 paragraphs** | `/scribetronic:review <draft> --since-last` (delta, 3 subagents, ~5s) |
| **Working in git, want to review the latest stage** | `/scribetronic:review <draft> --since HEAD` |
| **Want to review only what's currently staged** | `/scribetronic:review <draft> --since-staged` |
| Mid-draft full check, fastest possible | `/scribetronic:review <draft> --focus voice,slop` (full, 2 subagents) |
| Pre-publish gate | `/scribetronic:review <draft>` (full, default 5 focuses) |
| Post-launch retro with verifiable numbers | `/scribetronic:review <draft> --with-evidence` (full + factual) |
| Delta with factual check | `/scribetronic:review <draft> --since-last --with-evidence` |
| Tiny short-form (<100 words) | `/scribetronic:editing-pass` + `/scribetronic:ai-slop-check` |
| You want craft-only edits inline | `/scribetronic:editing-pass` (it edits; review only reports) |

## Integration with `/scribetronic:write`

The `write` orchestrator currently runs `editing-pass` then `ai-slop-check` sequentially in Phase 4. From v0.3.0 onward, when `review` is available, `write` calls `review` instead:

```
Phase 4 — Quality gate
  /scribetronic:review <draft-path>
  if verdict == REVISE:
    show user the HIGH table
    ask: revise now / mark draft anyway / cancel
```

This is documented in `write/SKILL.md` and is opt-out via `--no-review` if a user wants the old sequential flow.

## Limitations

- **Requires Claude Code with the Task tool.** Won't run in IDEs without parallel subagent support.
- **5 subagents = 5x token spend per review.** Default focuses are pattern-matching (haiku-friendly), so cost is low (~$0.01/review at current haiku pricing), but still 5x of one editing pass.
- **No streaming.** Findings arrive together when the slowest subagent finishes (typically ~8-12s). Can't show partial results mid-review.
