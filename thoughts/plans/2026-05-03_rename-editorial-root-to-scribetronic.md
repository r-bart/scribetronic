# Implementation Plan: Rename Editorial Root `thoughts/writing/` → `scribetronic/`

**Date**: 2026-05-03
**Status**: Draft

---

## Overview

Rename the scaffolded editorial root directory from `thoughts/writing/` to `scribetronic/` across templates, skills, CLI source, tests, and docs. This decouples scribetronic's content output from the devtronic `thoughts/` convention (which is for internal dev notes/plans/design, not publishable content). Breaking change, acceptable at v0.1.0 with no wide adoption.

## Requirements

- [ ] Scaffolded user projects get a top-level `scribetronic/` directory (calendar/, ideas/, published/, publish-config.yaml) instead of `thoughts/writing/`
- [ ] All bundled skills (`agenda`, `write`, `write-publish`, `style-extract`, plus the 14 long-form/short-form skills if any reference the path) point at the new root
- [ ] CLI detection heuristic (`analyzeProject`) updated
- [ ] All docs (root + `docs/` + tutorials) updated to the new path
- [ ] Tests updated and passing
- [ ] CHANGELOG entry under `[Unreleased]` with a clear "Changed (BREAKING)" note and migration recipe (`mv thoughts/writing scribetronic`)
- [ ] Smoke: `scribetronic init` into a clean temp dir produces `scribetronic/` (and not `thoughts/writing/`)
- [ ] Quality gates pass: `npm run typecheck && npm run lint && npm test && npm run build`

---

## Approach Analysis

### Option A: Hardcoded rename (chosen)

**Description**: Mechanical rename. Move the template directory on disk, then global-replace `thoughts/writing` → `scribetronic` everywhere. No new abstraction.

**Pros**:
- Minimal surface area; no new code paths
- Easy to review (mostly diffs of strings)
- No backwards-compat shims to maintain
- Done in one PR

**Cons**:
- Next rename would require the same global replace
- No user override (everyone gets `scribetronic/`)

**Complexity**: Low

### Option B: Configurable `content_root` in `publish-config.yaml`

**Description**: Introduce a `content_root: scribetronic` key and refactor every skill + CLI path resolution to read from it. Default value is `scribetronic`.

**Pros**:
- Future renames are config-only
- Users with custom layouts can override
- Cleaner architecture (single source of truth)

**Cons**:
- Significant skill rewrite — every skill currently uses literal paths in instructions and grep examples; making those dynamic in markdown is awkward
- Skills are markdown prose, not code — they'd need templating or convention markers ("read `${content_root}` from publish-config")
- Shifts cost from one rename to ongoing complexity for a benefit (renaming again) we don't have evidence we'll need
- Bigger blast radius, harder review

**Complexity**: High

### Recommendation

**Option A**. The skills are prose instructions to Claude — coupling them to a config var works against their readability. v0.1.0 is the cheap moment to land a hardcoded rename. If we later need configurability, we can introduce it then with real evidence. Defer Option B.

---

## Files to Create/Modify

### Templates (move + edit)

| File | Action | Notes |
|------|--------|-------|
| `packages/cli/templates/project/thoughts/writing/` (whole tree) | **Move** → `packages/cli/templates/project/scribetronic/` | Use `git mv` to preserve history |
| `packages/cli/templates/project/scribetronic/README.md` | Modify | 13 occurrences of `thoughts/writing` → `scribetronic` |
| `packages/cli/templates/project/scribetronic/calendar/README.md` | Modify | 4 occurrences |
| `packages/cli/templates/project/scribetronic/ideas/README.md` | Modify | 1 occurrence |
| `packages/cli/templates/project/scribetronic/publish-config.example.yaml` | Modify | 1 occurrence |
| `packages/cli/templates/project/thoughts/` (parent dir) | **Delete if empty** after move | Should be empty |

### Skills (in-place edits)

