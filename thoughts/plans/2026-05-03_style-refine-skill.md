# Implementation Plan: `style-refine` skill

**Date**: 2026-05-03
**Status**: Draft

---

## Overview

Add a new skill `style-refine` that observes the user's editing patterns (drafts vs. published versions) and proposes concrete deltas to `writing-style/SKILL.md` with mandatory textual evidence. Closes the feedback loop between *what Claude drafted* and *what the user actually shipped*.

---

## Requirements

- [ ] A new skill `style-refine` exists under `packages/cli/templates/claude-code/.claude/skills/style-refine/SKILL.md`
- [ ] Inputs are explicit: `writing-style/SKILL.md` + a set of (draft, published) pairs from `scribetronic/calendar/<W>/newsletter.md` and `scribetronic/published/`
- [ ] The skill **never** writes to `writing-style/SKILL.md` automatically — it produces a proposed-diff document the user reviews and applies (or rejects)
- [ ] Hard rule inherited from `style-extract`: **no proposed delta without textual evidence** (a real diff from the user's editing history)
- [ ] Documented in `docs/skills.md` and listed by `scribetronic list`
- [ ] Skill is discoverable: orchestrators (`agenda`, `write`, `write-publish`) mention it as a periodic maintenance step
- [ ] No CLI command — invoked via `/style-refine` in Claude Code, like `style-extract`

### Explicit non-goals

- No automatic rewriting of `writing-style/SKILL.md`
- No telemetry, no background process, no "memory store" — everything is files in the repo
- No new CLI subcommand (decided in Approach Analysis)
- No dependency on git history (we read final files; not commit diffs)

---

## Approach Analysis

### Option A: Skill-only (markdown), reads the user's repo state

**Description**: A skill that, when invoked, reads the current `writing-style/SKILL.md`, gathers (draft, published) pairs from the user's `scribetronic/` directory, and produces a proposed-deltas document at `scribetronic/style/refinements/<date>.md`. The user reviews and manually merges into `writing-style/SKILL.md`.

**Pros**:
- Zero new CLI surface — fits the existing pattern (`style-extract` is also skill-only)
- All inputs/outputs are markdown files in the user's repo, versionable via git
- Easy to extend or tweak — it's a prompt, not code
- The "approval gate" is implicit: the user opens the proposal file and chooses what to merge
- No pollution of CLI binary size

**Cons**:
- Discoverability depends on docs + orchestrator cross-references
- No structured diff (Claude does the diffing in-context); risks hallucinated "I changed this" if no draft history exists

**Complexity**: Low

### Option B: Skill + CLI wrapper (`scribetronic refine`)

**Description**: Same skill, plus a thin CLI command that:
1. Verifies `scribetronic/` is initialized
2. Lists candidate (draft, published) pairs and prints a summary
3. Prints the magic prompt the user pastes into Claude Code

**Pros**:
- Slightly more discoverable (`scribetronic --help` shows it)
- Pre-flight validation catches "no published pieces yet"

**Cons**:
- Adds a CLI command for a flow that runs end-to-end inside Claude Code anyway
- Forces a second source of truth (CLI checks vs. skill checks); divergence risk
- More tests, more docs, more surface to break

**Complexity**: Medium

### Recommendation

**Option A** — skill-only. The CLI's job is *scaffolding*, not *operating* on already-scaffolded content. Once `scribetronic init` has run, the editorial loop lives entirely in Claude Code skills. Adding a CLI wrapper duplicates the "is this a scribetronic project?" check that the skill already does, for marginal discoverability gain. If usage data later shows people don't find the skill, we can add the wrapper without reshaping anything.

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `packages/cli/templates/claude-code/.claude/skills/style-refine/SKILL.md` | Create | The skill itself |
| `packages/cli/templates/claude-code/.claude/skills/writing-style/SKILL.md` | Modify | Add a "Refining this guide" footer pointing at `style-refine` |
| `packages/cli/templates/claude-code/.claude/skills/agenda/SKILL.md` | Modify | One-line mention: "If you've shipped 3+ pieces since the last refine, suggest running `style-refine`." |
| `packages/cli/templates/claude-code/.claude/skills/write-publish/SKILL.md` | Modify | One-line mention at the end of the publish loop |
| `packages/cli/src/data/skills.ts` | Modify only if a hardcoded skill list exists | Register `style-refine` (verify first; categorization is currently inferred from name prefix) |
| `docs/skills.md` | Modify | Add `style-refine` row to the skill table |
| `packages/cli/src/__tests__/list.test.ts` | Modify | Update count expectations if any test asserts a specific number of skills |
| `packages/cli/src/__tests__/init.test.ts` | Verify | Ensure templates copy still works (no test changes expected) |
| `CHANGELOG.md` | Modify | Add `feat: style-refine skill` under [Unreleased] |

---

## Implementation Phases

### Phase 1: Skill content

#### Task 1.1: Write `style-refine/SKILL.md`

**File**: `packages/cli/templates/claude-code/.claude/skills/style-refine/SKILL.md`

Frontmatter:
```yaml
---
name: style-refine
description: Propone deltas concretos a writing-style/SKILL.md a partir del historial de edición del usuario (draft vs publicado). No reescribe automáticamente — genera un documento de propuestas con evidencia textual obligatoria. Invocar tras 3+ piezas publicadas o cuando el usuario sienta drift de voz.
inherits: ../writing-style/SKILL.md
---
```

Body must contain these sections (verbatim section names so it mirrors `style-extract`):

- **Regla principal**: "Una propuesta de delta sin un par (draft → publicado) que la respalde no entra en el documento de refinamiento. La evidencia es el diff real del usuario, no nuestra interpretación."
- **Inputs requeridos**: `writing-style/SKILL.md`, ≥3 pares (draft, published), opcional contraejemplos. If <3 pairs, abort with a friendly message.
- **Workflow** (5 fases):
  1. Inventario — listar pares (draft, published) disponibles
  2. Diffing — para cada par, identificar ediciones recurrentes (no one-offs)
  3. Clasificación — agrupar por dimensión: tono, estructura, frase, vocabulario, anti-patterns
  4. Síntesis — solo deltas que aparecen en ≥2 pares (umbral anti-ruido)
  5. Salida — escribir a `scribetronic/style/refinements/YYYY-MM-DD.md`
- **Plantilla de salida** (refinement document):
  ```markdown
  ---
  date: YYYY-MM-DD
  base_version: <hash o fecha de writing-style.md>
  pairs_analyzed: N
  status: proposed
  ---
  # Style refinements — YYYY-MM-DD

  ## Summary
  N propuestas: K aditivas, K modificaciones, K eliminaciones.

  ## Proposed deltas

  ### Delta 1 — [section of writing-style.md affected]
  **Type**: add | modify | remove
  **Evidence**: 2+ pair excerpts (draft vs. published, side-by-side)
  **Proposed change**: exact markdown to apply to writing-style.md
  **Rationale**: 1-2 sentences

  ### Delta 2 — ...
  ```
- **Qué NO hacer**: no escribir a writing-style.md; no proponer deltas con un solo par; no inventar ediciones; no proponer cambios de tono basados en una sola pieza emocional
- **Cómo aplicar**: el usuario lee el doc, copia los deltas que acepta, los pega manualmente a `writing-style/SKILL.md`, archiva el doc moviéndolo a `scribetronic/style/refinements/applied/`

#### Task 1.2: Update `writing-style/SKILL.md` footer

**File**: `packages/cli/templates/claude-code/.claude/skills/writing-style/SKILL.md`

Append a new section at the end:

```markdown
## Refining this guide

This file should evolve as your published voice diverges from this guide. Don't rewrite it from memory — run the `style-refine` skill, which proposes concrete deltas based on your real (draft → published) edit history. Apply only the deltas you agree with.
```

#### Task 1.3: Cross-reference from `agenda` and `write-publish`

**Files**:
- `packages/cli/templates/claude-code/.claude/skills/agenda/SKILL.md`
- `packages/cli/templates/claude-code/.claude/skills/write-publish/SKILL.md`

Add a one-line mention to each, in their existing "siguiente paso" / "loop" sections:

```markdown
- If `scribetronic/published/` has ≥3 pieces since the last entry in `scribetronic/style/refinements/applied/`, suggest the user run `/style-refine`.
```

### Phase 2: Registration & docs

#### Task 2.1: Verify skill registration

**File**: `packages/cli/src/data/skills.ts`

Check whether the registry hardcodes skill names or auto-discovers from the templates dir. If auto-discovery: nothing to do. If hardcoded list: add `style-refine` and assign category `Shared` (or whatever non-orchestrator/non-format category exists).

#### Task 2.2: Update `docs/skills.md`

**File**: `docs/skills.md`

Add a row in the skills table:

| Skill | Category | Inherits | Purpose |
|---|---|---|---|
| `style-refine` | Shared | `writing-style` | Proposes deltas to `writing-style/SKILL.md` from real (draft → published) edit history |

#### Task 2.3: CHANGELOG entry

**File**: `CHANGELOG.md`

Under `## [Unreleased] / ### Added`:

```
- `style-refine` skill — proposes evidence-backed deltas to `writing-style/SKILL.md` from the user's draft→published edit history. Manual review required; no auto-rewrites.
```

### Phase 3: Tests

#### Task 3.1: Update test count expectations if needed

**File**: `packages/cli/src/__tests__/list.test.ts`

Search for any assertion on skill count (currently `expect(output).toContain('5')` in the grouping test — that's a count of *the test fixture's* skills, not the real registry, so likely safe). If `loadSkills` is exercised against the real templates dir anywhere and a count is asserted, bump it.

#### Task 3.2: Smoke test — `init` copies the new skill

**File**: `packages/cli/src/__tests__/init.test.ts`

The existing tests use a fake templates root. Add ONE assertion in the existing "copies skills and templates" test to verify that, given a real templates dir layout, the new skill directory is copyable. (Or add a tiny new test that mounts the real `getTemplatesDir()` and asserts `style-refine/SKILL.md` exists in the source.)

### Phase 4: Manual verification

#### Task 4.1: End-to-end smoke test

In a temp dir:

```bash
mkdir /tmp/scribe-refine-test && cd /tmp/scribe-refine-test
node /path/to/scribetronic/packages/cli/dist/index.js init
ls .claude/skills/style-refine/SKILL.md  # exists
node /path/to/scribetronic/packages/cli/dist/index.js list | grep style-refine  # listed
node /path/to/scribetronic/packages/cli/dist/index.js info style-refine  # prints frontmatter
```

---

## Task Dependencies

```yaml
dependencies:
  1.1: []
  1.2: []
  1.3: []
  2.1: [1.1]
  2.2: [1.1]
  2.3: [1.1]
  3.1: [2.1]
  3.2: [1.1]
  4.1: [2.1, 3.1, 3.2]
```

---

## Risk Analysis

### Edge cases
- [ ] User has zero published pieces → skill must abort with a friendly message, not produce an empty doc
- [ ] User has 1–2 published pieces → skill must abort (≥3 pairs required); explain why
- [ ] `scribetronic/calendar/` is missing or empty → treat as "no drafts available" and abort
- [ ] Drafts and published copies are byte-identical (no edits) → skill produces zero deltas, says so explicitly
- [ ] `scribetronic/style/refinements/` does not exist → skill creates it on first run

### Technical risks
- [ ] **Hallucinated deltas without diff evidence** — mitigated by the hard rule "no delta without 2+ pair excerpts shown side-by-side"
- [ ] **Drift in skill count assertions** — mitigated by Task 3.1 audit
- [ ] **Path conventions** — `scribetronic/style/` is new; verify it doesn't collide with existing template structure (it doesn't; current templates use `scribetronic/{calendar,ideas,published}/`)
- [ ] **Inheritance chain** — `style-refine` inherits `writing-style`. Verify `inherits:` syntax matches existing skills (`short-form-voice-adjustments` uses `inherits: ../writing-style/SKILL.md` — same form)

