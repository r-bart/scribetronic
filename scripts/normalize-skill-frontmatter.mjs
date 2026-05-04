#!/usr/bin/env node
/**
 * normalize-skill-frontmatter.mjs
 *
 * Anthropic's Claude Code skills loader is strict about SKILL.md frontmatter:
 * unknown keys cause the skill to be silently rejected. This script rewrites
 * each SKILL.md so that the frontmatter contains only the spec-allowed keys
 * (name, description, allowed-tools, argument-hint), and moves any extra keys
 * (inherits, length_target, cadence, formats, applies_to, input, format,
 * quota, status, language, target_voice, sources, last_updated, etc.) into
 * a "## Metadata" section at the top of the body.
 *
 * Usage:  node scripts/normalize-skill-frontmatter.mjs
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SKILLS_ROOT = resolve(
  __dirname,
  '..',
  'packages/cli/templates/claude-code/.claude/skills'
);

const ALLOWED_KEYS = new Set(['name', 'description', 'allowed-tools', 'argument-hint']);

const FM_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

function parseFrontmatter(raw) {
  const m = raw.match(FM_RE);
  if (!m) return { fm: {}, body: raw, raw };
  const block = m[1];
  const body = m[2] ?? '';
  const fm = {};
  const lines = block.split(/\r?\n/);
  let currentListKey = null;
  let currentList = [];
  let currentBlockKey = null;
  let currentBlockLines = [];
  const flushList = () => {
    if (currentListKey) {
      fm[currentListKey] = currentList.slice();
      currentListKey = null;
      currentList = [];
    }
  };
  const flushBlock = () => {
    if (currentBlockKey) {
      fm[currentBlockKey] = currentBlockLines.join('\n');
      currentBlockKey = null;
      currentBlockLines = [];
    }
  };
  for (const line of lines) {
    if (line.length === 0) continue;
    const listItem = line.match(/^\s+-\s+(.*)$/);
    if (listItem && currentListKey) {
      currentList.push(stripQuotes(listItem[1].trim()));
      continue;
    }
    const indented = line.match(/^\s+(.*)$/);
    if (indented && currentBlockKey) {
      currentBlockLines.push(indented[1]);
      continue;
    }
    flushList();
    flushBlock();
    const kv = line.match(/^([A-Za-z0-9_-]+)\s*:\s*(.*)$/);
    if (!kv) continue;
    const [, key, rest] = kv;
    const value = (rest ?? '').trim();
    if (value.length === 0) {
      currentListKey = key;
      currentList = [];
      continue;
    }
    const inlineList = value.match(/^\[(.*)\]$/);
    if (inlineList) {
      const inner = inlineList[1] ?? '';
      const parts = inner
        .split(',')
        .map((s) => stripQuotes(s.trim()))
        .filter((s) => s.length > 0);
      fm[key] = parts;
      continue;
    }
    fm[key] = stripQuotes(value);
  }
  flushList();
  flushBlock();
  return { fm, body };
}

function stripQuotes(s) {
  if (s.length >= 2) {
    const a = s[0];
    const z = s[s.length - 1];
    if ((a === '"' && z === '"') || (a === "'" && z === "'")) return s.slice(1, -1);
  }
  return s;
}

function formatYamlValue(v) {
  if (Array.isArray(v)) return `[${v.join(', ')}]`;
  if (typeof v === 'string' && v.includes('\n')) {
    return `\n${v
      .split('\n')
      .map((l) => `  ${l}`)
      .join('\n')}`;
  }
  return v;
}

function rewrite(path) {
  const raw = readFileSync(path, 'utf-8');
  const { fm, body } = parseFrontmatter(raw);

  const allowedFm = {};
  const extraFm = {};
  for (const [k, v] of Object.entries(fm)) {
    if (ALLOWED_KEYS.has(k)) {
      allowedFm[k] = v;
    } else {
      extraFm[k] = v;
    }
  }

  // If nothing to migrate, leave the file untouched.
  if (Object.keys(extraFm).length === 0) {
    return { path, changed: false };
  }

  const fmLines = ['---'];
  for (const k of ['name', 'description', 'allowed-tools', 'argument-hint']) {
    if (allowedFm[k] !== undefined) {
      fmLines.push(`${k}: ${formatYamlValue(allowedFm[k])}`);
    }
  }
  fmLines.push('---');

  // Build the metadata block.
  const metaLines = ['', '## Metadata', ''];
  for (const [k, v] of Object.entries(extraFm)) {
    if (Array.isArray(v)) {
      metaLines.push(`- **${k}**: ${v.join(', ')}`);
    } else if (typeof v === 'string' && v.includes('\n')) {
      metaLines.push(`- **${k}**:`);
      for (const line of v.split('\n')) {
        metaLines.push(`  - ${line}`);
      }
    } else {
      metaLines.push(`- **${k}**: ${v}`);
    }
  }
  metaLines.push('');

  // Detect whether the body already has a top-level heading. If so, insert
  // the metadata block AFTER it; otherwise prepend.
  const bodyTrimmed = body.replace(/^\n+/, '');
  const headingMatch = bodyTrimmed.match(/^(#\s+[^\n]+\n)([\s\S]*)$/);
  let newBody;
  if (headingMatch) {
    newBody = `${headingMatch[1]}${metaLines.join('\n')}${headingMatch[2]}`;
  } else {
    newBody = `${metaLines.join('\n')}\n${bodyTrimmed}`;
  }

  const out = `${fmLines.join('\n')}\n\n${newBody}`;
  writeFileSync(path, out);
  return { path, changed: true, removed: Object.keys(extraFm) };
}

function main() {
  const dirs = readdirSync(SKILLS_ROOT)
    .map((n) => join(SKILLS_ROOT, n))
    .filter((p) => statSync(p).isDirectory());
  let changed = 0;
  for (const d of dirs) {
    const skillFile = join(d, 'SKILL.md');
    try {
      statSync(skillFile);
    } catch {
      continue;
    }
    const r = rewrite(skillFile);
    if (r.changed) {
      console.log(`✓ ${r.path.replace(SKILLS_ROOT + '/', '')}  (removed: ${r.removed.join(', ')})`);
      changed++;
    }
  }
  console.log(`\nNormalized ${changed} SKILL.md files.`);
}

main();
