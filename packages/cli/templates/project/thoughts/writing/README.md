# Writing system

A set of Claude Code skills for drafting, editing, and publishing weekly newsletters plus their daily social derivatives. Output language: English (customize as needed). Platforms: blog, X, LinkedIn, Threads.

> Looking for HOW the skills work internally — contracts, pipelines, extension recipes? Read [`.claude/skills/writing/README.md`](../../.claude/skills/writing/README.md). This file is the user guide.

---

## Quickstart

Five-minute path from zero to publishing a week:

```bash
# Sunday: scaffold the week
/agenda plan-week today
# (asked: "What is this week's newsletter about?" → answer in one sentence)

# Sunday: draft the newsletter
/write long-form-weekly-newsletter

# Sunday: spin out the week's derivatives (Mon-Fri pieces)
/write --repurpose thoughts/writing/calendar/<YYYY-WNN>/newsletter.md

# Monday-Friday: each day, publish that day's piece
/write-publish <example-slug>

# Sunday again: publish the newsletter, archive the week
/write-publish <newsletter-slug>
```

Each week is its own directory under `thoughts/writing/calendar/<YYYY-WNN>/`. The newsletter is the parent piece, drafted Sunday from a single seed. Daily derivatives (Mon-Fri short-form) spin out from the newsletter once it's drafted. Publishing a piece flips its row in `plan.md` from `drafted` to `published`; once every row is `published` or `skipped`, the whole week directory is offered for archival.

---

## How a week flows

1. **Sunday — plan the week.** `/agenda plan-week today` creates `thoughts/writing/calendar/<YYYY-WNN>/plan.md` with rows for the newsletter and 5 daily derivatives (Mon-Fri). Each row starts as `queued`. The skill asks once for the newsletter seed and uses it as the spine for the whole week.
2. **Sunday — draft the newsletter.** `/write long-form-weekly-newsletter` interviews you, drafts the long-form piece, runs editing-pass and ai-slop-check. Saves to `<week>/newsletter.md`. Flips the row to `drafted`.
3. **Sunday — repurpose.** `/write --repurpose <newsletter>` reads the newsletter and generates short-form pieces, one per Mon-Fri row in `plan.md`. Each derivative goes to `<week>/derivatives/<weekday>-<type>-<slug>.md` with `platform: x | linkedin | threads | carousel` in its frontmatter.
4. **Monday-Friday — daily publish.** Open the file (you can hand-tune before publishing). Then `/write-publish <slug>` archives it to the right social subdirectory and flips its row to `published`.
5. **Sunday — publish the newsletter.** Same `/write-publish <slug>` command, but for the newsletter. The piece goes to your blog target (e.g. `src/content/blog/<date>-<slug>.mdx`). All sibling derivatives must be `ready` or `published` (gate).
6. **Week archival.** Once every row in `plan.md` is `published` or `skipped`, `/write-publish` offers to move `<week>/` into `archive/`. The week is done.

---

## Common workflows

1. **Scaffold this week.**
   ```
   /agenda plan-week today
   ```

