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
# 1. Verify frontmatter compliance (idempotent — touches only files with non-spec keys)
node scripts/normalize-skill-frontmatter.mjs

# 2. Sync to plugin repo before tagging a release
bash scripts/sync-plugin-repo.sh /path/to/scribetronic-plugin
```

Detection of style-decoupling regressions (rule 2) is intentionally **manual review**, not an automated grep. We don't keep a list of forbidden names checked into the repo — that would defeat the purpose of removing them. Reviewers should read every modified SKILL.md and reject any of:

- Proper-noun references (people, products, accounts, newsletters, third-party libraries)
- "X-style" labels naming a specific person
- Quotes attributed to a named individual
- Voice opinions tied to a name ("<name>'s most differentiated format")

If you need a one-off heuristic during review, a coarse `grep -nE "[A-Z][a-z]+ [A-Z][a-z]+|@[a-zA-Z0-9_]+|\b[A-Z][a-z]+(-style|'s)\b"` flags two-capitalized-word phrases, @-handles, and "Name-style"/"Name's" possessives — expect false positives, use as a starting point only.
