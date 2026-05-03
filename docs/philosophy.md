# Philosophy

Scribetronic is opinionated. This document explains the opinions so you can decide whether they fit your workflow before you adopt the tool.

---

## One newsletter is a week of content

The central claim: a single long-form piece, written once, can produce an entire week of social posts without losing voice or substance.

A weekly newsletter at 800–1500 words contains:

- One **opening hook** → an `observation` post.
- One **central tension** → an `x-vs-y` post.
- 3–7 **enumerated points** → a `listicle` or a `thread-from-longform`.
- One **summary** → a `carousel-li` for LinkedIn.
- One **forward-looking conclusion** → a `present-vs-future` post.

Six derivatives, plus the newsletter itself = seven pieces. Distributed across Mon–Sun, that's a full publishing week from a single Sunday writing session.

This is not a productivity hack. It's a structural property of long-form writing: every well-constructed essay already contains its own derivatives. Scribetronic just makes the extraction explicit and repeatable.

### Why this matters

Most writers either:

1. Burn out trying to produce daily original content, or
2. Underutilise their long-form work by publishing it once and moving on.

Scribetronic targets a third path: write deliberately and infrequently, distribute systematically. The newsletter is the engine; the social posts are the exhaust.

---

## The editorial calendar as a state machine

Spreadsheets are bad at workflow. Notion is heavy. Most CMS calendars are date-pickers glued to a content table.

Scribetronic models the editorial calendar as a finite state machine where each row in `plan.md` has exactly four states:

```
queued → drafted → published
   ↓
skipped
```

Markdown frontmatter is the database. ISO week directories are the primary key. Git is the audit log.

This sounds reductive until you realise:

- You can `grep` your entire content history.
- You can diff any week against any other week.
- You can roll back a publish with `git revert`.
- You can clone the repo onto a new machine and lose nothing.
- You can see your future commitments and your past output in the same tree.

A state machine in markdown is more durable than a state machine in a SaaS tool. The data outlives the tool.

See [contracts.md §3](contracts.md) for the exact `plan.md` schema and the allowed status transitions.

---

## Skills decoupled from project concerns

A consumer project that adopts scribetronic ends up with two trees:

```
<project>/
├── .claude/skills/         ← installed by scribetronic; rarely edited
└── thoughts/writing/       ← project-owned; the writer's working set
```

The split is intentional:

- **Skills are reusable.** They contain no project-specific paths, no hardcoded blog targets, no individual voice. They read from config files in `thoughts/writing/`.
- **Thoughts are personal.** Your ideas, your calendar, your published archive — none of that belongs in a plugin. It's yours.

Updating scribetronic (e.g. `scribetronic init` after a new release) refreshes the skills without touching your content. Conversely, editing your `rules.yaml` or `publish-config.yaml` doesn't fork the plugin.

This is the same pattern that lets editors update Vim plugins without losing their `init.vim`, or `npm install` a new linter without losing the project's source code. Tooling and content live in different layers.

---

## Source-of-truth pattern

When a skill needs configuration, the configuration lives in a **single file** that the skill **reads**. The skill must never hardcode the configurable value.

Concrete examples:

- `/write-publish` reads target paths from `publish-config.yaml`. It does not hardcode `src/content/blog/`.
- `/agenda` reads cadence rules from `calendar/rules.yaml`. It does not hardcode "Sunday is newsletter day".
- Long-form templates inherit voice from `writing-style/SKILL.md`. They do not duplicate voice rules.

The rule, formalised: **config wins over code**. If a skill contradicts a config file, the skill is wrong. Fix the skill, not the config.

This matters because:

1. Users own their config; they don't fork plugins to change cadence.
2. Updates to scribetronic don't clobber user choices.
3. The contract is inspectable — you can read the config and predict skill behaviour.

See [contracts.md §7](contracts.md) for the formal source-of-truth rule.

---

## Why markdown frontmatter, not a database

A real database (SQLite, JSON, YAML doc) would be more "correct" by software-engineering standards. Scribetronic deliberately avoids this.

Reasons:

1. **Editability.** Every editor on every platform handles markdown. No tool lock-in.
2. **Diffability.** `git diff` shows meaningful changes to `plan.md`. A binary database would not.
3. **Transparency.** A writer can read the calendar without running scribetronic.
4. **Resilience.** A bad CLI release can't corrupt a markdown file in any way the user can't fix manually.
5. **Portability.** The whole pipeline survives if you delete the CLI tomorrow. The content is plain text.

Performance is not a concern at this scale — a single user produces ~52 newsletters and ~300 derivatives per year. Markdown handles that volume trivially.

---

## ISO weeks, not US weeks

Scribetronic uses ISO 8601 weeks (Monday–Sunday) throughout. `date +%G-W%V`, never `%Y-W%V`.

Why ISO:

- The boundary at year-end is unambiguous (`%G` returns the ISO-week-year, `%Y` returns the calendar year — they disagree on Dec 28–31 of some years).
- Monday-start matches working-week intuition for most of the world.
- ISO is the international standard; US Sunday-start is regional.

This is enforced by [contract 1](contracts.md). All consumers — `/agenda`, `/write`, `/write-publish` — use the same resolver.

---

## Three orchestrators, no more

Scribetronic exposes exactly three user-invokable orchestrators:

- `/agenda` — cadence and week scaffolding.
- `/write` — drafting pipeline.
- `/write-publish` — distribution.

Type-specific skills (e.g. `/long-form-weekly-newsletter`, `/short-form-listicle`) are loaded **by** the orchestrators, not invoked directly by humans. This is deliberate:

- Fewer entry points = less for the user to remember.
- Orchestrators own the pipeline (status transitions, file layout, slop checks); type skills own the content shape (voice, structure, length).
- Adding a new content type doesn't change the user's mental model.

If you find yourself wanting to invoke a type skill directly, that's a sign the orchestrator is missing a capability — file an issue rather than working around it.

---

## What scribetronic is not

- **Not a CMS.** It does not host your content. It writes markdown files into your existing project.
- **Not a scheduler.** It produces drafts; you publish them manually (or via your own automation).
- **Not a Buffer/Hootsuite replacement.** It does not post to social platforms. It produces well-structured drafts; cross-posting is a human step.
- **Not a writing assistant for one-off pieces.** If you need to write a single tweet, use a simpler tool. Scribetronic's value is in the weekly cadence.
- **Not opinionated about your stack.** It assumes Claude Code as the runtime and markdown as the storage. Beyond that, your blog, your social platforms, your SEO setup — all yours.

---

## What you give up by adopting it

Honest tradeoffs:

- **You commit to a weekly cadence.** Skipping a week is fine (`/agenda skip`), but the system assumes you ship at least the Sunday newsletter most of the time.
- **You commit to ISO weeks.** If your team works in calendar months, scribetronic will feel awkward.
- **You commit to markdown.** If you write in Notion or Google Docs, scribetronic will feel like a downgrade until you've internalised the diffability/portability benefits.
- **You commit to running Claude Code locally.** The skills are markdown files Claude reads — no Claude Code, no scribetronic.

If those tradeoffs are deal-breakers, scribetronic is the wrong tool. If they're acceptable, you get a writing pipeline that compounds: the longer you use it, the more your past content accelerates your future content.

---

## Further reading

- [contracts.md](contracts.md) — the data contracts the pipeline depends on.
- [skills.md](skills.md) — catalog of all 21 skills.
- [tutorials/01-new-project.md](tutorials/01-new-project.md) — get started in 5 minutes.
- [tutorials/03-weekly-flow.md](tutorials/03-weekly-flow.md) — what a week looks like in practice.
