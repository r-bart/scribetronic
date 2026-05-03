import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  loadSkills,
  parseFrontmatter,
  inferCategory,
  groupByCategory,
} from '../data/skills.js';

let sandbox: string;

beforeEach(() => {
  sandbox = mkdtempSync(join(tmpdir(), 'scribe-skills-'));
});

afterEach(() => {
  rmSync(sandbox, { recursive: true, force: true });
});

function writeSkill(root: string, folder: string, frontmatter: string, body = 'body') {
  const dir = join(root, folder);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'SKILL.md'), `---\n${frontmatter}\n---\n${body}\n`);
}

describe('parseFrontmatter', () => {
  it('parses simple key: value pairs', () => {
    const { frontmatter, body } = parseFrontmatter(
      '---\nname: foo\ndescription: bar\n---\nhello\n'
    );
    expect(frontmatter.name).toBe('foo');
    expect(frontmatter.description).toBe('bar');
    expect(body.trim()).toBe('hello');
  });

  it('parses inline list values', () => {
    const { frontmatter } = parseFrontmatter('---\ninherits: [a, b, c]\n---\n');
    expect(frontmatter.inherits).toEqual(['a', 'b', 'c']);
  });

  it('parses block list values', () => {
    const { frontmatter } = parseFrontmatter(
      '---\ninherits:\n  - one\n  - two\n---\n'
    );
    expect(frontmatter.inherits).toEqual(['one', 'two']);
  });

  it('returns empty frontmatter and full raw body when no fence is present', () => {
    const { frontmatter, body } = parseFrontmatter('no frontmatter here\n');
    expect(frontmatter).toEqual({});
    expect(body).toBe('no frontmatter here\n');
  });

  it('handles missing inherits gracefully (no key, no crash)', () => {
    const { frontmatter } = parseFrontmatter('---\nname: foo\n---\nx');
    expect(frontmatter.inherits).toBeUndefined();
  });

  it('strips quotes from values', () => {
    const { frontmatter } = parseFrontmatter('---\nname: "foo"\ndesc: \'bar\'\n---\n');
    expect(frontmatter.name).toBe('foo');
    expect(frontmatter.desc).toBe('bar');
  });
});

describe('inferCategory', () => {
  it('classifies orchestrators', () => {
    expect(inferCategory('agenda')).toBe('Orchestrators');
    expect(inferCategory('write')).toBe('Orchestrators');
    expect(inferCategory('write-publish')).toBe('Orchestrators');
  });

  it('classifies long-form by prefix', () => {
    expect(inferCategory('long-form-weekly-newsletter')).toBe('Long-form');
  });

  it('classifies short-form by prefix', () => {
    expect(inferCategory('short-form-listicle')).toBe('Short-form');
  });

  it('falls back to shared', () => {
    expect(inferCategory('writing-style')).toBe('Shared');
    expect(inferCategory('editing-pass')).toBe('Shared');
  });
});

describe('loadSkills', () => {
  it('returns [] when the skills root does not exist', async () => {
    const skills = await loadSkills(join(sandbox, 'nope'));
    expect(skills).toEqual([]);
  });

  it('discovers skills and parses their frontmatter', async () => {
    writeSkill(sandbox, 'agenda', 'name: agenda\ndescription: Plan the week.');
    writeSkill(
      sandbox,
      'long-form-weekly-newsletter',
      'name: long-form-weekly-newsletter\ndescription: Saturday newsletter.\ninherits: ../writing-style/SKILL.md'
    );
    writeSkill(sandbox, 'writing-style', 'name: writing-style');

    const skills = await loadSkills(sandbox);
    expect(skills).toHaveLength(3);
    const names = skills.map((s) => s.name).sort();
    expect(names).toEqual(['agenda', 'long-form-weekly-newsletter', 'writing-style']);

    const longForm = skills.find((s) => s.name === 'long-form-weekly-newsletter')!;
    expect(longForm.category).toBe('Long-form');
    expect(longForm.frontmatter.inherits).toBe('../writing-style/SKILL.md');
  });
});

describe('groupByCategory', () => {
  it('produces all four buckets in stable shape', async () => {
    writeSkill(sandbox, 'agenda', 'name: agenda');
    writeSkill(sandbox, 'long-form-x', 'name: long-form-x');
    writeSkill(sandbox, 'short-form-y', 'name: short-form-y');
    writeSkill(sandbox, 'writing-style', 'name: writing-style');

    const skills = await loadSkills(sandbox);
    const grouped = groupByCategory(skills);

    expect(grouped.Orchestrators.map((s) => s.name)).toEqual(['agenda']);
    expect(grouped['Long-form'].map((s) => s.name)).toEqual(['long-form-x']);
    expect(grouped['Short-form'].map((s) => s.name)).toEqual(['short-form-y']);
    expect(grouped.Shared.map((s) => s.name)).toEqual(['writing-style']);
  });
});
