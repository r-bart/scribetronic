# Tutorial 2 — Retrofitting an existing project

Estimated time: **10 minutes**.

This tutorial covers adding scribetronic to a project that already exists — possibly with its own `.claude/` setup, its own content directories, or its own previous editorial system.

---

## Before you start

Make sure your repo is committed clean before running `init`. Although `scribetronic init` is idempotent and never overwrites, you'll want a clean diff to inspect after the fact.

```bash
$ cd my-existing-project
$ git status
nothing to commit, working tree clean
```

---

## Step 1 — Inventory what already exists

Check whether you have any of the paths scribetronic will populate:

```bash
$ ls .claude/skills/ 2>/dev/null
$ ls scribetronic/ 2>/dev/null
```

Three possible scenarios:

### Scenario A — Neither path exists

You're effectively in the same position as a new project. Follow [tutorial 01](01-new-project.md) and skip the rest of this document.

### Scenario B — `.claude/` exists with other skills, no `scribetronic/`

Scribetronic will add new skills under `.claude/skills/<name>/` without touching your existing skills. `init` is idempotent.

### Scenario C — A previous editorial system exists at `scribetronic/`

You'll need to decide whether to migrate or coexist. See **Migrating from a previous system** below.

---

## Step 2 — Run `scribetronic init`

```bash
$ scribetronic init
```

The output shows three categories of action:

```
created  .claude/skills/agenda/SKILL.md             # new file
created  .claude/skills/write/SKILL.md              # new file
exists   .claude/skills/my-existing-skill/SKILL.md  # untouched
exists   scribetronic/calendar/2026-W17/        # untouched (your old week)
created  scribetronic/calendar/rules.yaml       # new (from rules.example.yaml)
...
✓ scribetronic installed. 18 created, 4 skipped.
```

Anything marked `exists` was preserved as-is. Anything marked `created` is new.

---

## Step 3 — Inspect the diff

```bash
$ git status
On branch main
Untracked files:
  (use "git add <file>..." to include in what will be committed)
        .claude/skills/agenda/
        .claude/skills/ai-slop-check/
        .claude/skills/editing-pass/
        ... (18 more skill directories)
        scribetronic/README.md
        scribetronic/calendar/README.md
        scribetronic/calendar/history.md
        scribetronic/calendar/index.md
        scribetronic/calendar/rules.yaml
        scribetronic/ideas/
        scribetronic/publish-config.yaml
```

Review what changed. If anything looks wrong, you can `rm -rf` the new files and re-run `init`.

If there's nothing surprising:

```bash
$ git add .
$ git commit -m "feat: add scribetronic editorial pipeline"
```

---

## Step 4 — Author your voice

Same as step 3 of [tutorial 01](01-new-project.md):

```bash
$ scribetronic style          # seeds the file
$ scribetronic style          # opens it in $EDITOR for editing
```

If your existing project already has a writing style file under a different name (e.g. `.claude/voice.md`, `style-guide.md`), you can paste its contents into the new `.claude/skills/writing-style/SKILL.md`. Make sure the frontmatter remains valid.

---

## Step 5 — Configure publish target

`scribetronic init` ships a default `publish-config.yaml` that targets `src/content/blog/` (Astro convention). Edit it to match your project's structure:

```bash
$ cat scribetronic/publish-config.yaml
```

Common adjustments:

| Your stack | Edit |
|---|---|
| Astro at `src/content/blog/` | No change needed. |
| Astro at a different path | Update `targets.blog.path`. |
| Next.js at `app/posts/` | Update `targets.blog.path` to `app/posts/`, change `format: mdx` if you use markdown. |
| Hugo at `content/posts/` | Update path; ensure frontmatter mappings produce Hugo-compatible fields. |
| 11ty / Eleventy | Update path; check the date format. |
| Custom path | Update `targets.blog.path`. |

