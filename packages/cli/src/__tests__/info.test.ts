import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { infoCommand } from '../commands/info.js';
import { captureStreams, type CapturedStreams } from './helpers/captureStreams.js';

let fakeTemplatesRoot: string;
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
  fakeTemplatesRoot = mkdtempSync(join(tmpdir(), 'scribe-info-tpl-'));
});

afterEach(() => {
  streams?.restore();
  rmSync(fakeTemplatesRoot, { recursive: true, force: true });
  vi.restoreAllMocks();
});

function writeSkill(name: string, body: string) {
  const dir = join(fakeTemplatesRoot, 'claude-code', '.claude', 'skills', name);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'SKILL.md'), body);
}

describe('infoCommand (human mode)', () => {
  it('exits 2 with a structured error when the skill is not found', async () => {
    streams = captureStreams();
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new Error(`process.exit(${code ?? 0})`);
    }) as never);

    await expect(infoCommand('does-not-exist')).rejects.toThrow('process.exit(2)');
    expect(streams.stderr()).toContain('does-not-exist');
    expect(streams.stdout()).toBe('');

    exitSpy.mockRestore();
  });

  it('prints frontmatter and body for a found skill on stderr; stdout empty', async () => {
    writeSkill(
      'agenda',
      '---\nname: agenda\ndescription: Plan the week.\ncadence: weekly\n---\nbody text here\n'
    );
    streams = captureStreams();

    await infoCommand('agenda');
    const stderr = streams.stderr();

    expect(stderr).toContain('agenda');
    expect(stderr).toContain('Plan the week.');
    expect(stderr).toContain('weekly');
    expect(stderr).toContain('body text here');
    expect(streams.stdout()).toBe('');
  });

  it('surfaces unknown frontmatter keys (not just the curated list)', async () => {
    writeSkill('custom', '---\nname: custom\ncustom_key: hello\nanother: world\n---\nbody\n');
    streams = captureStreams();

    await infoCommand('custom');
    const stderr = streams.stderr();

    expect(stderr).toContain('custom_key');
    expect(stderr).toContain('hello');
    expect(stderr).toContain('another');
    expect(stderr).toContain('world');
  });

  it('formats list-valued frontmatter (inherits) as comma-joined', async () => {
    writeSkill('derived', '---\nname: derived\ninherits: [a, b, c]\n---\nbody\n');
    streams = captureStreams();

    await infoCommand('derived');

    expect(streams.stderr()).toContain('a, b, c');
  });

  it('omits undefined optional fields without crashing', async () => {
    writeSkill('minimal', '---\nname: minimal\n---\nbody\n');
    streams = captureStreams();

    await expect(infoCommand('minimal')).resolves.toBeUndefined();
  });
});

describe('infoCommand (--json)', () => {
  it('emits JSON with name, path, frontmatter, body on stdout', async () => {
    writeSkill(
      'agenda',
      '---\nname: agenda\ndescription: Plan the week.\ncadence: weekly\n---\nbody text here\n'
    );
    streams = captureStreams({ json: true });

    await infoCommand('agenda', { json: true });

    const parsed = JSON.parse(streams.stdout());
    expect(parsed.name).toBe('agenda');
    expect(parsed.path).toContain('agenda/SKILL.md');
    expect(parsed.frontmatter.name).toBe('agenda');
    expect(parsed.frontmatter.description).toBe('Plan the week.');
    expect(parsed.frontmatter.cadence).toBe('weekly');
    expect(parsed.body.trim()).toBe('body text here');
    expect(streams.stderr()).toBe('');
  });

  it('emits a structured error envelope on stdout when skill is not found', async () => {
    streams = captureStreams({ json: true });
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new Error(`process.exit(${code ?? 0})`);
    }) as never);

    await expect(infoCommand('nope', { json: true })).rejects.toThrow('process.exit(2)');
    const parsed = JSON.parse(streams.stdout());
    expect(parsed.ok).toBe(false);
    expect(parsed.error.code).toBe('SKILL_NOT_FOUND');
    expect(parsed.error.message).toContain('nope');
    expect(streams.stderr()).toBe('');

    exitSpy.mockRestore();
  });
});
