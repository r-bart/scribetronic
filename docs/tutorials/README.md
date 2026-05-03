# Tutorials

Step-by-step walkthroughs for the most common scribetronic flows.

---

## Choose your starting point

| You are... | Start here |
|---|---|
| Setting up a brand new project from scratch | [01-new-project.md](01-new-project.md) |
| Retrofitting scribetronic into an existing repo | [02-existing-project.md](02-existing-project.md) |
| Already initialised; want to see a full week in action | [03-weekly-flow.md](03-weekly-flow.md) |

---

## Prerequisites

Before any tutorial:

- **Node.js >= 18** installed.
- **Claude Code** installed and configured. Scribetronic skills are markdown files Claude Code reads at runtime — without Claude Code, the skills don't run.
- **A git repo** for the project (recommended; not strictly required, but you'll want version control over your editorial calendar).

Verify:

```bash
$ node --version
v20.10.0           # any v18+ works

$ which claude     # or however you invoke Claude Code on your platform
/usr/local/bin/claude
```

---

## What each tutorial covers

### [01 — New project (5 minutes)](01-new-project.md)

Bootstrapping from zero:

1. Create a project directory.
2. `npx scribetronic init`.
3. `scribetronic style` to seed your voice.
4. `/agenda plan-week today` to scaffold the current week.
5. Verify the resulting tree.

End state: empty editorial calendar ready for your first newsletter.

### [02 — Existing project (10 minutes)](02-existing-project.md)

Retrofitting an existing repo:

1. What scribetronic creates and what it leaves alone.
2. How idempotent `init` interacts with existing `.claude/` setups.
3. Coexisting with other Claude Code skills.
4. Migrating from a previous editorial system.

End state: scribetronic running alongside your existing toolchain without conflicts.

### [03 — Weekly flow (30 minutes)](03-weekly-flow.md)

A full week, day by day:

- **Sunday evening:** plan next week with `/agenda plan-week monday`.
- **Monday–Saturday:** publish derivatives.
- **Sunday afternoon:** write the newsletter, generate derivatives, publish.

End state: you've shipped a complete weekly cycle and understand the rhythm.

---

## After the tutorials

Once you've completed at least one of these:

- Read [philosophy.md](../philosophy.md) to understand why scribetronic is shaped this way.
- Read [contracts.md](../contracts.md) to understand the data formats your weeks live in.
- Read [customization.md](../customization.md) when you're ready to bend cadence to your real schedule.
- Browse [skills.md](../skills.md) to see what's bundled.
- Reference [cli-reference.md](../cli-reference.md) for command details.
