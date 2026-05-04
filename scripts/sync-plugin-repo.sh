#!/usr/bin/env bash
# sync-plugin-repo.sh — mirror the bundled SKILL.md tree to the scribetronic-plugin repo.
#
# Usage: scripts/sync-plugin-repo.sh /path/to/scribetronic-plugin
#
# Copies packages/cli/templates/claude-code/.claude/skills/* into
# <plugin-repo>/plugins/scribetronic/skills/, then bumps plugin.json:version
# to match packages/cli/package.json:version.
#
# Does NOT commit, push, or tag — that's the operator's call. Run
# `git status` inside the plugin repo afterwards to review the diff.

set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "usage: $0 <path-to-scribetronic-plugin>" >&2
  exit 2
fi

PLUGIN_REPO="$1"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SKILLS_SRC="$ROOT/packages/cli/templates/claude-code/.claude/skills"
SKILLS_DST="$PLUGIN_REPO/plugins/scribetronic/skills"
PLUGIN_JSON="$PLUGIN_REPO/plugins/scribetronic/.claude-plugin/plugin.json"

if [[ ! -d "$PLUGIN_REPO" ]]; then
  echo "error: plugin repo not found: $PLUGIN_REPO" >&2
  exit 1
fi
if [[ ! -d "$SKILLS_SRC" ]]; then
  echo "error: bundled skills not found: $SKILLS_SRC" >&2
  exit 1
fi
if [[ ! -f "$PLUGIN_JSON" ]]; then
  echo "error: plugin.json not found: $PLUGIN_JSON" >&2
  exit 1
fi

VERSION=$(node -p "require('$ROOT/packages/cli/package.json').version")

echo "→ syncing skills from CLI bundle to plugin repo"
echo "  src: $SKILLS_SRC"
echo "  dst: $SKILLS_DST"
rm -rf "$SKILLS_DST"
mkdir -p "$SKILLS_DST"
cp -R "$SKILLS_SRC/." "$SKILLS_DST/"

SKILL_COUNT=$(find "$SKILLS_DST" -name SKILL.md | wc -l | tr -d ' ')
echo "  copied $SKILL_COUNT SKILL.md files"

echo "→ bumping plugin.json:version to $VERSION"
node -e "
  const fs = require('node:fs');
  const path = '$PLUGIN_JSON';
  const j = JSON.parse(fs.readFileSync(path, 'utf-8'));
  j.version = '$VERSION';
  fs.writeFileSync(path, JSON.stringify(j, null, 2) + '\n');
"

echo "✓ sync complete. Review with:  git -C $PLUGIN_REPO status"
