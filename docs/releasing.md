# Releasing

Maintainer runbook for cutting a new `scribetronic` release to npm.

The actual publish is automated: pushing a tag matching `v*.*.*` to GitHub triggers `.github/workflows/release.yml`, which runs `prepublishOnly` (typecheck + lint + test + build) and publishes with provenance attestation.

---

## One-time setup (per maintainer)

1. Generate an npm **Automation token** at https://www.npmjs.com/settings/{username}/tokens
   - Type: **Automation** (bypasses 2FA, required for CI)
2. Add it as `NPM_TOKEN` repository secret:
   https://github.com/r-bart/scribetronic/settings/secrets/actions
3. Confirm the npm account has `publish` rights on the `scribetronic` package (the first publish creates and claims the name).

---

## Pre-flight checklist

Before tagging, on `develop`:

- [ ] CI is green on the latest commit
- [ ] `packages/cli/package.json` `version` field matches the version you intend to release (e.g. `0.1.0`)
- [ ] `CHANGELOG.md` has a section for this version with the date filled in (move `[Unreleased]` content down)
- [ ] `npm pack --dry-run` from `packages/cli/` shows expected files (`dist/`, `templates/`, no test fixtures)
- [ ] Local smoke test passes:

  ```bash
  cd packages/cli
  npm run build && npm pack
  cd /tmp && rm -rf scribetronic-smoke && mkdir scribetronic-smoke && cd scribetronic-smoke
  npm init -y
  npm install /path/to/scribetronic-X.Y.Z.tgz
  npx scribetronic --help
  npx scribetronic init
  ls .claude/skills | wc -l   # should be 21
  ls scribetronic              # calendar/ ideas/ README.md publish-config.example.yaml
  ```

---

## Cutting the release

```bash
# 1. Merge develop → main via PR
gh pr create --base main --head develop --title "Release v0.1.0" --fill
# (review, merge)

# 2. Pull main and tag
git checkout main && git pull
git tag v0.1.0
git push origin v0.1.0
```

The `Release` workflow will:

1. Verify the git tag matches `package.json` version (fails fast if drift)
2. Run `npm ci` → `prepublishOnly` (typecheck, lint, test, build)
3. Run `npm publish --provenance --access public`
4. Create a GitHub Release with auto-generated notes

Watch progress: https://github.com/r-bart/scribetronic/actions

---

## Post-publish verification

```bash
# Confirm the version is live on npm
npm view scribetronic version

# Confirm provenance attestation
npm view scribetronic --json | jq '.dist.attestations'

# Smoke test from a fresh machine / fresh global install
npm install -g scribetronic
scribetronic --help
```

The provenance badge should appear on https://www.npmjs.com/package/scribetronic.

---

## Rollback

npm `unpublish` is restricted to within 72 hours of publish and is generally discouraged because it breaks downstream installs. Prefer **deprecation**:

```bash
# Mark a broken version as deprecated, with a message pointing users to the next good version
npm deprecate scribetronic@0.1.0 "Use 0.1.1+, this version had X bug. See CHANGELOG."
```

If a critical bug is found:

1. Fix on `develop`
2. Bump patch version (`0.1.0` → `0.1.1`)
3. Update `CHANGELOG.md`
4. Merge to `main`, tag `v0.1.1`, push tag
5. Deprecate the broken version once `0.1.1` is live

---

## Common failure modes

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `401 Unauthorized` from `npm publish` | `NPM_TOKEN` missing or expired | Regenerate Automation token, update repo secret |
| `403 Forbidden` | npm 2FA required for publish | Token must be **Automation** type, not Publish |
| Tag/version mismatch error | `git tag vX.Y.Z` doesn't match `package.json` | Bump `package.json`, re-tag |
| Provenance step fails | Missing `id-token: write` permission | Already set in `release.yml` — check workflow file wasn't edited |
| `EPUBLISHCONFLICT` | Version already published | Bump version, retag |

---

## Versioning policy

[Semantic Versioning](https://semver.org/). Pre-1.0:

- `0.x.0` — new features, possibly breaking
- `0.x.y` — bug fixes, no API changes
- Breaking changes are allowed before 1.0 but **must** be flagged in CHANGELOG with `BREAKING:` and a migration note.

After 1.0, the usual SemVer rules apply.
