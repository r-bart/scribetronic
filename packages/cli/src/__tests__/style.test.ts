import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { styleCommand } from '../commands/style.js';

let project: string;
let fakeTemplatesRoot: string;
let originalCwd: string;

vi.mock('../data/skills.js', async () => {
  const actual = await vi.importActual<typeof import('../data/skills.js')>(
    '../data/skills.js'
  );
  return {
    ...actual,
    getTemplatesDir: () => fakeTemplatesRoot,
    getSkillsRoot: () => join(fakeTemplatesRoot, 'claude-code', '.claude', 'skills'),
  };
});

beforeEach(() => {
  project = mkdtempSync(join(tmpdir(), 'scribe-style-proj-'));
  fakeTemplatesRoot = mkdtempSync(join(tmpdir(), 'scribe-style-tpl-'));

  const seedDir = join(
    fakeTemplatesRoot,
    'claude-code',
    '.claude',
    'skills',
    'writing-style'
  );
  mkdirSync(seedDir, { recursive: true });
  writeFileSync(
    join(seedDir, 'SKILL.md'),
    '---\nname: writing-style\n---\nseed body'
  );

  originalCwd = process.cwd();
  process.chdir(project);
});

afterEach(() => {
  process.chdir(originalCwd);
  rmSync(project, { recursive: true, force: true });
  rmSync(fakeTemplatesRoot, { recursive: true, force: true });
  vi.restoreAllMocks();
});

describe('styleCommand', () => {
  it('copies the seed when target is missing', async () => {
    await styleCommand({});
    const target = join(project, '.claude/skills/writing-style/SKILL.md');
    expect(existsSync(target)).toBe(true);
    expect(readFileSync(target, 'utf-8')).toContain('seed body');
  });

  it('prints the absolute path when target exists and stdin is not a TTY', async () => {
    const target = join(project, '.claude/skills/writing-style/SKILL.md');
    mkdirSync(join(project, '.claude/skills/writing-style'), { recursive: true });
    writeFileSync(target, 'user-customised');

    // Force non-TTY
    const origIsTTY = process.stdin.isTTY;
    Object.defineProperty(process.stdin, 'isTTY', { value: false, configurable: true });

    const logs: string[] = [];
    const spy = vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      logs.push(args.map((a) => String(a)).join(' '));
    });

    await styleCommand({});

    expect(logs.some((l) => l.includes(target))).toBe(true);
    expect(readFileSync(target, 'utf-8')).toBe('user-customised');

    spy.mockRestore();
    Object.defineProperty(process.stdin, 'isTTY', { value: origIsTTY, configurable: true });
  });

  it('exits 1 when the bundled seed is missing', async () => {
    // Wipe the seed
    rmSync(fakeTemplatesRoot, { recursive: true, force: true });
    fakeTemplatesRoot = mkdtempSync(join(tmpdir(), 'scribe-style-tpl-empty-'));

    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(((_code?: number) => {
      throw new Error('process.exit called');
    }) as never);
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(styleCommand({})).rejects.toThrow('process.exit called');

    exitSpy.mockRestore();
    errSpy.mockRestore();
  });

  it('--reset on non-TTY exits with an error before touching the file', async () => {
    const target = join(project, '.claude/skills/writing-style/SKILL.md');
    mkdirSync(join(project, '.claude/skills/writing-style'), { recursive: true });
    writeFileSync(target, 'user-customised');

    const origIsTTY = process.stdin.isTTY;
    Object.defineProperty(process.stdin, 'isTTY', { value: false, configurable: true });

    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(((_code?: number) => {
      throw new Error('process.exit called');
    }) as never);
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(styleCommand({ reset: true })).rejects.toThrow('process.exit called');

    expect(readFileSync(target, 'utf-8')).toBe('user-customised');

    exitSpy.mockRestore();
    errSpy.mockRestore();
    Object.defineProperty(process.stdin, 'isTTY', { value: origIsTTY, configurable: true });
  });
});