| File | Action | Occurrences |
|------|--------|-------------|
| `packages/cli/templates/claude-code/.claude/skills/agenda/SKILL.md` | Modify | 20 |
| `packages/cli/templates/claude-code/.claude/skills/write/SKILL.md` | Modify | 16 |
| `packages/cli/templates/claude-code/.claude/skills/write-publish/SKILL.md` | Modify | 23 |
| `packages/cli/templates/claude-code/.claude/skills/style-extract/SKILL.md` | Modify | 4 |
| `packages/cli/templates/claude-code/.claude/skills/**/SKILL.md` (others) | Audit | grep all 21 skills to be sure no other references slipped in (long-form-*, short-form-*, editing-pass, ai-slop-check, writing-style, write-publish, agenda) |

### CLI source

| File | Action | Notes |
|------|--------|-------|
| `packages/cli/src/analyzers/project.ts` | Modify | Update `writingDir` path constant + the JSDoc comment "True if `thoughts/writing/` exists." → `scribetronic/`. Consider renaming `hasWritingDir` → `hasContentDir` (optional; keep if it impacts callers) |
| `packages/cli/src/commands/init.ts` | Audit | Currently no hardcoded path, but verify after rename |

### Tests

| File | Action | Notes |
|------|--------|-------|
| `packages/cli/src/__tests__/init.test.ts` | Modify | 6 occurrences (`thoughts/writing/calendar/...` paths in `expect(existsSync(...))` calls) |
| `packages/cli/src/__tests__/templateCopier.test.ts` | Modify | 2 occurrences in `transformDestPath` test |
| `packages/cli/src/__tests__/skills.test.ts` | Audit | No matches but verify post-edit |
| `packages/cli/src/__tests__/style.test.ts` | Audit | No matches but verify post-edit |

### Docs (repo-level)

| File | Action | Occurrences |
|------|--------|-------------|
| `README.md` | Modify | 1 |
| `CLAUDE.md` | Audit | 0 matches but verify (it documents `thoughts/notes/` for working notes — leave that alone, only change content paths) |
| `RECOMMENDED-SKILLS.md` | Modify | 1 |
| `packages/cli/README.md` | Modify | 1 |
| `docs/ARCHITECTURE.md` | Modify | 2 |
| `docs/contracts.md` | Modify | 2 |
| `docs/customization.md` | Modify | 15 |
| `docs/philosophy.md` | Modify | 2 |
| `docs/cli-reference.md` | Modify | 4 |
| `docs/tutorials/01-new-project.md` | Modify | 16 |
| `docs/tutorials/02-existing-project.md` | Modify | 24 |
| `docs/tutorials/03-weekly-flow.md` | Modify | 8 |

### Changelog

| File | Action | Notes |
|------|--------|-------|
| `CHANGELOG.md` | Modify | Add `### Changed (BREAKING)` block under `[Unreleased]` with migration command |

### Out of scope (explicitly DO NOT touch)

- `thoughts/notes/`, `thoughts/plans/`, `thoughts/tests/` — these are the **devtronic working-notes convention** for the scribetronic *repo itself*, not user-facing scaffolded content. Keep them under `thoughts/`.
- Existing repo-internal references to `thoughts/notes/2026-05-03_*.md`, `thoughts/plans/...` — those are paths in *this* repo, not in user projects.
- Anything under `node_modules/` or `dist/`.

---

## Implementation Phases

### Phase 1: Move templates on disk

#### Task 1.1: git mv the template directory
```bash
cd packages/cli/templates/project
git mv thoughts/writing scribetronic
rmdir thoughts  # only if empty after move
```

#### Task 1.2: Sed-replace inside the moved templates
Targets: the 4 files inside `templates/project/scribetronic/` (README.md, calendar/README.md, ideas/README.md, publish-config.example.yaml).

```bash
find packages/cli/templates/project/scribetronic -type f \( -name "*.md" -o -name "*.yaml" \) \
  -exec sed -i '' 's|thoughts/writing|scribetronic|g' {} +
```