See [customization.md](../customization.md#editing-publish-configyaml) for the full schema.

---

## What scribetronic creates vs leaves alone

### Created (new files)

- `.claude/skills/<name>/` — 20 skill folders (the 21st, `writing-style`, is created by `scribetronic style`).
- `scribetronic/README.md`
- `scribetronic/publish-config.yaml`
- `scribetronic/calendar/{README,index,history}.md`
- `scribetronic/calendar/rules.yaml`
- `scribetronic/calendar/archive/.gitkeep`
- `scribetronic/ideas/<14 type files>.md`
- `scribetronic/ideas/README.md`

### Left alone

- Anything pre-existing at any of the above paths.
- All other paths in your repo (`src/`, `package.json`, your `.gitignore`, etc.).
- Existing Claude Code skills, agents, or rules under `.claude/`.
- Existing content directories (your blog posts, etc.).

If you want to confirm before running `init`, use `git status` after the run rather than guessing — the diff is the truth.

---

## Coexisting with other Claude Code skills

Scribetronic skills live at `.claude/skills/<name>/` (one folder per skill). If your project has other skills under the same parent directory, they remain untouched.

Concrete example — a project with a `git-helper` skill that you want to keep:

```
.claude/skills/
├── git-helper/SKILL.md          # your existing skill
├── agenda/SKILL.md              # added by scribetronic
├── write/SKILL.md               # added by scribetronic
├── ... (19 more scribetronic skills)
```

Both invocations work in Claude Code: `/git-helper` (yours) and `/write` (scribetronic's).

The only conflict scenario is if you have an existing skill folder with the same name as a scribetronic skill. In that case, scribetronic will skip the file and leave yours in place. You can either:

- Rename your skill, OR
- Manually merge the two (if they're related), OR
- Decide your skill takes priority and delete the scribetronic version (you can recover it with `scribetronic init` after deleting your version, but generally if the names collide you have a deeper design question to answer).

---

## Migrating from a previous editorial system

If you have existing weekly newsletters or social-post archives under a different structure, you have three options:

### Option 1: Coexist (no migration)

Leave your old content where it is. Use scribetronic only for new content. Old posts stay readable; new posts follow the new convention. This is the lowest-effort option.

### Option 2: Migrate by hand

For each old newsletter:

1. Create the corresponding week directory: `scribetronic/calendar/<YYYY-WNN>/`.
2. Move the newsletter file into `scribetronic/calendar/<YYYY-WNN>/newsletter.md`.
3. Add the frontmatter from [contracts.md §6](../contracts.md). Set `status: published` and add a `published_date`.
4. Create a minimal `plan.md` with one row at status `published`.
5. Append a row to `calendar/history.md`.

This is tedious but produces a clean archive. Worth doing for the most recent ~5 newsletters; older content can stay where it is.

### Option 3: Migrate via script

If you have many old posts, write a one-off Node or bash script to do the conversion. Scribetronic does not provide a migration tool in v0.1; this is genuinely your job.

---

## Verification

```bash
# Skill count (writing-style not yet authored)
$ find .claude/skills -name SKILL.md | wc -l
20

# After `scribetronic style`
$ find .claude/skills -name SKILL.md | wc -l
21

# Config files exist
$ ls scribetronic/calendar/rules.yaml scribetronic/publish-config.yaml

# Idempotent re-run produces no changes
$ scribetronic init
exists   .claude/skills/agenda/SKILL.md
... (everything is "exists")
✓ no changes.
```

---

## What's next

- [tutorial 03](03-weekly-flow.md) walks you through a complete week.
- [customization.md](../customization.md) covers per-config overrides.
- [contracts.md](../contracts.md) is the canonical reference if you're migrating content by hand.

---

## Troubleshooting

**Some skills installed, others didn't.**
Re-run `scribetronic init`. It's idempotent — it'll fill in anything missing and skip what's there.

**My existing `.claude/` had different conventions and now things conflict.**
Open Claude Code in the project and try `/agenda show today`. If Claude routes to your skill instead of scribetronic's, you have a name collision — see "Coexisting with other Claude Code skills" above.

**Old editorial content references paths scribetronic doesn't recognise.**
That's fine. Scribetronic only reads files it expects under `scribetronic/calendar/<YYYY-WNN>/`. Anything else is invisible to it.

**My `publish-config.yaml` doesn't fit my stack.**
Edit it. The skill `/write-publish` reads paths and key names from this file — there's no hardcoding to fight against. See [customization.md](../customization.md#editing-publish-configyaml).
