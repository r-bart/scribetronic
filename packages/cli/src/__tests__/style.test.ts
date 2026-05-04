import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { styleCommand } from '../commands/style.js';
import { captureStreams, type CapturedStreams } from './helpers/captureStreams.js';

let project: string;
let fakeTemplatesRoot: string;
let originalCwd: string;
let streams: CapturedStreams;

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

  const seedDir = join(fakeTemplatesRoot, 'claude-code', '.claude', 'skills', 'writing-style');
  mkdirSync(seedDir, { recursive: true });
  writeFileSync(join(seedDir, 'SKILL.md'), '---\nname: writing-style\n---\nseed body');

  originalCwd = process.cwd();
  process.chdir(project);
});

afterEach(() => {
  streams?.restore();
  process.chdir(originalCwd);
  rmSync(project, { recursive: true, force: true });
  rmSync(fakeTemplatesRoot, { recursive: true, force: true });
  delete process.env['SCRIBETRONIC_YES'];
  vi.restoreAllMocks();
});

describe('styleCommand', () => {
  it('copies the seed when target is missing', async () => {
    streams = captureStreams();
    await styleCommand({});
    const target = join(project, 'scribetronic/style/writing-style.md');
    expect(existsSync(target)).toBe(true);
    expect(readFileSync(target, 'utf-8')).toContain('seed body');
  });

  it('prints the absolute path on stdout when target exists and stdin is not a TTY', async () => {
    const target = join(project, 'scribetronic/style/writing-style.md');
    mkdirSync(join(project, 'scribetronic/style'), { recursive: true });
    writeFileSync(target, 'user-customised');

    const origIsTTY = process.stdin.isTTY;
    Object.defineProperty(process.stdin, 'isTTY', { value: false, configurable: true });
    streams = captureStreams();

    await styleCommand({});

    // Path goes to stdout (so an agent can capture it). Stderr stays empty.
    expect(streams.stdout()).toContain(target);
    expect(readFileSync(target, 'utf-8')).toBe('user-customised');

    Object.defineProperty(process.stdin, 'isTTY', { value: origIsTTY, configurable: true });
  });

  it('exits 1 with SEED_MISSING when the bundled seed is missing', async () => {
    rmSync(fakeTemplatesRoot, { recursive: true, force: true });
    fakeTemplatesRoot = mkdtempSync(join(tmpdir(), 'scribe-style-tpl-empty-'));
    streams = captureStreams();

    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new Error(`process.exit(${code ?? 0})`);
    }) as never);

    await expect(styleCommand({})).rejects.toThrow('process.exit(1)');
    expect(streams.stderr()).toContain('seed not found');

    exitSpy.mockRestore();
  });

  it('--reset on non-TTY without --yes exits 2 (Usage) without touching the file', async () => {
    const target = join(project, 'scribetronic/style/writing-style.md');
    mkdirSync(join(project, 'scribetronic/style'), { recursive: true });
    writeFileSync(target, 'user-customised');

    const origIsTTY = process.stdin.isTTY;
    Object.defineProperty(process.stdin, 'isTTY', { value: false, configurable: true });
    streams = captureStreams();

    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new Error(`process.exit(${code ?? 0})`);
    }) as never);

    await expect(styleCommand({ reset: true })).rejects.toThrow('process.exit(2)');
    expect(readFileSync(target, 'utf-8')).toBe('user-customised');
    expect(streams.stderr()).toContain('--reset requires');

    exitSpy.mockRestore();
    Object.defineProperty(process.stdin, 'isTTY', { value: origIsTTY, configurable: true });
  });

  it('--reset --yes on non-TTY overwrites the file successfully', async () => {
    const target = join(project, 'scribetronic/style/writing-style.md');
    mkdirSync(join(project, 'scribetronic/style'), { recursive: true });
    writeFileSync(target, 'user-customised');

    const origIsTTY = process.stdin.isTTY;
    Object.defineProperty(process.stdin, 'isTTY', { value: false, configurable: true });
    streams = captureStreams();

    await styleCommand({ reset: true, yes: true });

    expect(readFileSync(target, 'utf-8')).toContain('seed body');
    expect(streams.stderr()).toContain('reset:');

    Object.defineProperty(process.stdin, 'isTTY', { value: origIsTTY, configurable: true });
  });

  it('SCRIBETRONIC_YES=1 env behaves like --yes', async () => {
    const target = join(project, 'scribetronic/style/writing-style.md');
    mkdirSync(join(project, 'scribetronic/style'), { recursive: true });
    writeFileSync(target, 'user-customised');

    const origIsTTY = process.stdin.isTTY;
    Object.defineProperty(process.stdin, 'isTTY', { value: false, configurable: true });
    process.env['SCRIBETRONIC_YES'] = '1';
    streams = captureStreams();

    await styleCommand({ reset: true });

    expect(readFileSync(target, 'utf-8')).toContain('seed body');

    Object.defineProperty(process.stdin, 'isTTY', { value: origIsTTY, configurable: true });
  });
});
