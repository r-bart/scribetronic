# Skills authoring rules

Hard constraints for any change to `packages/cli/templates/claude-code/.claude/skills/*/SKILL.md`.

## 1. Frontmatter spec compliance (CRITICAL)

The Claude Code skills loader silently rejects any SKILL.md whose YAML frontmatter contains keys outside the spec. Allowed keys:

| Key | Required? | Type |
|---|---|---|
| `name` | yes | string, lowercase + hyphens, ≤64 chars |
| `description` | yes | string, ≤1024 chars, third person, includes WHAT + WHEN |
| `allowed-tools` | no | comma-separated string |
| `argument-hint` | no | string |

**Forbidden** (real keys we used to ship that broke production): `inherits`, `formats`, `format`, `cadence`, `length_target`, `applies_to`, `input`, `output`, `quota`, `status`, `language`, `target_voice`, `sources`, `last_updated`, anything else.

Operational metadata that doesn't fit goes into a `## Metadata` section at the top of the body, formatted as a bullet list (`- **key**: value`).

After editing or adding any SKILL.md, run:

```bash
node scripts/normalize-skill-frontmatter.mjs
```

This script is idempotent and only touches files that have non-spec keys. It moves them to the body's `## Metadata` section.

**Why this matters**: the bug is invisible in unit tests. Skills appear in the bundle, the cache, and `scribetronic list`/`info` output, but the slash command never registers in Claude Code. The only way to catch it is `/plugin install` followed by a Claude Code restart and counting how many `/scribetronic:*` commands actually appear.

## 2. Format ↔ style decoupling (CRITICAL)

Every skill except `writing-style/SKILL.md` must be **format-only**. The skill describes *how a piece is shaped* (structure, length, anti-patterns, workflow); the voice/tone/reference layer lives entirely in `writing-style/SKILL.md`.

Forbidden in any non-`writing-style` SKILL.md:

- Specific author or creator names
- References to specific posts, accounts, newsletters, or third-party content libraries
- The maintainer's own personal identifiers (real name, product names, internal project codenames, personal URLs, own published quotes)
- "X-style" labels that name a specific person ("<author>-style closer", "<author>-tag-line", "<author>-style observation")
- Embedded voice opinions tied to a named person ("<name>'s most differentiated format", "<name>'s voice is sharpest here")

Allowed in non-`writing-style` skills:

- Generic illustrative shapes labeled as such: "Example shape (replace with your own):" followed by 1-2 anonymous patterns
- Explicit pointers: _"Voice and tone come from `writing-style/SKILL.md`."_
- Format-level rule descriptions with no name attached: "staccato 2-3 word paragraph", not "<author>-style punctuation paragraph"

`writing-style/SKILL.md` is the single point of personalization — it ships as a template with placeholders, and every user fills in their own references, examples, and anti-patterns.

## 3. Scan before commit

Before committing any skill change:

```bash
# 1. Verify frontmatter compliance
node scripts/normalize-skill-frontmatter.mjs

# 2. Sync to plugin repo before tagging
bash scripts/sync-plugin-repo.sh /path/to/scribetronic-plugin

# 3. Regression scan: detect names previously leaked into skill bodies
#    (this list grows over time as new contamination is caught and removed —
#    it is NOT a prescriptive whitelist of "the only forbidden names". Any
#    name-shaped reference is forbidden. The list catches reintroductions.)
NAMES_REGRESSION_LIST="$(cat .claude/rules/.skills-regression-names 2>/dev/null)"
if [ -n "$NAMES_REGRESSION_LIST" ]; then
  grep -nEi "$NAMES_REGRESSION_LIST" \
    packages/cli/templates/claude-code/.claude/skills/*/SKILL.md \
    && { echo "✗ regression: a previously-removed name reappeared"; exit 1; } \
    || echo "✓ no regression names found"
fi
```

The regression list lives in `.claude/rules/.skills-regression-names` (one alternation regex per file, e.g. `Foo|Bar|Baz`). It is editable by maintainers as they catch new contamination during reviews. Treat it as an append-only ledger.