### Out of scope (deferred)
- Automatic application of approved deltas (would need a CLI command + diff/patch logic)
- A `scribetronic refine` CLI wrapper
- Telemetry on which deltas get accepted vs. rejected

---

## Testing Strategy

This feature is **content** (markdown skill), not code. The TypeScript surface barely changes.

- **Unit tests**: only the existing CLI tests, ensuring the new skill is copied/listed/inspectable. No new behavior to unit-test.
- **Integration**: manual smoke test in a temp dir (Task 4.1)
- **Skill validation**: human review of the SKILL.md prompt — does it reliably refuse to invent deltas? Test by feeding it a fake repo with 3 identical draft/published pairs and confirming it outputs "zero deltas"

---

## Done Criteria

### Phase 1: Skill content
- [ ] `packages/cli/templates/claude-code/.claude/skills/style-refine/SKILL.md` exists with all 5 workflow phases and the output template
- [ ] `writing-style/SKILL.md` has the "Refining this guide" footer
- [ ] `agenda/SKILL.md` and `write-publish/SKILL.md` each have one cross-reference line

### Phase 2: Registration & docs
- [ ] `scribetronic list` output includes `style-refine` (verified manually after build)
- [ ] `scribetronic info style-refine` prints frontmatter without error
- [ ] `docs/skills.md` lists `style-refine`
- [ ] `CHANGELOG.md` has an entry under [Unreleased] / Added

### Phase 3: Tests
- [ ] `npm test` passes from `packages/cli/` (no regressions)
- [ ] At least one assertion verifies `style-refine/SKILL.md` is reachable through the templates path

### Overall
- [ ] `cd packages/cli && npm run typecheck && npm run lint && npm test && npm run build` all pass
- [ ] Manual smoke test (Task 4.1) succeeds end-to-end
- [ ] No new dependencies added to `package.json`
- [ ] No CLI command added (architecture decision honored)

---

## Verification

Package manager: **npm** (lockfile: `package-lock.json`).

```bash
cd packages/cli
npm run typecheck && npm run lint && npm test && npm run build
```

Then smoke test per Task 4.1.

After implementation, run `/post-review` (auto-invoked).
