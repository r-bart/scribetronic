import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  mkdtempSync,
  rmSync,
  mkdirSync,
  writeFileSync,
  existsSync,
  readFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { initCommand } from '../commands/init.js';

// We swap process.cwd via the CLI's `path` argument, so we don't need to
// monkey-patch anything global.

let project: string;
let fakeTemplatesRoot: string;

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
  project = mkdtempSync(join(tmpdir(), 'scribe-init-proj-'));
  fakeTemplatesRoot = mkdtempSync(join(tmpdir(), 'scribe-init-tpl-'));

  // Build a minimal but realistic templates tree.
  const cc = join(fakeTemplatesRoot, 'claude-code', '.claude', 'skills', 'agenda');
  mkdirSync(cc, { recursive: true });
  writeFileSync(join(cc, 'SKILL.md'), '---\nname: agenda\n---\nbody');

  const proj = join(fakeTemplatesRoot, 'project', 'scribetronic', 'calendar');
  mkdirSync(proj, { recursive: true });
  writeFileSync(join(proj, 'rules.example.yaml'), 'sample: true');
  writeFileSync(join(proj, 'README.md'), 'guide');
});

afterEach(() => {
  rmSync(project, { recursive: true, force: true });
  rmSync(fakeTemplatesRoot, { recursive: true, force: true });
  vi.restoreAllMocks();
});

describe('initCommand', () => {
  it('copies skills and templates and renames .example.yaml', async () => {
    await initCommand({ path: project });

    expect(existsSync(join(project, '.claude/skills/agenda/SKILL.md'))).toBe(true);
    expect(existsSync(join(project, 'scribetronic/calendar/README.md'))).toBe(true);
    expect(existsSync(join(project, 'scribetronic/calendar/rules.yaml'))).toBe(true);
    expect(existsSync(join(project, 'scribetronic/calendar/rules.example.yaml'))).toBe(false);
  });

  it('is idempotent — re-running does not overwrite existing files', async () => {
    await initCommand({ path: project });

    const target = join(project, 'scribetronic/calendar/README.md');
    writeFileSync(target, 'user-edited');

    await initCommand({ path: project });

    expect(readFileSync(target, 'utf-8')).toBe('user-edited');
  });

  it('does not overwrite an existing rules.yaml when source is rules.example.yaml', async () => {
    const target = join(project, 'scribetronic/calendar/rules.yaml');
    mkdirSync(join(project, 'scribetronic/calendar'), { recursive: true });
    writeFileSync(target, 'user-config: true');

    await initCommand({ path: project });

    expect(readFileSync(target, 'utf-8')).toBe('user-config: true');
  });

  it('exits 1 when the target path does not exist', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(((_code?: number) => {
      throw new Error('process.exit called');
    }) as never);

    await expect(initCommand({ path: join(project, 'nope') })).rejects.toThrow(
      'process.exit called'
    );

    exitSpy.mockRestore();
  });

  it('warns and returns gracefully when bundled templates are missing', async () => {
    rmSync(fakeTemplatesRoot, { recursive: true, force: true });
    // Recreate an empty dir so getTemplatesDir() points at a valid but empty location
    fakeTemplatesRoot = mkdtempSync(join(tmpdir(), 'scribe-init-tpl-empty-'));

    // Should NOT throw — it returns after warning
    await expect(initCommand({ path: project })).resolves.toBeUndefined();

    // Nothing was scaffolded
    expect(existsSync(join(project, '.claude'))).toBe(false);
    expect(existsSync(join(project, 'scribetronic'))).toBe(false);
  });

  it('detects an existing scribetronic install and continues idempotently', async () => {
    // Seed a previous install
    await initCommand({ path: project });
    expect(existsSync(join(project, 'scribetronic/calendar/README.md'))).toBe(true);

    // Re-run — should not throw, all files skipped
    await expect(initCommand({ path: project })).resolves.toBeUndefined();
  });
});