2. **Draft a one-off post (e.g. hot-take that's NOT in the plan).**
   ```
   /write long-form-hot-take "<your seed in one sentence>"
   ```
   Lands inside the active week's `derivatives/` directory.

3. **Repurpose an existing newsletter into derivatives.**
   ```
   /write --repurpose thoughts/writing/calendar/<YYYY-WNN>/newsletter.md
   ```

4. **Edit a draft after the fact.**
   ```
   /write --edit thoughts/writing/calendar/<YYYY-WNN>/derivatives/<weekday>-<type>-<example-slug>.md
   ```
   Re-runs editing-pass + slop-check.

5. **Publish today's piece.**
   ```
   /write-publish <example-slug>
   ```
   Or `/write-publish` with no slug to pick interactively from ready drafts.

6. **Skip a recurring slot (vacation week).**
   ```
   /agenda skip <YYYY-MM-DD>
   ```
   The row's status flips to `skipped`. The recurring rule isn't deleted — just suppressed for that date.

7. **Backfill a piece you wrote outside the system.**
   ```
   /agenda done <example-slug>
   ```
   Marks the matching `plan.md` row as `published`. Use when you posted manually and want the calendar to know.

8. **Browse the brainstorming pool when stuck for an idea.**
   Look under `thoughts/writing/ideas/`. Each content type has its own backlog file (one per long-form and short-form type) with `## Active`, `## Used`, `## Cold / parked` sections. Skim the relevant file for a seed before answering the `plan-week` interview.

---

## Types — quick reference

**Long-form (7):**

| Type | When to use | Length | Cadence |
|---|---|---|---|
| `long-form-weekly-newsletter` | Default Sunday recurring slot. Parent piece of the week. | 600-1200w | weekly |
| `long-form-monthly-devlog` | Monthly reflection / devlog. | 1200-2000w | monthly |
| `long-form-hot-take` | Contrarian opinion, Koe-style. | 800-1500w | as-needed |
| `long-form-how-to` | Tutorial, Moretti-style. | 1500-3500w | as-needed |
| `long-form-launch-retro` | Post-launch breakdown with real numbers. Strongest format. | 800-1500w | as-needed |
| `long-form-manifesto` | Vision/strategy. Highest slop risk — use sparingly. | 1500-3000w | rare |

**Short-form (7):**

| Type | When to use | Platform default |
|---|---|---|
| `x-vs-y` | Comparison post | LinkedIn |
| `listicle` | Numbered list | X |
| `observation` | Single noticed thing | X / Threads |
| `motivational` | Use sparingly (1-2/mo cap) | LinkedIn |
| `present-vs-future` | Temporal contrast | LinkedIn |
| `thread` | Multi-tweet thread, usually from a long-form | X |
| `carousel` | LinkedIn carousel | LinkedIn |

---

## Cheatsheet

```
# Plan the week
/agenda plan-week today
/agenda plan-week <YYYY-MM-DD>

# Show what's coming up
/agenda show           # next 4 weeks
/agenda show 8         # next 8 weeks

# Draft
/write                                           # interactive (router)
/write long-form-weekly-newsletter "<seed>"
/write long-form-hot-take "<seed>"
/write --auto long-form-launch-retro "<seed>"

# Repurpose long-form into derivatives
/write --repurpose thoughts/writing/calendar/<YYYY-WNN>/newsletter.md

# Edit (rerun pass) a draft
/write --edit thoughts/writing/calendar/<YYYY-WNN>/derivatives/<file>.md

# Publish
/write-publish <example-slug>
/write-publish <example-slug> --dry-run
/write-publish <example-slug> --date <YYYY-MM-DD>
/write-publish <example-slug> --social-only
/write-publish <example-slug> --force          # bypass slop / status gates
/write-publish <example-slug> --auto

# Manage the queue
/agenda add long-form-hot-take <YYYY-MM-DD> "<seed>"
/agenda skip <YYYY-MM-DD>
/agenda done <example-slug>                    # backfill manual publish

# Rules
/agenda rules                                  # print
/agenda rules edit                             # open in $EDITOR
```

---

## Architecture (light)

The writing system stores all editorial state under `thoughts/writing/calendar/`:

```
thoughts/writing/
├── calendar/                    ← editorial state (see calendar/README.md)
│   ├── rules.yaml
│   ├── history.md
│   ├── index.md
│   ├── <YYYY-WNN>/              ← per-week directory
│   │   ├── plan.md              ← the week's table (queued/drafted/published/skipped)
│   │   ├── newsletter.md        ← the long-form parent
│   │   └── derivatives/         ← short-form pieces (one file each)
│   └── archive/<YYYY-WNN>/      ← completed weeks
├── ideas/                       ← brainstorming pool, one file per type
├── published/social/<channel>/  ← archived social derivatives by channel
└── publish-config.yaml          ← publish targets, frontmatter mappings
```

For the per-week directory layout (rules, plan rows, derivatives), see [`thoughts/writing/calendar/README.md`](calendar/README.md).

For the engineering view (contracts, extension recipes, anti-patterns), see [`.claude/skills/writing/README.md`](../../.claude/skills/writing/README.md).

---

## Cadence (default)

Defined in `thoughts/writing/calendar/rules.yaml`:

- Sunday → `long-form-weekly-newsletter` (the parent)
- First Sunday of the month → `long-form-monthly-devlog` (overrides `long-form-weekly-newsletter` that day)
- (Optional) Wednesday → `long-form-how-to`
- (Optional) First Monday of the month → `long-form-manifesto`

Edit via `/agenda rules edit`.

---

## Troubleshooting

- **`/write` refuses with "no week scaffolded".** Run `/agenda plan-week today` first. The newsletter seed is part of that scaffold — `/write` doesn't auto-create the week directory.
- **`/agenda plan-week` says "directory already exists".** Either pick a different date or pass `--replace` to wipe and re-scaffold. `--replace` is destructive — only use it when you're sure.
- **`/write-publish` blocks with "status not ready".** Run `/write --edit <draft>` to walk the editing-pass + slop-check, which sets `status: ready`. Or pass `--force` if you know what you're doing.
- **`/write-publish` blocks with "HIGH slop issues".** Check the report; rewrite the offending lines, or pass `--force` to ship anyway.
- **Derivative `platform` is missing.** `/write-publish` requires it. Open the derivative file and add `platform: x | linkedin | threads | carousel` to frontmatter.
- **Newsletter publish complains about "unfinished derivatives".** Make sure all `<week>/derivatives/*.md` have `status: ready` (or `published`). Run `/write --edit <derivative>` on each unfinished one.
- **Wrong ISO week at year boundary.** The system uses `date +%G-W%V` (not `%Y-W%V`). If you see `2025-W53` for a date in early January, it's correct — week 53 of last year's ISO calendar can extend into January.
- **Lost a draft after editing-pass.** Look for `<file>.draft.md` next to the edited file. The pre-edit version is preserved there.

---

## Brainstorming pool

Ideas live under `thoughts/writing/ideas/`, one file per content type. Each file has `## Active`, `## Used`, `## Cold / parked` sections. When scaffolding a week, skim the relevant type files for a seed. When a bullet becomes a draft, move it to `## Used` with a trail line (`→ drafted <date>` or `→ published <date> as <slug>`). The pool is writer-owned — `/agenda` doesn't read from it automatically.

---

## Notes

The system is designed to be edited by hand. Every file is markdown or YAML; no databases, no API calls. If something feels wrong, open the file and fix it — the skills are resilient by default and won't crash on minor schema deviations (they degrade to null and warn).

---

## For contributors / engineering

> If you're extending this system (new content type, new publish target, new platform), see the engineering reference at [`.claude/skills/writing/README.md`](../../.claude/skills/writing/README.md).

---

Powered by [scribetronic](https://github.com/r-bart/scribetronic).
