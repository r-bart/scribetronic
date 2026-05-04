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

- Author names (Welsh, Koe, Moretti, Röhl, etc.)
- References to specific posts, accounts, or third-party content libraries (e.g. `sociilabs/claude-content-writer`)
- "Roberto"-specifics (MakerOps, MW#N, personal newsletter URLs, your own published quotes)
- "X-style" labels naming a specific person ("Welsh-style closer", "Moretti tag-line", "Röhl-style observation")
- Embedded voice opinions ("Roberto's most differentiated format", "Roberto's voice is sharpest here")

**Allowed** in non-`writing-style` skills:

- Generic illustrative shapes labeled as such ("Example shape (replace with your own):" followed by 1-2 anonymous patterns)
- Explicit pointers: _"Voice and tone come from `writing-style/SKILL.md`."_
- Format-level rules with no name attached ("staccato 2-3 word paragraph", not "Welsh-style punctuation paragraph")

`writing-style/SKILL.md` is the single point of personalization — it ships as a template with placeholders, and every user fills in their own references, examples, and anti-patterns.

## 3. Scan before commit

Before committing any skill change:

```bash
# 1. Verify frontmatter compliance
node scripts/normalize-skill-frontmatter.mjs

# 2. Verify no author/personal references leaked
grep -nE "Dan Koe|Justin Welsh|Welsh|Marcus Moretti|Moretti|Sebastian Röhl|Röhl|Roberto|MW#|MakerOps|sociilabs" \
  packages/cli/templates/claude-code/.claude/skills/*/SKILL.md
# Must return zero matches.

# 3. Sync to plugin repo before tagging
bash scripts/sync-plugin-repo.sh /path/to/scribetronic-plugin
```
