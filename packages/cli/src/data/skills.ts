import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { glob } from 'glob';

export type SkillCategory = 'Orchestrators' | 'Long-form' | 'Short-form' | 'Shared';

export interface SkillFrontmatter {
  name?: string;
  description?: string;
  inherits?: string | string[];
  length_target?: string;
  cadence?: string;
  /** Any extra keys preserved as raw strings. */
  [key: string]: string | string[] | undefined;
}

export interface Skill {
  /** Folder name under `.claude/skills/`. */
  name: string;
  /** Inferred category bucket for grouping in `list`. */
  category: SkillCategory;
  /** Absolute path to the SKILL.md file. */
  path: string;
  frontmatter: SkillFrontmatter;
  /** Body of the SKILL.md (everything after the second `---`). */
  body: string;
}

const ORCHESTRATORS = new Set(['agenda', 'write', 'write-publish']);

/**
 * Resolves the package's templates directory in both built and source layouts.
 * - Built (dist): `<package-root>/dist/index.js` → `<package-root>/templates/`
 * - Source: `<package-root>/src/data/skills.ts` → `<package-root>/templates/`
 */
export function getTemplatesDir(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  // Try ../templates (dist layout) and ../../templates (src layout).
  const candidates = [resolve(here, '..', 'templates'), resolve(here, '..', '..', 'templates')];
  for (const c of candidates) {
    if (existsSync(c)) return c;
  }
  // Fallback: return the dist-style path so callers can existsSync-check it.
  return candidates[0]!;
}

/**
 * Returns the absolute path to the bundled `claude-code/.claude/skills/` dir.
 */
export function getSkillsRoot(): string {
  return join(getTemplatesDir(), 'claude-code', '.claude', 'skills');
}

/**
 * Loads the skill registry by globbing `<templates>/claude-code/.claude/skills/* /SKILL.md`
 * at runtime. Returns an empty list if the directory doesn't exist (Phase 3
 * not yet populated, sandboxed install, etc.) — never throws.
 */
export async function loadSkills(skillsRoot?: string): Promise<Skill[]> {
  const root = skillsRoot ?? getSkillsRoot();
  if (!existsSync(root)) return [];

  const matches = await glob('*/SKILL.md', {
    cwd: root,
    dot: false,
    nodir: true,
  });

  const skills: Skill[] = [];
  for (const rel of matches) {
    const abs = join(root, rel);
    const folder = rel.split('/')[0]!;
    let raw: string;
    try {
      raw = readFileSync(abs, 'utf-8');
    } catch {
      continue;
    }
    const { frontmatter, body } = parseFrontmatter(raw);
    skills.push({
      name: folder,
      category: inferCategory(folder),
      path: abs,
      frontmatter,
      body,
    });
  }

  skills.sort((a, b) => a.name.localeCompare(b.name));
  return skills;
}

/**
 * Synchronous frontmatter+body parser. Supports the common "simple yaml"
 * shape (key: value, with optional list values written as `[a, b]` or as a
 * block of `- item` lines). Anything that doesn't fit is preserved as a raw
 * string so callers can do their own thing if they need to.
 */
export function parseFrontmatter(raw: string): { frontmatter: SkillFrontmatter; body: string } {
  const fmMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!fmMatch) {
    return { frontmatter: {}, body: raw };
  }
  const [, fmBlock, body] = fmMatch;
  const frontmatter: SkillFrontmatter = {};

  const lines = (fmBlock ?? '').split(/\r?\n/);
  let currentListKey: string | null = null;
  let currentList: string[] = [];

  const flushList = () => {
    if (currentListKey) {
      frontmatter[currentListKey] = currentList;
      currentListKey = null;
      currentList = [];
    }
  };

  for (const line of lines) {
    if (line.trim().length === 0) continue;

    // Continuation of a YAML list ("  - foo")
    const listItem = line.match(/^\s+-\s+(.*)$/);
    if (listItem && currentListKey) {
      currentList.push(stripQuotes(listItem[1]!.trim()));
      continue;
    }

    flushList();

    const kv = line.match(/^([A-Za-z0-9_-]+)\s*:\s*(.*)$/);
    if (!kv) continue;
    const [, key, rest] = kv;
    const value = (rest ?? '').trim();

    if (value.length === 0) {
      // Possibly a list opener (next lines may be `- item`)
      currentListKey = key!;
      currentList = [];
      continue;
    }

    // Inline list: [a, b, c]
    const inlineList = value.match(/^\[(.*)\]$/);
    if (inlineList) {
      const inner = inlineList[1] ?? '';
      const parts = inner
        .split(',')
        .map((s) => stripQuotes(s.trim()))
        .filter((s) => s.length > 0);
      frontmatter[key!] = parts;
      continue;
    }

    frontmatter[key!] = stripQuotes(value);
  }
  flushList();

  return { frontmatter, body: body ?? '' };
}

function stripQuotes(s: string): string {
  if (s.length >= 2) {
    const first = s[0];
    const last = s[s.length - 1];
    if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
      return s.slice(1, -1);
    }
  }
  return s;
}

/**
 * Infers a skill's display category from its folder name.
 */
export function inferCategory(folderName: string): SkillCategory {
  if (folderName.startsWith('long-form-')) return 'Long-form';
  if (folderName.startsWith('short-form-')) return 'Short-form';
  if (ORCHESTRATORS.has(folderName)) return 'Orchestrators';
  return 'Shared';
}

/**
 * Groups a list of skills by category, in stable display order.
 */
export function groupByCategory(skills: Skill[]): Record<SkillCategory, Skill[]> {
  const out: Record<SkillCategory, Skill[]> = {
    Orchestrators: [],
    'Long-form': [],
    'Short-form': [],
    Shared: [],
  };
  for (const s of skills) out[s.category].push(s);
  return out;
}
