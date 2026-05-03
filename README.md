[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Status: pre-1.0](https://img.shields.io/badge/status-pre--1.0-orange)](#roadmap)

# scribetronic

**One newsletter a week, five derivatives a day. Skill-driven editorial calendar for Claude Code.**

Writing consistently is hard. Writing consistently *across formats* — newsletter, X threads, LinkedIn carousels, devlogs — is harder. Most calendar tools assume you already know what to write. Most AI tools generate slop because they don't know your voice.

scribetronic is a different bet: a small set of opinionated skills that turn one weekly long-form piece into a full week of derivative content, in **your** voice, with quality gates between each step.

You write the source. The pipeline handles the spread.

Works with **Claude Code** today. The skills are portable; the CLI installs them into any project.

---

## Quick Start

### Install

scribetronic is not on npm yet (planned for v1.0). Pick the path that fits you:

**A. Install from GitHub (recommended for cross-machine use):**

```bash
# Clone, build, link globally
git clone https://github.com/r-bart/scribetronic.git
cd scribetronic/packages/cli
npm install && npm run build && npm link

# Now usable from any project:
cd ~/your-writing-project
scribetronic init
```

**B. Run direct without linking (single machine, no PATH changes):**

```bash
git clone https://github.com/r-bart/scribetronic.git ~/scribetronic
cd ~/scribetronic/packages/cli && npm install && npm run build

# Add to your shell rc:
alias scribetronic="node $HOME/scribetronic/packages/cli/dist/index.js"

# Use:
cd ~/your-writing-project
scribetronic init
```

**C. Install as a project dev-dependency (when v0.2 ships a release branch):**

```bash
# Coming soon — see Roadmap.
npm install --save-dev github:r-bart/scribetronic#release/v0.1.x
```

The CLI will:

1. Scaffold the editorial calendar templates into `thoughts/writing/`
2. Install the 21 skills under `.claude/skills/`
3. Create the folder structure for drafts, published pieces, and notes

It does **not** automatically seed your voice — you do that explicitly with `scribetronic style` (next step).

### Seed your voice

```bash
scribetronic style          # Seeds writing-style/SKILL.md from the template, then opens it in $EDITOR
scribetronic style --reset  # Overwrite with the template (asks for confirmation)
```

The first run copies a starter `writing-style/SKILL.md` into your project. After that, edits open it in `$EDITOR` (falls back to `$VISUAL`, then `vi`). On a non-TTY (CI, automation), it just prints the path.

Every long-form and short-form skill reads from this file before generating anything — that's how the pipeline stays in *your* voice instead of generic AI tone.

### Plan and write

Inside Claude Code:

```
/agenda          # Plan the next 7 days
/write           # Draft a piece (long-form or short-form)
/write-publish   # Polish + run quality gates + mark ready
```

That's the whole loop.

---

## What you get

- **21 skills** covering planning, drafting, editing, and quality
- **3 orchestrators** that compose the pipeline
- **6 long-form formats** (newsletter, devlog, hot take, how-to, launch retro, manifesto)
- **8 short-form formats** (X vs Y, listicles, observations, carousels, threads, etc.)
- **4 shared utilities** (style, editing, AI-slop check, style extraction)
- **A small CLI** to install, list, and inspect skills

No accounts. No SaaS. Plain markdown files in your repo.

---

## Documentation

| Document | Description |
|----------|-------------|
| [Architecture](./docs/ARCHITECTURE.md) | Repo layout and skill organization |
| [Philosophy](./docs/philosophy.md) | Why scribetronic exists and what it bets on |
| [Skills Reference](./docs/skills.md) | Detailed docs for all 21 skills |
| [CLI Reference](./docs/cli-reference.md) | Full command documentation |
| [Customization](./docs/customization.md) | Editing `rules.yaml`, `publish-config.yaml`, voice |
| [Contracts](./docs/contracts.md) | Pipeline data contracts (week IDs, plan schema, etc.) |
| [Tutorials](./docs/tutorials/) | Step-by-step walkthroughs |

---

## Skills overview

### Orchestrators (3)

| Skill | What it does |
|-------|--------------|
| `/agenda` | Plans the next 7 days of content from your backlog and goals |
| `/write` | Drafts a single piece in the chosen format |
| `/write-publish` | Polishes a draft, runs quality gates, marks it ready |

### Shared utilities (4)

| Skill | What it does |
|-------|--------------|
| `/writing-style` | Your voice baseline — read by every other skill |
| `/editing-pass` | Structural + line edits, preserving voice |
| `/ai-slop-check` | Detects generic AI patterns, hedge words, em-dash abuse |
| `/style-extract` | Extracts a style profile from existing writing samples |

### Long-form (6)

| Skill | Format |
|-------|--------|
| `/long-form-weekly-newsletter` | The flagship weekly piece |
| `/long-form-monthly-devlog` | Build-in-public retrospective |
| `/long-form-hot-take` | Pointed opinion on a current topic |
| `/long-form-how-to` | Tutorial-style walkthrough |
| `/long-form-launch-retro` | Post-launch lessons learned |
| `/long-form-manifesto` | Belief-driven essay |

### Short-form (8)

| Skill | Format |
|-------|--------|
| `/short-form-x-vs-y` | Comparison post |
| `/short-form-listicle` | Numbered list |
| `/short-form-observation` | One-sharp-thought post |
| `/short-form-motivational` | Energy / mindset post |
| `/short-form-present-vs-future` | Then-vs-now framing |
| `/short-form-thread-from-longform` | X/Twitter thread derived from a long-form piece |
| `/short-form-carousel-li` | LinkedIn carousel |
| `/short-form-voice-adjustments` | Re-tune any short post to a target platform |

---

## CLI

Four commands. That's it.

```bash
scribetronic init [path]      # Scaffold project templates
scribetronic style [--reset]  # Seed or edit writing-style skill
scribetronic list             # List bundled skills
scribetronic info <skill>     # Show skill metadata
```

See [docs/cli-reference.md](./docs/cli-reference.md) for full flags and examples.

---

## How it fits into a week

```
Monday      → /agenda                  (plan the week)
Tue–Wed     → /write long-form         (draft the flagship piece)
Thursday    → /write-publish           (polish, quality gates, ship)
Fri–Sun     → /short-form-* x5         (derivatives across platforms)
```

One source piece, five derivatives. Compounding output without compounding effort.

---

## Philosophy

- **Voice first.** Generic AI writing is a liability. Every skill reads `/writing-style` before generating anything.
- **Quality gates between steps.** `/ai-slop-check` and `/editing-pass` run on every draft before it's marked ready.
- **Skills, not chains.** Each skill is independent and inspectable. Compose them however you want.
- **Plain files.** Your content lives in your repo as markdown. No vendor lock-in, no proprietary database.
- **Refined daily.** This toolkit comes from the writing pipeline I run for my own newsletter. It evolves with use.

---

## Local development

If you want to hack on scribetronic itself (before publishing to npm, or to contribute):

```bash
git clone https://github.com/r-bart/scribetronic.git
cd scribetronic/packages/cli
npm install
npm run dev
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the full contributor guide.

---

## Roadmap

- **v0.1** — Core skills + CLI (`init`, `style`, `list`, `info`). **Current.**
- **v0.2** — `release/v0.1.x` branch with `package.json` at root for direct GitHub install (`npm i github:r-bart/scribetronic#release/v0.1.x`); harder `style` test cases; `update --skills-only` command.
- **v0.3** — Multi-author voice profiles; `list --tree` showing the inheritance graph.
- **v0.4** — Plugin marketplace integration for Claude Code (`/plugin add scribetronic`).
- **v0.5** — Calendar export (ICS, Notion, Google Calendar) and analytics hooks feeding back into `/agenda`.
- **v1.0** — Public npm release.

Feedback and ideas: [open an issue](https://github.com/r-bart/scribetronic/issues).

---

## Related

- [devtronic](https://github.com/r-bart/devtronic) — The engineering counterpart. Same philosophy, applied to code.
- See [RECOMMENDED-SKILLS.md](./RECOMMENDED-SKILLS.md) for skills and plugins that pair well with scribetronic.

---

## License

[MIT](./LICENSE) © 2026 Roberto Díaz
