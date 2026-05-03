import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { infoCommand } from '../commands/info.js';

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
  fakeTemplatesRoot = mkdtempSync(join(tmpdir(), 'scribe-info-tpl-'));
});

afterEach(() => {
  rmSync(fakeTemplatesRoot, { recursive: true, force: true });
  vi.restoreAllMocks();
});

function writeSkill(name: string, body: string) {
  const dir = join(fakeTemplatesRoot, 'claude-code', '.claude', 'skills', name);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'SKILL.md'), body);
}

describe('infoCommand', () => {
  it('exits 1 with an error when the skill is not found', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(((_code?: number) => {
      throw new Error('process.exit called');
    }) as never);
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(infoCommand('does-not-exist')).rejects.toThrow('process.exit called');
    expect(errSpy).toHaveBeenCalled();
    const errorOutput = errSpy.mock.calls.map((c) => String(c[0])).join(' ');
    expect(errorOutput).toContain('does-not-exist');

    exitSpy.mockRestore();
    errSpy.mockRestore();
  });

  it('prints frontmatter and body for a found skill', async () => {
    writeSkill(
      'agenda',
      '---\nname: agenda\ndescription: Plan the week.\ncadence: weekly\n---\nbody text here\n'
    );

    const logs: string[] = [];
    const spy = vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      logs.push(args.map((a) => String(a)).join(' '));
    });

    await infoCommand('agenda');
    const output = logs.join('\n');

    expect(output).toContain('agenda');
    expect(output).toContain('Plan the week.');
    expect(output).toContain('weekly');
    expect(output).toContain('body text here');

    spy.mockRestore();
  });

  it('surfaces unknown frontmatter keys (not just the curated list)', async () => {
    writeSkill(
      'custom',
      '---\nname: custom\ncustom_key: hello\nanother: world\n---\nbody\n'
    );

    const logs: string[] = [];
    const spy = vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      logs.push(args.map((a) => String(a)).join(' '));
    });

    await infoCommand('custom');
    const output = logs.join('\n');

    expect(output).toContain('custom_key');
    expect(output).toContain('hello');
    expect(output).toContain('another');
    expect(output).toContain('world');

    spy.mockRestore();
  });

  it('formats list-valued frontmatter (inherits) as comma-joined', async () => {
    writeSkill(
      'derived',
      '---\nname: derived\ninherits: [a, b, c]\n---\nbody\n'
    );

    const logs: string[] = [];
    const spy = vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      logs.push(args.map((a) => String(a)).join(' '));
    });

    await infoCommand('derived');
    const output = logs.join('\n');

    expect(output).toContain('a, b, c');

    spy.mockRestore();
  });

  it('omits undefined optional fields without crashing', async () => {
    writeSkill('minimal', '---\nname: minimal\n---\nbody\n');

    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await expect(infoCommand('minimal')).resolves.toBeUndefined();

    spy.mockRestore();
  });
});