Manual review pass after sed: open each file, sanity-check that no awkward phrasing remains (e.g., "the `thoughts/writing/` system" → "the `scribetronic/` system" reads fine; "under `thoughts/writing/calendar/`" → "under `scribetronic/calendar/`" reads fine).

### Phase 2: Update bundled skills

#### Task 2.1: Replace path strings in all skill files
```bash
find packages/cli/templates/claude-code/.claude/skills -name "SKILL.md" \
  -exec sed -i '' 's|thoughts/writing|scribetronic|g' {} +
```

#### Task 2.2: Manual review of high-volume skills
Read top-to-bottom and adjust prose where the rename reads awkward:
- `agenda/SKILL.md` (20 refs)
- `write/SKILL.md` (16 refs)
- `write-publish/SKILL.md` (23 refs)
- `style-extract/SKILL.md` (4 refs)

Look for: section headings, ASCII tree diagrams, code fences with paths, frontmatter examples.

#### Task 2.3: Audit the remaining 17 skills
```bash
grep -rln "thoughts/writing\|thoughts/" packages/cli/templates/claude-code/.claude/skills/
```
Should return zero matches after Task 2.1.

### Phase 3: Update CLI source

#### Task 3.1: Patch `analyzers/project.ts`
**File**: `packages/cli/src/analyzers/project.ts`

```typescript
// Line 9: JSDoc
/** True if `scribetronic/` exists. */
hasWritingDir: boolean;  // Keep field name to avoid cascading renames; OR rename to hasContentDir if low-impact

// Line 20:
const writingDir = join(targetDir, 'scribetronic');
```

Decision on field name: **keep `hasWritingDir`** for now. Renaming the field requires touching every caller and the field name is internal. A follow-up can rename to `hasContentDir` cleanly.

#### Task 3.2: Audit `commands/init.ts` and the rest of `src/`
```bash
grep -rn "thoughts/writing\|thoughts/" packages/cli/src/ | grep -v __tests__
```
Should return zero matches after Task 3.1.

### Phase 4: Update tests

#### Task 4.1: Patch `init.test.ts`
**File**: `packages/cli/src/__tests__/init.test.ts`

Replace all 6 occurrences of `thoughts/writing` with `scribetronic`. Verify the assertions still describe the new layout correctly:
- `scribetronic/calendar/README.md` should exist
- `scribetronic/calendar/rules.yaml` should exist (renamed from `.example.yaml`)
- `scribetronic/calendar/rules.example.yaml` should NOT exist

#### Task 4.2: Patch `templateCopier.test.ts`
**File**: `packages/cli/src/__tests__/templateCopier.test.ts`

Replace 2 occurrences in `transformDestPath` test:
```typescript
expect(transformDestPath('scribetronic/calendar/rules.example.yaml')).toBe(
  'scribetronic/calendar/rules.yaml'
);
```

#### Task 4.3: Run the full test suite
```bash
cd packages/cli && npm test
```

### Phase 5: Update docs

#### Task 5.1: Bulk replace across docs
```bash
# Repo-level (excluding thoughts/ and node_modules)
find . \( -name "*.md" -o -name "*.yaml" \) \
  -not -path "./node_modules/*" \
  -not -path "./packages/cli/node_modules/*" \
  -not -path "./packages/cli/dist/*" \
  -not -path "./thoughts/*" \
  -not -path "./packages/cli/templates/*" \
  -exec sed -i '' 's|thoughts/writing|scribetronic|g' {} +
```

(Templates were already handled in Phase 1/2; we exclude them here to avoid double-touching.)

#### Task 5.2: Manual review of high-volume docs
Open and read end-to-end:
- `docs/customization.md` (15 refs)
- `docs/tutorials/01-new-project.md` (16 refs)
- `docs/tutorials/02-existing-project.md` (24 refs)
- `docs/tutorials/03-weekly-flow.md` (8 refs)

