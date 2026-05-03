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

  const proj = join(fakeTemplatesRoot, 'project', 'thoughts', 'writing', 'calendar');
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
    expect(existsSync(join(project, 'thoughts/writing/calendar/README.md'))).toBe(true);
    expect(existsSync(join(project, 'thoughts/writing/calendar/rules.yaml'))).toBe(true);
    expect(existsSync(join(project, 'thoughts/writing/calendar/rules.example.yaml'))).toBe(false);
  });

  it('is idempotent — re-running does not overwrite existing files', async () => {
    await initCommand({ path: project });

    const target = join(project, 'thoughts/writing/calendar/README.md');
    writeFileSync(target, 'user-edited');

    await initCommand({ path: project });

    expect(readFileSync(target, 'utf-8')).toBe('user-edited');
  });

  it('does not overwrite an existing rules.yaml when source is rules.example.yaml', async () => {
    const target = join(project, 'thoughts/writing/calendar/rules.yaml');
    mkdirSync(join(project, 'thoughts/writing/calendar'), { recursive: true });
    writeFileSync(target, 'user-config: true');

    await initCommand({ path: project });

    expect(readFileSync(target, 'utf-8')).toBe('user-config: true');
  });
});
