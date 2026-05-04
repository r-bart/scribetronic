# Implementation Plan: npm Publish Readiness for `scribetronic`

**Date**: 2026-05-04
**Status**: Draft

---

## Overview

Prepare `scribetronic@0.1.0` for first publish to the public npm registry. Most metadata and infrastructure files (LICENSE, CHANGELOG, SECURITY, CONTRIBUTING) already exist; the gap is automated release plumbing (CI + publish workflow), publish-time guardrails (`prepublishOnly`, `publishConfig`), and an end-to-end install smoke test of the packed tarball.

## Requirements

- [ ] Package installs globally and `scribetronic init` runs cleanly from a fresh directory
- [ ] CI runs typecheck + lint + test + build on every PR (Node 18 / 20 / 22 per CLAUDE.md)
- [ ] Tag `v*.*.*` on `main` triggers automated npm publish with provenance
- [ ] `npm publish` cannot run without a green build (guarded by `prepublishOnly`)
- [ ] Tarball contents are minimal and correct (`dist/` + `templates/` only — confirmed: 48 files, 62.5 kB)
- [ ] First-publish dry run succeeds locally before tagging

---

## Current State (verified 2026-05-04)

**Already in place** (no work needed):
- `package.json`: name, version, bin, main, types, exports, files, repository, bugs, homepage, license, engines, author ✓
- Shebang `#!/usr/bin/env node` in `src/index.ts` ✓
- LICENSE, CHANGELOG.md, CONTRIBUTING.md, SECURITY.md at repo root ✓
- Template path resolver handles dist + src layouts (`packages/cli/src/data/skills.ts:34-39`) ✓
- `npm view scribetronic` → 404 (name available) ✓
- `npm pack --dry-run` → 48 files, includes `dist/` and `templates/{claude-code,project}/` ✓