Adjust phrasing where the rename creates awkwardness.

#### Task 5.3: Sanity-grep
```bash
grep -rn "thoughts/writing" . \
  --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=thoughts \
  || echo "clean"
```
Should print "clean".

### Phase 6: Changelog + migration note

#### Task 6.1: Update `CHANGELOG.md`

Append under `## [Unreleased]`:

```markdown
### Changed (BREAKING)

- **Editorial root renamed from `thoughts/writing/` to `scribetronic/`.** The scaffolded directory tree is now top-level under your project root, decoupled from the devtronic `thoughts/` convention. Migration for existing v0.1.0 installs:

  ```bash
  mv thoughts/writing scribetronic
  rmdir thoughts 2>/dev/null  # only if empty
  ```

  All bundled skills (`/agenda`, `/write`, `/write-publish`, `/style-extract`) and `publish-config.yaml` examples have been updated to reference the new path. No content or schema changes — only the directory location.
```

---

## Task Dependencies

```yaml
dependencies:
  1.1: []           # git mv
  1.2: [1.1]        # sed inside moved files
  2.1: []           # sed in skills (independent of templates)
  2.2: [2.1]        # manual review after sed
  2.3: [2.1]        # audit grep
  3.1: []           # CLI src patch (independent)
  3.2: [3.1]        # CLI src audit grep
  4.1: [1.2, 3.1]   # init.test.ts needs new template + new analyzer
  4.2: [3.1]        # templateCopier.test.ts only depends on path string
  4.3: [4.1, 4.2]   # full test run
  5.1: []           # docs sed (independent of code)
  5.2: [5.1]        # manual review of docs
  5.3: [1.2, 2.1, 3.1, 5.1]  # final sanity grep needs all replacements done
  6.1: []           # changelog (can be drafted any time)
```

Phases 1, 2, 3, 5 can run in parallel (independent files). Phase 4 must follow Phases 1+3. Phase 6 (changelog) is independent.

---

## Risk Analysis

### Edge Cases

- [ ] **Stray references in non-obvious files**: comments inside `.ts` files, fixtures, snapshots. Mitigation: final `grep -rn "thoughts/writing"` excluding `thoughts/` and `node_modules/` must return zero.
- [ ] **`thoughts/` parent directory left empty in templates**: `rmdir packages/cli/templates/project/thoughts` after move; verify nothing else lives there.
- [ ] **`writingDir` analyzer field name**: rename or keep? Keeping avoids a cascading rename. Decision: **keep** for this PR; tag a follow-up.
- [ ] **Existing user installs (v0.1.0 in the wild)**: provide migration `mv` command in changelog. `analyzeProject` will report `hasWritingDir: false` for those users until they migrate, but `init` is idempotent and will create the new tree alongside without clobbering the old one — they'll have both until they delete the old.
- [ ] **Skill prose that says "writing system" or "the writing dir"**: prose can stay; only paths change. But sometimes "your writing dir" reads as a path. Manual review catches this.
- [ ] **Frontmatter examples in skills** showing `path: thoughts/writing/...`: sed catches these.
- [ ] **Documentation examples that mention `thoughts/`** for unrelated reasons (e.g. devtronic notes pattern): the sed is targeted at `thoughts/writing` specifically, so `thoughts/notes` and `thoughts/plans` are untouched. Verify with grep.

### Technical Risks

- [ ] **Breaking change for users**: explicit. Mitigation: clear changelog with one-line `mv` migration. v0.1.0 user count is ~zero, so blast radius is minimal.
- [ ] **Test snapshot drift**: vitest doesn't snapshot paths in this repo currently — verify with `npm test` after edits.
- [ ] **CI not catching missed references**: CI only runs `typecheck && lint && test`, none of which exercise template paths. The smoke test (Phase 7 verification) covers this gap.

---

## Testing Strategy

### Unit / integration

