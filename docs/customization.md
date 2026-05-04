# Customization

Scribetronic is opinionated by default and configurable where it matters. This document covers every override point.

The golden rule: **config wins over skills**. If you change a config file, the skills follow. You should never need to edit a `SKILL.md` file unless you're contributing to scribetronic itself.

See also [contracts.md §7](contracts.md) for the formal source-of-truth rule.

---

## What you can customise

| Concern | File | Owner |
|---|---|---|
| Cadence (recurring slots) | `scribetronic/calendar/rules.yaml` | You |
| Publish targets and frontmatter mappings | `scribetronic/publish-config.yaml` | You |
| Voice | `scribetronic/style/writing-style.md` | You (via `scribetronic style`) |
| Ideas backlog | `scribetronic/ideas/<type>.md` | You |
| Per-week plan | `scribetronic/calendar/<YYYY-WNN>/plan.md` | You + `/agenda` |

What you **should not** edit:

- Any other `SKILL.md` under `.claude/skills/` (excepting `writing-style`). These are scribetronic-owned and refresh on `scribetronic init` after upgrades.
- `scribetronic/calendar/history.md` (append-only, written by skills).
- Files inside `scribetronic/calendar/<week>/` other than `plan.md` (the week directory is the skills' working set).

---

## Editing `rules.yaml`

`rules.yaml` controls the recurring cadence — what content type fires on what day, with what seed.

### Example — default scribetronic rules

```yaml
# scribetronic/calendar/rules.yaml
#
# Schema (closed — do NOT add fields):
#   - name: <unique-string>
#     when: { weekday: <day> | monthday: <1..31|negative> | nth_weekday_of_month: "<ordinal> <day>" }
#     type: <one of the 14 writing types>
#     seed_template: "<optional template string with {{date}}, {{week}}>"
#     active_from: <YYYY-MM-DD>          # optional
#     active_until: <YYYY-MM-DD>         # optional
#     overrides: [<other-rule-name>]     # optional

rules:
  - name: weekly-newsletter
    when: { weekday: sunday }
    type: weekly-newsletter
    seed_template: "Week of {{week}} — what I learned"

  - name: monthly-devlog
    when: { nth_weekday_of_month: "first sunday" }
    type: monthly-devlog
    seed_template: "Monthly devlog — {{date}}"
    overrides: [weekly-newsletter]
```

### Common edits

**Move the newsletter from Sunday to Friday:**

```yaml
- name: weekly-newsletter
  when: { weekday: friday }      # was: sunday
  type: weekly-newsletter
```

**Add a quarterly manifesto:**

```yaml
- name: quarterly-manifesto
  when: { monthday: 1 }                   # first of every month — refine via overrides
  type: manifesto
  active_from: 2026-01-01
  overrides: [weekly-newsletter]
```

**Pause the newsletter for a month:**

```yaml
- name: weekly-newsletter
  when: { weekday: sunday }
  type: weekly-newsletter
  active_until: 2026-08-01
```

After saving, run `/agenda plan-week <date>` to scaffold the next week with the new rules.

### Resolution order (do not memorise — see [contracts.md §5](contracts.md))

For a given date `D`:

1. If `plan.md` for `D`'s week has a row for `D`, that row wins (status `skipped` short-circuits to null).
2. Otherwise, apply `rules.yaml`: drop rules outside their `active_from`/`active_until` window, match `when`, apply `overrides`, and if multiple rules survive, the one defined **later** in the file wins.

**Mnemonic: plan beats rules, skip beats both.**

---

## Editing `publish-config.yaml`

`publish-config.yaml` controls where `/write-publish` sends finished drafts.

### Example — Astro blog target

```yaml
# scribetronic/publish-config.yaml

content_types:
  weekly-newsletter:    { target: blog }
  monthly-devlog:       { target: blog }
  hot-take:             { target: blog }
  how-to:               { target: blog }
  launch-retro:         { target: blog }
  manifesto:            { target: blog }

targets:
  blog:
    path: src/content/blog
    format: mdx
    frontmatter:
      title:        { from: draft.title }
      description:  { from: prompt, fallback: draft.description }
      pubDate:      { from: published_date, default: today }
      tags:         { from: draft.tags, default: [] }
    filename: "{{date}}-{{slug}}.mdx"

social_archive:
  base: scribetronic/social_archive
  layout:
    x:        "x/{{date}}-{{slug}}.md"
    linkedin: "linkedin/{{date}}-{{slug}}.md"
    threads:  "threads/{{date}}-{{slug}}.md"
    carousel: "linkedin-carousel/{{date}}-{{slug}}.md"

gates:
  require_ready_status: true        # block publish unless frontmatter status: ready
  strict_slop_check:    true        # block publish on HIGH slop findings
  archive_completed_weeks: false    # auto-move calendar/<week>/ to archive/ when all rows published
```

### Adding a new publish target

To send `monthly-devlog` to a separate Astro `newsletter` collection instead of the blog:

```yaml
content_types:
  monthly-devlog: { target: newsletter }   # was: blog

targets:
  newsletter:
    path: src/content/newsletter
    format: mdx
    frontmatter:
      title:       { from: draft.title }
      description: { from: prompt }
      date:        { from: published_date, default: today }
      type:        { value: "newsletter" }
    filename: "{{date}}-{{slug}}.mdx"
```

No skill code change needed — `/write-publish` reads everything from this file.

### Adding a new social platform

To archive Mastodon derivatives:

```yaml
social_archive:
  layout:
    mastodon: "mastodon/{{date}}-{{slug}}.md"
```

Then any derivative whose frontmatter has `platform: mastodon` will archive to that path. The subdirectory auto-creates on first publish.

---

## Editing voice (`scribetronic style`)

Voice lives in `scribetronic/style/writing-style.md`. Every long-form template inherits from it via `inherits: ../writing-style/SKILL.md`.

### Initial seed

`scribetronic init` does **not** create the voice file. You author it deliberately:

```bash
$ scribetronic style
# first run: copies the bundled seed into scribetronic/style/writing-style.md
# prints the path

$ scribetronic style
# subsequent runs: opens the file in $EDITOR
```

### What to put in `writing-style/SKILL.md`

The bundled seed contains placeholder sections you fill in:

- **Voice**: how you sound. Active voice, vocabulary, sentence rhythm.
- **Anti-patterns**: phrases / structures you never use.
- **Length conventions**: target word counts, paragraph length.
- **Anchors**: writers / pieces you imitate.

A good `writing-style/SKILL.md` is concrete and reads like a style guide written FOR you, not BY a generic style model.

### Resetting to the seed

```bash
$ scribetronic style --reset
? Overwrite existing writing-style/SKILL.md with the seed? (y/N) y
```

This is destructive — your voice file is replaced. Commit before resetting if you want a recovery point.

### Why not bundle voice in `init`?

Two reasons:

1. **Voice is personal.** A generic voice file silently installed produces generic writing.
2. **You should engage with it.** The friction of running `scribetronic style` is a feature, not a bug — it makes voice authoring an explicit act.

---

## Adding ideas to the backlog

`scribetronic/ideas/` is a writer-owned brainstorming area. One file per content type. No skill writes to these files; they're a notebook you grep.

### Schema (per [contracts.md §8](contracts.md))

```markdown
---
type: weekly-newsletter
description: Recurring Sunday newsletter — 800–1500 words
---

# Ideas — weekly-newsletter

> Loose backlog. Add bullets freely. Promote to a week with /agenda plan-week (manual copy for now).

## Active

- [ ] What I learned shipping product #2
- [ ] The hidden cost of "best practices"

## Used

- [x] Why I stopped using Notion → published 2026-04-26 as `week-17-leaving-notion`

## Cold / parked

- The case for monorepos in 2026
```

### Status conventions

- `- [ ]` — active. Ready to be promoted to a plan.
- `- [x]` — used. Append a one-line trail (`→ published <date> as <slug>`) so you can find it later.
- Plain bullet under `## Cold / parked` — explicitly shelved.

### Promoting an idea to a week

There is no `/agenda promote` command in v0.1. The flow is manual:

1. `/agenda plan-week monday` — scaffolds the week's `plan.md` with default rotation.
2. Edit `plan.md`'s `weekly-newsletter` row, replacing the placeholder `Slug` and updating the seed.
3. Mark the idea `- [x]` in `ideas/weekly-newsletter.md` with the trail.

The friction is intentional — promotion is a small editorial decision, not a button click.

---

## The source-of-truth rule

When config and code disagree, **config wins**. This is contract 7 in [contracts.md](contracts.md).

Concretely:

- `/write-publish` reads paths and key names from `publish-config.yaml`. If you change a path in the config, the skill follows. The skill never hardcodes paths.
- `/agenda` reads cadence from `rules.yaml`. The schema is closed — no `id`, `priority`, `cron`, or `schedule` fields, ever.
- `plan.md`'s schema in [contracts.md §3](contracts.md) is canonical. If a skill writes a different shape, the skill is wrong.

This means upgrades are safe: updating scribetronic refreshes skills, but your config is untouched.

---

## Idempotence guarantees

`scribetronic init` is **idempotent** — safe to re-run on a project that's already been initialised:

- Existing files are skipped (printed as `exists`, not overwritten).
- `.example.yaml` files are renamed to `.yaml` only on first creation; if `<file>.yaml` already exists, the rename is skipped.
- New templates added in a future scribetronic release will land on a re-run; pre-existing files won't be touched.

This is your upgrade path: bump the scribetronic version (`cd ~/scribetronic/packages/cli && git pull && npm run build`), re-run `scribetronic init` in your project, and any new skills land while your config and content stay intact.

### What `init` will NOT touch

- `scribetronic/calendar/<YYYY-WNN>/` — your active and past weeks.
- `scribetronic/calendar/history.md` — your published archive.
- `scribetronic/ideas/<type>.md` if it already has content — only seeded the first time.
- `scribetronic/style/writing-style.md` — managed by `scribetronic style`, not `init`.
- Any file in your project outside `.claude/` and `scribetronic/`.

If you're worried, run `git status` after `init` to see exactly what changed.

---

## Removing scribetronic

Scribetronic does not provide an `uninstall` command in v0.1. Manual cleanup:

```bash
# Remove the installed skills (your content stays)
rm -rf .claude/skills/{agenda,write,write-publish,writing-style,editing-pass,ai-slop-check,style-extract}
rm -rf .claude/skills/long-form-*
rm -rf .claude/skills/short-form-*

# Optionally remove the npm package
npm uninstall -g scribetronic
```

Your `scribetronic/` directory is unaffected. The content, calendar, ideas, and history all stay — they're yours.
