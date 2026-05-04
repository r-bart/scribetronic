# Ideas

Loose backlog, one file per content type. The writer adds bullets freely; nothing here is consumed automatically by any skill. When you scaffold a week with `/agenda plan-week`, you skim these files, pick a couple of bullets, and paste them as seeds. Promoted bullets get a `→ drafted` or `→ published` trail in the `Used` section so you can find them later.

## Layout

```
scribetronic/ideas/
├── README.md                    ← you are here
├── weekly-newsletter.md
├── monthly-devlog.md
├── hot-take.md
├── how-to.md
├── launch-retro.md
├── manifesto.md
├── x-vs-y.md
├── listicle.md
├── observation.md
├── motivational.md
├── present-vs-future.md
├── thread.md
└── carousel.md
```

## File schema

```markdown
---
type: <one of the 13>
description: <one-line description>
---

# Ideas — <type>

> Loose backlog. Add bullets freely. Promote to a week with `/agenda plan-week` (manual copy for now).

## Active

- [ ] <idea — short hook, one line or a small paragraph>

## Used

- [x] <idea> → published <YYYY-MM-DD> as `<example-slug>`

## Cold / parked

- <idea, no checkbox — explicitly de-prioritised>
```

## Status conventions

| Marker | Meaning |
|---|---|
| `- [ ]` | Active. Available for promotion. |
| `- [x]` | Used. Append a trail line: `→ drafted <date>, slug <slug>` or `→ published <date> as <slug>`. |
| Plain bullet under `## Cold / parked` | Explicitly shelved. Re-promote anytime by moving back to Active. |

## Workflow

1. Whenever an idea hits, open the right file (or this README's index) and add a bullet to `## Active`.
2. When scaffolding a week (`/agenda plan-week`), skim the type files relevant to this week's plan.
3. Pick a bullet, paste its hook as the seed for the week's newsletter or for a derivative slot.
4. Move the bullet to `## Used` and append the trail line.
5. Periodically (monthly), prune `## Cold / parked` — delete bullets you'll never touch.
