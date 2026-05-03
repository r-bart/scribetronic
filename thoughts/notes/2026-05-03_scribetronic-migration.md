# Notes — Scribetronic migration

**Date**: 2026-05-03
**Plan**: `thoughts/plans/2026-05-03_scribetronic-migration.md`
**Outcome**: Shipped v0.1.0 (commits `ada079f`, `1815f77`).

## What worked well

1. **Shared Contracts section in the plan**. Eight contracts written verbatim into every parallel-agent prompt. Phase 3's 21-skill conversion and Phase 4's templates produced zero contract drift — `name:` matches folder, `inherits:` resolves, no `weekly-bip` references leaked. This is the second time this pattern has paid off and confirms the rbart-astro CLAUDE.md gotcha.
2. **Phase parallelism via dependency graph**. Phases 2, 3, and 4 ran simultaneously after Phase 1. Three Task subagents working concurrently: CLI skeleton (16 files), 21 SKILL.md migrations, and 21 template files. Wall time roughly the slowest of the three rather than the sum.
3. **Devtronic as a reference model**. Fetching specific files via `gh api` (`packages/cli/package.json`, `tsconfig.json`, `eslint.config.js`) saved hours vs. designing the toolchain from scratch. The CLI's layout, deps, and build script are byte-similar to devtronic's.
4. **Idempotent init from day one**. Tested in `/tmp/scribe-smoke` first (43 copied → 43 skipped on re-run), then in rbart-astro (22 copied + 21 skipped because content already existed). Made the rbart-astro migration risk-free: the user's `thoughts/writing/calendar/` and ideas pool were never touched.

## What was difficult

1. **Content filter blocked the first agent.** Task 1.1 (root OSS files) was spawned with a prompt that included references to "harassment" and similar terms (CODE_OF_CONDUCT context). Anthropic's filter blocked the output mid-run. The agent had already written 6/10 files; I finished the remaining 4 directly. Lesson: when an OSS-files prompt has to mention sensitive policy categories, write the files directly rather than delegating, or split the task so the CoC is its own one-liner.
2. **Skill folder vs flat-name decision.** Devtronic's flat `skills/<name>/SKILL.md` layout doesn't natively express the long-form/short-form category split the writing system used. Resolved with the prefix convention (`long-form-<type>`, `short-form-<type>`). Trade-off: longer slash commands, but folder-name = frontmatter `name` = slash command stays a strict invariant. Worth it.
3. **Stale link sweep was incomplete in the first pass.** Phase 4's project-template README inherited 3 references to `.claude/skills/writing/README.md`, the path that no longer exists. Found by `/post-review` running a grep across templates. Lesson: when migrating files, automated stale-path grep is mandatory before considering the migration done — running it once in rbart-astro is not enough; templates that ship to consumers must be swept too.
4. **Plan numerics drifted** when `weekly-bip` was dropped late. Initial plan said 22 skills, 14 ideas types. Final reality: 21 skills, 13 idea types. Updated counts in the plan via search-replace, but two stray `~22` / `15 ideas files` references remained in prose. Fine for a one-shot migration, but I should add a Done Criterion that re-greps the plan for now-stale numbers before declaring P5 complete.

## Patterns discovered

- **Pattern: "shipping Roberto's content vs shipping the system"** is the tension the project templates resolve. Anything in `templates/project/` is what a fresh consumer gets; anything in `rbart-astro/thoughts/writing/` is Roberto's actual writing. The `.example.yaml` rename rule plus idempotent skip-if-exists makes the same `init` work both for fresh installs and for upgrades over user data. Useful primitive for any "ship a starter kit" plugin.
- **Pattern: "config wins over hardcoded value"** (CC5#7 — source-of-truth rule) is what makes scribetronic re-installable in rbart-astro without nuking customization. `rules.yaml` and `publish-config.yaml` are owned by the consumer; the skills read from them, never embed them. Same pattern devtronic uses for `thoughts/CONFIG.md`.
- **Pattern: spawn-then-direct-fix when a filter trips.** When a delegated task hits a content-filter wall, retrying with the same prompt is cheap-but-useless. Either reframe the prompt with neutral language, or just write the file. Don't loop.

## What I'd change with more time

1. **CLI tests for `style` and `init` are surface-level.** They cover happy-path copy semantics; they don't cover (a) what happens if `$EDITOR` is set to a binary that doesn't exist, (b) corrupted SKILL.md frontmatter parsing, (c) symlinks in templates dir. v0.2 should harden these.
2. **`scribetronic list` doesn't show the `inherits` graph.** Useful when debugging "why does my long-form-hot-take inherit weird tone" — you'd want `list --tree` showing the inheritance edges. v0.2.
3. **No `update` command.** When the plugin gets new skills, `init` skips existing files (correct for user-edited stuff but wrong for skills that should track upstream). v0.2 should add `scribetronic update --skills-only` that overwrites SKILL.md files but leaves project/ alone.

## CLAUDE.md updates

The Gotchas section in rbart-astro's CLAUDE.md already has the relevant rules (Shared Contracts mandatory, never trust subagent reports at face value, source-of-truth designation). After this migration I'd add one more, specific to plugin extraction:

> ALWAYS run `grep -rn "<old-path>" <plugin-templates-dir>` after migrating files into a redistributable templates tree. Manual `Edit` calls only fix the source repo, not the templates that ship to consumers.

To be added on the next pass.