- `init.test.ts`: scaffold → assert `scribetronic/calendar/...` exists, `thoughts/writing/...` does not, `.example` rename still works
- `templateCopier.test.ts`: `transformDestPath` test on the new path
- `analyzeProject` indirectly tested via `init.test.ts`

### Smoke (manual)

```bash
cd /tmp && rm -rf st-smoke && mkdir st-smoke && cd st-smoke
node /Users/roberto/Desktop/ventures/100-projects/24.scribetronic/packages/cli/dist/index.js init
ls -la
test -d scribetronic && echo "OK: scribetronic/ exists"
test ! -d thoughts/writing && echo "OK: no thoughts/writing"
test -f scribetronic/publish-config.yaml && echo "OK: config copied"
test -f scribetronic/calendar/rules.yaml && echo "OK: rules.yaml renamed from .example"
test -f .claude/skills/agenda/SKILL.md && echo "OK: skills installed"
grep -q "scribetronic" .claude/skills/agenda/SKILL.md && echo "OK: skill references new path"
! grep -q "thoughts/writing" .claude/skills/agenda/SKILL.md && echo "OK: no stale refs in skill"
```

---

## Done Criteria

### Phase 1: Templates moved
- [ ] `packages/cli/templates/project/scribetronic/` exists with README, calendar/, ideas/, publish-config.example.yaml
- [ ] `packages/cli/templates/project/thoughts/` is gone
- [ ] `git log --follow packages/cli/templates/project/scribetronic/README.md` shows history continuity
- [ ] `grep -rn "thoughts/writing" packages/cli/templates/project/` returns nothing

### Phase 2: Skills updated
- [ ] `grep -rn "thoughts/writing" packages/cli/templates/claude-code/` returns nothing
- [ ] `agenda/SKILL.md`, `write/SKILL.md`, `write-publish/SKILL.md`, `style-extract/SKILL.md` reviewed end-to-end and read coherently

### Phase 3: CLI src updated
- [ ] `analyzers/project.ts` references `scribetronic` instead of `thoughts/writing`
- [ ] `grep -rn "thoughts/writing" packages/cli/src/` returns nothing (excluding test files, which are next phase)

### Phase 4: Tests pass
- [ ] `cd packages/cli && npm test` is green
- [ ] All 8 prior `thoughts/writing` references in tests now read `scribetronic`

### Phase 5: Docs updated
- [ ] `grep -rn "thoughts/writing" .` excluding `node_modules`, `dist`, `thoughts/` returns nothing
- [ ] `docs/tutorials/02-existing-project.md` (the longest, 24 refs) reviewed end-to-end

### Phase 6: Changelog
- [ ] `CHANGELOG.md` has a `### Changed (BREAKING)` entry under `[Unreleased]` with the `mv` migration command

### Overall
- [ ] `cd packages/cli && npm run typecheck && npm run lint && npm test && npm run build` all pass
- [ ] Smoke script (Testing Strategy → Smoke) prints all "OK" lines
- [ ] No TODO/FIXME/HACK introduced
- [ ] No layer violations introduced (this refactor doesn't touch layer boundaries)
- [ ] Final repo-wide `grep -rn "thoughts/writing" .` (excluding `node_modules`, `dist`, `thoughts/plans/`, `thoughts/notes/`) returns zero hits

---

## Verification

Package manager: **npm** (per `.claude/rules/quality.md`).

```bash
cd packages/cli && npm run typecheck && npm run lint && npm test && npm run build
```

Then run the smoke script in `Testing Strategy → Smoke`.

After this plan completes, invoke `/post-review` to capture lessons and update `thoughts/notes/`.

---

## Follow-ups (out of scope)

- **Configurable `content_root`** in `publish-config.yaml` — only revisit if a real user request appears.
- **Rename `hasWritingDir` → `hasContentDir`** in `ProjectAnalysis` for consistency with the new naming.
- **Migration helper command** (`scribetronic migrate`) that auto-runs `mv thoughts/writing scribetronic` for users on v0.1.0. Probably overkill given user count.
