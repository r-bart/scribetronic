# Tutorial 1 — Bootstrapping a new project

Estimated time: **5 minutes**.

By the end of this tutorial, you'll have a fresh project initialised with scribetronic, your voice authored, and the current week scaffolded — ready to write your first newsletter.

---

## Step 1 — Create the project

```bash
$ mkdir my-writing && cd my-writing
$ git init
Initialized empty Git repository in /Users/jane/my-writing/.git/
```

Optionally create a `package.json` so you can install scribetronic locally:

```bash
$ npm init -y
Wrote to /Users/jane/my-writing/package.json:
...
```

This step is optional — you can also run scribetronic via `npx` without ever installing it.

---

## Step 2 — Run `scribetronic init`

```bash
$ scribetronic init
```

You'll see something like:

```
created  .claude/agents/.gitkeep
created  .claude/rules/.gitkeep
created  .claude/skills/agenda/SKILL.md
created  .claude/skills/write/SKILL.md
created  .claude/skills/write-publish/SKILL.md
created  .claude/skills/editing-pass/SKILL.md
created  .claude/skills/ai-slop-check/SKILL.md
created  .claude/skills/style-extract/SKILL.md
created  .claude/skills/long-form-weekly-newsletter/SKILL.md
created  .claude/skills/long-form-monthly-devlog/SKILL.md
... (12 more skills)
created  thoughts/writing/README.md
created  thoughts/writing/publish-config.yaml         (from publish-config.example.yaml)
created  thoughts/writing/calendar/README.md
created  thoughts/writing/calendar/index.md
created  thoughts/writing/calendar/rules.yaml         (from rules.example.yaml)
created  thoughts/writing/calendar/history.md
created  thoughts/writing/calendar/archive/.gitkeep
created  thoughts/writing/ideas/README.md
created  thoughts/writing/ideas/weekly-newsletter.md
... (13 more idea files)

✓ scribetronic installed.
  Run `scribetronic style` next to author your voice.
```

Verify the tree:

```bash
$ tree -L 4 .claude thoughts
.claude
├── agents
├── rules
└── skills
    ├── agenda
    │   └── SKILL.md
    ├── ai-slop-check
    │   └── SKILL.md
    ... (19 more)
thoughts
└── writing
    ├── README.md
    ├── calendar
    │   ├── README.md
    │   ├── archive
    │   ├── history.md
    │   ├── index.md
    │   └── rules.yaml
    ├── ideas
    │   ├── README.md
    │   └── ... (14 type files)
    └── publish-config.yaml
```

You should see **20 skill folders** (orchestrators + shared + types) and a fully populated `thoughts/writing/` tree. The `writing-style` skill is **not** yet present — that's the next step.

---

## Step 3 — Author your voice with `scribetronic style`

Scribetronic deliberately leaves voice authoring for a separate, deliberate step.

```bash
$ scribetronic style
✓ seeded /Users/jane/my-writing/.claude/skills/writing-style/SKILL.md
  Edit it now: scribetronic style
```

The first run **copies the seed** — it doesn't open an editor. Run it a second time to edit:

```bash
$ scribetronic style
# (your $EDITOR opens with the file)
```

Inside the file you'll find placeholder sections to fill in:

- **Voice** — how you sound.
- **Anti-patterns** — phrases / structures you never use.
- **Length conventions** — your typical word counts.
- **Anchors** — writers / pieces you imitate.

Fill each section with concrete examples specific to you. Save and quit. The voice file now sits at `.claude/skills/writing-style/SKILL.md` and is inherited by every long-form template.

---

## Step 4 — Scaffold the current week

Open Claude Code in this project and run:

```
/agenda plan-week today
```

Claude Code resolves "today" to the current ISO week (e.g. `2026-W18`) and creates the week directory:

