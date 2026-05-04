import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { copyTemplates, transformDestPath } from '../generators/templateCopier.js';

let sandboxSrc: string;
let sandboxDest: string;

beforeEach(() => {
  sandboxSrc = mkdtempSync(join(tmpdir(), 'scribe-tc-src-'));
  sandboxDest = mkdtempSync(join(tmpdir(), 'scribe-tc-dest-'));
});

afterEach(() => {
  rmSync(sandboxSrc, { recursive: true, force: true });
  rmSync(sandboxDest, { recursive: true, force: true });
});

describe('transformDestPath', () => {
  it('renames *.example.yaml to *.yaml', () => {
    expect(transformDestPath('rules.example.yaml')).toBe('rules.yaml');
    expect(transformDestPath('scribetronic/calendar/rules.example.yaml')).toBe(
      'scribetronic/calendar/rules.yaml'
    );
  });

  it('leaves other files unchanged', () => {
    expect(transformDestPath('README.md')).toBe('README.md');
    expect(transformDestPath('a/b/c.md')).toBe('a/b/c.md');
    expect(transformDestPath('rules.yaml')).toBe('rules.yaml');
  });
});

describe('copyTemplates', () => {
  it('returns empty result when source does not exist', async () => {
    const res = await copyTemplates(join(sandboxSrc, 'nope'), sandboxDest);
    expect(res.copied).toEqual([]);
    expect(res.skipped).toEqual([]);
  });

  it('preserves directory structure', async () => {
    mkdirSync(join(sandboxSrc, 'a', 'b'), { recursive: true });
    writeFileSync(join(sandboxSrc, 'top.md'), 'top');
    writeFileSync(join(sandboxSrc, 'a', 'b', 'deep.md'), 'deep');

    const res = await copyTemplates(sandboxSrc, sandboxDest);

    expect(existsSync(join(sandboxDest, 'top.md'))).toBe(true);
    expect(existsSync(join(sandboxDest, 'a', 'b', 'deep.md'))).toBe(true);
    expect(res.copied).toEqual(expect.arrayContaining(['top.md', 'a/b/deep.md']));
    expect(res.skipped).toEqual([]);
  });

  it('renames .example.yaml at the destination', async () => {
    mkdirSync(join(sandboxSrc, 'cfg'), { recursive: true });
    writeFileSync(join(sandboxSrc, 'cfg', 'rules.example.yaml'), 'foo: bar');

    await copyTemplates(sandboxSrc, sandboxDest);

    expect(existsSync(join(sandboxDest, 'cfg', 'rules.yaml'))).toBe(true);
    expect(existsSync(join(sandboxDest, 'cfg', 'rules.example.yaml'))).toBe(false);
  });

  it('skips files that already exist at the destination', async () => {
    writeFileSync(join(sandboxSrc, 'a.md'), 'new');
    writeFileSync(join(sandboxDest, 'a.md'), 'existing');

    const res = await copyTemplates(sandboxSrc, sandboxDest);

    expect(readFileSync(join(sandboxDest, 'a.md'), 'utf-8')).toBe('existing');
    expect(res.skipped).toContain('a.md');
    expect(res.copied).not.toContain('a.md');
  });

  it('is idempotent', async () => {
    writeFileSync(join(sandboxSrc, 'a.md'), 'one');
    writeFileSync(join(sandboxSrc, 'b.md'), 'two');

    const r1 = await copyTemplates(sandboxSrc, sandboxDest);
    const r2 = await copyTemplates(sandboxSrc, sandboxDest);

    expect(r1.copied.sort()).toEqual(['a.md', 'b.md']);
    expect(r2.copied).toEqual([]);
    expect(r2.skipped.sort()).toEqual(['a.md', 'b.md']);
  });

  it('handles dot-folders (e.g. .claude/)', async () => {
    mkdirSync(join(sandboxSrc, '.claude', 'skills', 'foo'), { recursive: true });
    writeFileSync(join(sandboxSrc, '.claude', 'skills', 'foo', 'SKILL.md'), 'body');

    const res = await copyTemplates(sandboxSrc, sandboxDest);

    expect(existsSync(join(sandboxDest, '.claude', 'skills', 'foo', 'SKILL.md'))).toBe(true);
    expect(res.copied).toContain('.claude/skills/foo/SKILL.md');
  });
});