**Gaps**:
1. No `.github/workflows/` (no CI, no release automation)
2. No `prepublishOnly` script — `npm publish` would publish a stale `dist/`
3. No `publishConfig` block (needed for `provenance: true` and `access: public`)
4. No tarball install smoke test (we know it packs; we don't know it *runs* when installed)
5. `CHANGELOG.md` `[Unreleased]` section not yet promoted to `[0.1.0] - 2026-05-04`

---

## Approach Analysis

### Option A: Manual publish first, automate later
Publish 0.1.0 by hand from a clean local checkout, then add CI/release workflow afterwards.

**Pros**: Fastest path to "it's on npm"; lower risk of debugging CI auth on the maiden release.
**Cons**: Two phases of work; the first publish lacks provenance attestation; if we forget to add CI immediately, future releases drift back to manual.
**Complexity**: Low

### Option B: Automate first, then publish via tag
Build the GitHub Actions release workflow before any publish, then trigger 0.1.0 via tag push.

**Pros**: Single-shot setup; provenance from day one; reproducible release process documented in code.
**Cons**: Slightly higher upfront effort; first run can fail on auth/permissions and require iteration.
**Complexity**: Medium

### Recommendation

**Option B**. The CLAUDE.md "Open Source" section already commits to "tag `v*.*.*` → GitHub Actions publishes to npm". Doing it manually first contradicts that contract and means the first release on npm is unattested. The marginal complexity is small (one workflow file) and pays off forever.

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `packages/cli/package.json` | Modify | Add `prepublishOnly`, `publishConfig`, ensure scripts cover release path |
| `.github/workflows/ci.yml` | Create | Per-PR matrix build (Node 18/20/22): typecheck, lint, test, build |
| `.github/workflows/release.yml` | Create | Tag-triggered: build + `npm publish --provenance --access public` |
| `CHANGELOG.md` | Modify | Promote `[Unreleased]` → `[0.1.0] - 2026-05-04` and add new `[Unreleased]` shell |
| `docs/releasing.md` | Create | Maintainer runbook: how to cut a release, rollback, dist-tags |
| `README.md` | Modify | Once published, swap any "local install" instructions for `npm i -g scribetronic` |

User-side prerequisites (cannot be done from this repo, must be done by maintainer):
- Generate npm automation token at https://www.npmjs.com/settings/{user}/tokens (type: "Automation")
- Add it as `NPM_TOKEN` repo secret at https://github.com/r-bart/scribetronic/settings/secrets/actions
- Enable "Allow GitHub Actions to create and approve pull requests" if release workflow opens any

---

## Implementation Phases

### Phase 1: package.json hardening

#### Task 1.1: Add `prepublishOnly` and `publishConfig`

**File**: `packages/cli/package.json`

```jsonc
"scripts": {
  // ... existing
  "prepublishOnly": "npm run typecheck && npm run lint && npm test && npm run build"
},
"publishConfig": {
  "access": "public",
  "provenance": true
}
```

Rationale: `prepublishOnly` runs on `npm publish` (and is skipped on `npm install`), so any manual publish — accidental or intentional — runs the full quality gate. `provenance: true` on `publishConfig` makes the GitHub Actions runner attest the build, giving npm a verified "Built and signed on GitHub" badge.

#### Task 1.2: Local pack-and-install smoke test

```bash
cd packages/cli && npm run build && npm pack
mkdir -p /tmp/scribetronic-smoke && cd /tmp/scribetronic-smoke
npm init -y
npm install /Users/roberto/Desktop/ventures/100-projects/24.scribetronic/packages/cli/scribetronic-0.1.0.tgz
npx scribetronic --help
mkdir test-target && cd test-target && npx scribetronic init
ls .claude/skills | head    # should show 21 skills
ls scribetronic/             # should show calendar/ ideas/ README.md publish-config.example.yaml
```

Pass criteria: `init` completes without "templates dir missing" error, `.claude/skills/` has 21 entries, `scribetronic/` tree is populated.

### Phase 2: Continuous Integration

#### Task 2.1: Create `.github/workflows/ci.yml`

```yaml
name: CI
on:
  push: { branches: [main, develop] }
  pull_request: { branches: [main, develop] }

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node: [18, 20, 22]
    defaults:
      run: { working-directory: packages/cli }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node }}
          cache: npm
          cache-dependency-path: packages/cli/package-lock.json
      - run: npm ci
      - run: npm run typecheck
      - run: npm run lint
      - run: npm test
      - run: npm run build
```

### Phase 3: Release automation

#### Task 3.1: Create `.github/workflows/release.yml`

```yaml
name: Release
on:
  push:
    tags: ['v*.*.*']

jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write   # required for npm provenance
    defaults:
      run: { working-directory: packages/cli }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          registry-url: 'https://registry.npmjs.org'
          cache: npm
          cache-dependency-path: packages/cli/package-lock.json
      - run: npm ci
      - run: npm publish --provenance --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

Note: `prepublishOnly` (added in 1.1) runs the full quality gate before `npm publish` executes — no need to duplicate steps in the workflow.

#### Task 3.2: GitHub Release notes

Add to release.yml after `npm publish`:

```yaml
      - uses: softprops/action-gh-release@v2
        with:
          generate_release_notes: true
          body_path: # optional: extract section from CHANGELOG.md
```

Decision: defer auto-extraction from CHANGELOG to a follow-up — `generate_release_notes: true` is good enough for v0.1.0.

### Phase 4: Docs + Changelog

#### Task 4.1: Promote `[Unreleased]` in CHANGELOG.md

Move current `[Unreleased]` content under `## [0.1.0] - 2026-05-04` and add a fresh `## [Unreleased]` section above it with empty `### Added` / `### Changed` / `### Fixed` headers.

#### Task 4.2: Create `docs/releasing.md`

Maintainer runbook covering:
- Pre-flight: ensure `develop` is green, `CHANGELOG.md` updated, `package.json` version bumped
- Merge `develop` → `main`
- `git tag v0.1.0 && git push origin v0.1.0`
- Watch `release.yml` run; if it fails, common causes (missing `NPM_TOKEN`, OTP requirement, version conflict)
- Post-publish: `npm view scribetronic version`; create GitHub release if not auto-created
- Rollback: `npm deprecate scribetronic@0.1.0 "reason"` (npm `unpublish` is restricted within 72h and discouraged)

#### Task 4.3: README polish

Once 0.1.0 is on npm, replace any local-install instructions with:

```bash
npm install -g scribetronic
scribetronic init
```

---

## Task Dependencies

```yaml
dependencies:
  1.1: []
  1.2: [1.1]       # smoke test runs after prepublishOnly script exists
  2.1: []          # CI is independent of package.json changes
  3.1: [1.1]       # release workflow leans on prepublishOnly
  3.2: [3.1]
  4.1: []
  4.2: [3.1]       # runbook documents the workflow
  4.3: [1.2]       # only sell `npm i -g` after smoke test passes
```

---

## Risk Analysis

### Edge Cases
- [ ] **Templates path resolution post-install**: dist layout puts `dist/index.js` at package root; templates resolver tries `../templates` first. Verified by 1.2 smoke test.
- [ ] **Node 18 ESM quirks**: package is pure ESM (`"type": "module"`); some 18.x minor versions had ESM regressions. CI matrix catches it.
- [ ] **npm 2FA on publish**: if user account requires 2FA for publishing, automation token must be type "Automation" (bypasses 2FA), not "Publish".
- [ ] **`scribetronic` name squat**: 404 today, but unprotected — publishing 0.1.0 immediately after merging removes the window.

### Technical Risks
- [ ] **Provenance failure on first run**: `id-token: write` permission must be set explicitly; default is read. Already in plan.
- [ ] **`npm ci` lockfile mismatch**: if `package-lock.json` drifts from `package.json`, CI fails. Mitigated by running `npm install && commit lockfile` before tagging.
- [ ] **Repository URL mismatch**: `package.json` says `r-bart/scribetronic`, git remote agrees. Verify `r-bart` is the correct GitHub username (currently the case per `git remote -v`).

---

## Testing Strategy

- **Unit**: existing vitest suite (no new tests required for this work)
- **Integration**:
  - Local: `npm pack` + install in `/tmp` (Task 1.2)
  - Remote: dry run release workflow on a throwaway tag like `v0.0.1-rc.0` against a scoped name first if cautious — *optional, skip if confident*
- **Manual verification**:
  - After tag push, visit https://www.npmjs.com/package/scribetronic and confirm provenance badge
  - `npm install -g scribetronic` from a clean machine (or `npm install -g scribetronic --prefix=/tmp/np`) and run `scribetronic init`

---

## Done Criteria

### Phase 1: package.json
- [ ] `npm run prepublishOnly` succeeds from `packages/cli/`
- [ ] `npm pack --dry-run` still shows ≤50 files and includes `templates/`
- [ ] Smoke test (1.2) installs the tarball into `/tmp` and `scribetronic init` populates 21 skills + `scribetronic/` tree

### Phase 2: CI
- [ ] `.github/workflows/ci.yml` exists and runs on PR
- [ ] All three Node versions (18, 20, 22) pass on develop branch HEAD

### Phase 3: Release
- [ ] `.github/workflows/release.yml` exists with `id-token: write` permission
- [ ] User has added `NPM_TOKEN` secret (verifiable: workflow run that publishes does not error on auth)
- [ ] First tag `v0.1.0` pushed to `main` results in `npm view scribetronic version` returning `0.1.0`
- [ ] Provenance badge visible on https://www.npmjs.com/package/scribetronic

### Phase 4: Docs
- [ ] `CHANGELOG.md` has `[0.1.0] - 2026-05-04` section with content moved from `[Unreleased]`
- [ ] `docs/releasing.md` exists and covers pre-flight, tag, post-publish, rollback
- [ ] README install instructions reference `npm i -g scribetronic`

### Overall
- [ ] All phases complete
- [ ] Quality checks pass: `cd packages/cli && npm run typecheck && npm run lint && npm test && npm run build`
- [ ] No TODO/FIXME/HACK introduced
- [ ] `develop` merged to `main` cleanly via PR

---

## Verification

Package manager: **npm** (confirmed: `package-lock.json` present, no other lockfiles).

After implementation:
1. `cd packages/cli && npm run typecheck && npm run lint && npm test && npm run build`
2. `npm pack --dry-run` (sanity check tarball)
3. Run smoke test from Task 1.2
4. Push branch, verify CI green, open PR develop → main
5. Merge, tag, watch release workflow
6. `/post-review` after the 0.1.0 publish lands

---

## Out of Scope (deliberately deferred)

- Beta/RC dist-tags (`@next`, `@beta`) — not needed until 0.2.0
- Auto-bump version + changelog via `release-please` or `changesets` — manual is fine for a single-package repo at this volume
- Claude Code plugin marketplace distribution — already listed in CHANGELOG `Planned`
- Renovate / Dependabot config — separate concern, not blocking publish