```
✓ created thoughts/writing/calendar/2026-W18/
✓ created thoughts/writing/calendar/2026-W18/plan.md
  scaffolded 7 rows with default rotation:
    Mon  observation        x         queued
    Tue  x-vs-y             linkedin  queued
    Wed  listicle           x         queued
    Thu  carousel           linkedin  queued
    Fri  observation        threads   queued
    Sat  (skip)
    Sun  weekly-newsletter  (blog)    queued
```

Open `plan.md`:

```bash
$ cat thoughts/writing/calendar/2026-W18/plan.md
---
week: 2026-W18
week_start: 2026-04-27
week_end: 2026-05-03
newsletter_seed: "Week of 2026-04-27 — what I learned"
created: 2026-04-27
---

# Plan: Week of 2026-04-27 (W18)

| Date       | Day | Type              | Slug                       | Platform  | Source              | Status  |
|------------|-----|-------------------|----------------------------|-----------|---------------------|---------|
| 2026-04-27 | Mon | observation       | <slug>                     | x         | newsletter (thread) | queued  |
| 2026-04-28 | Tue | x-vs-y            | <slug>                     | linkedin  | newsletter (thread) | queued  |
| 2026-04-29 | Wed | listicle          | <slug>                     | x         | newsletter (thread) | queued  |
| 2026-04-30 | Thu | carousel          | <slug>                     | linkedin  | newsletter          | queued  |
| 2026-05-01 | Fri | observation       | <slug>                     | threads   | newsletter (thread) | queued  |
| 2026-05-03 | Sun | weekly-newsletter | <slug>                     | (blog)    | —                   | queued  |
```

Edit `<slug>` placeholders and the `newsletter_seed` to reflect what you'll actually write.

---

## Step 5 — Commit

Lock in the initial state with git:

```bash
$ git add .
$ git commit -m "init: bootstrap scribetronic"
```

Your editorial calendar is now version-controlled.

---

## Verification

You should be able to confirm:

- [ ] `find .claude/skills -name SKILL.md | wc -l` returns at least 21.
- [ ] `.claude/skills/writing-style/SKILL.md` exists and contains your voice.
- [ ] `thoughts/writing/calendar/<current-week>/plan.md` exists with a 6-row table.
- [ ] `thoughts/writing/calendar/rules.yaml` and `thoughts/writing/publish-config.yaml` exist.
- [ ] `git log --oneline` shows your bootstrap commit.

---

## What's next

Now that the scaffold is in place:

- Customise cadence in `rules.yaml` if Sunday newsletters don't fit your schedule. See [customization.md](../customization.md#editing-rulesyaml).
- Configure the publish target. By default `publish-config.yaml` writes to `src/content/blog/` (Astro convention). If your blog lives elsewhere, edit it. See [customization.md](../customization.md#editing-publish-configyaml).
- Walk through a full week with [tutorial 03](03-weekly-flow.md).
- Read [philosophy.md](../philosophy.md) to understand why scribetronic is shaped this way.

---

## Troubleshooting

**`scribetronic: command not found` after install.**
You haven't run `npm link` yet, or your shell can't find the linked binary. Either: (a) `cd scribetronic/packages/cli && npm link` to register the bin globally, (b) add an alias to your shell rc pointing at `node /path/to/scribetronic/packages/cli/dist/index.js`, or (c) call the binary by absolute path. See the [root README install section](../../README.md#install).

**`/agenda plan-week today` produces no output.**
Open the file `thoughts/writing/calendar/<current-week>/plan.md` directly. The skill writes to disk silently; the chat output is a summary. If the file isn't there, check that `thoughts/writing/calendar/` exists and is writable.

**`scribetronic style` says `parent directory missing`.**
Run `scribetronic init` first. The `style` command writes into `.claude/skills/writing-style/`, which `init` creates the parent for.

**My `$EDITOR` doesn't open.**
Verify it's set: `echo $EDITOR`. If empty, `scribetronic style` falls back to `$VISUAL`, then to `vi`. To use a different editor: `EDITOR=code scribetronic style` (for VS Code) or `EDITOR=nano scribetronic style`.
