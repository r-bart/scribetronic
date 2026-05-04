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
import { GITHUB_MARKETPLACE_REPO, PLUGIN_KEY } from '../data/plugin.js';
import { captureStreams, type CapturedStreams } from './helpers/captureStreams.js';

let project: string;
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
  project = mkdtempSync(join(tmpdir(), 'scribe-init-proj-'));
  fakeTemplatesRoot = mkdtempSync(join(tmpdir(), 'scribe-init-tpl-'));

  // Bundled skill present in templates — should NOT be copied to the project.
  const cc = join(fakeTemplatesRoot, 'claude-code', '.claude', 'skills', 'agenda');
  mkdirSync(cc, { recursive: true });
  writeFileSync(join(cc, 'SKILL.md'), '---\nname: agenda\n---\nbody');

  // Project-level templates — should be copied verbatim.
  const proj = join(fakeTemplatesRoot, 'project', 'scribetronic', 'calendar');
  mkdirSync(proj, { recursive: true });
  writeFileSync(join(proj, 'rules.example.yaml'), 'sample: true');
  writeFileSync(join(proj, 'README.md'), 'guide');
});

afterEach(() => {
  streams?.restore();
  rmSync(project, { recursive: true, force: true });
  rmSync(fakeTemplatesRoot, { recursive: true, force: true });
  vi.restoreAllMocks();
});

describe('initCommand', () => {
  it('copies project templates and renames .example.yaml', async () => {
    streams = captureStreams();
    await initCommand({ path: project });

    expect(existsSync(join(project, 'scribetronic/calendar/README.md'))).toBe(true);
    expect(existsSync(join(project, 'scribetronic/calendar/rules.yaml'))).toBe(true);
    expect(existsSync(join(project, 'scribetronic/calendar/rules.example.yaml'))).toBe(false);
  });

  it('does NOT copy bundled skills into the project (they live in the marketplace)', async () => {
    streams = captureStreams();
    await initCommand({ path: project });

    expect(existsSync(join(project, '.claude/skills/agenda/SKILL.md'))).toBe(false);
    expect(existsSync(join(project, '.claude/skills'))).toBe(false);
  });

  it('writes .claude/settings.json registering the GitHub marketplace + plugin', async () => {
    streams = captureStreams();
    await initCommand({ path: project });

    const settingsPath = join(project, '.claude/settings.json');
    expect(existsSync(settingsPath)).toBe(true);

    const settings = JSON.parse(readFileSync(settingsPath, 'utf-8'));
    expect(settings.extraKnownMarketplaces.scribetronic.source).toEqual({
      source: 'github',
      repo: GITHUB_MARKETPLACE_REPO,
    });
    expect(settings.enabledPlugins[PLUGIN_KEY]).toBe(true);
  });

  it('preserves unrelated keys in pre-existing settings.json', async () => {
    mkdirSync(join(project, '.claude'), { recursive: true });
    writeFileSync(
      join(project, '.claude/settings.json'),
      JSON.stringify({
        theme: 'dark',
        enabledPlugins: { 'other@thirdparty': true },
      })
    );

    streams = captureStreams();
    await initCommand({ path: project });

    const settings = JSON.parse(readFileSync(join(project, '.claude/settings.json'), 'utf-8'));
    expect(settings.theme).toBe('dark');
    expect(settings.enabledPlugins['other@thirdparty']).toBe(true);
    expect(settings.enabledPlugins[PLUGIN_KEY]).toBe(true);
  });

  it('is idempotent — re-running does not overwrite existing files or settings', async () => {
    streams = captureStreams();
    await initCommand({ path: project });

    const target = join(project, 'scribetronic/calendar/README.md');
    writeFileSync(target, 'user-edited');

    // Also disable the plugin manually — re-run should NOT silently re-enable
    // (idempotent on the *registration*, not on the boolean choice).
    const settingsPath = join(project, '.claude/settings.json');
    const before = JSON.parse(readFileSync(settingsPath, 'utf-8'));
    before.enabledPlugins[PLUGIN_KEY] = false;
    writeFileSync(settingsPath, JSON.stringify(before));

    streams = captureStreams();
    await initCommand({ path: project });

    expect(readFileSync(target, 'utf-8')).toBe('user-edited');
    const after = JSON.parse(readFileSync(settingsPath, 'utf-8'));
    expect(after.enabledPlugins[PLUGIN_KEY]).toBe(false);
  });

  it('does not overwrite an existing rules.yaml when source is rules.example.yaml', async () => {
    const target = join(project, 'scribetronic/calendar/rules.yaml');
    mkdirSync(join(project, 'scribetronic/calendar'), { recursive: true });
    writeFileSync(target, 'user-config: true');

    streams = captureStreams();
    await initCommand({ path: project });

    expect(readFileSync(target, 'utf-8')).toBe('user-config: true');
  });

  it('exits 2 (Usage) when the target path does not exist', async () => {
    streams = captureStreams();
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new Error(`process.exit(${code ?? 0})`);
    }) as never);

    await expect(initCommand({ path: join(project, 'nope') })).rejects.toThrow(
      'process.exit(2)'
    );
    expect(streams.stderr()).toContain('Directory does not exist');

    exitSpy.mockRestore();
  });

  it('warns and returns gracefully when bundled templates are missing', async () => {
    rmSync(fakeTemplatesRoot, { recursive: true, force: true });
    fakeTemplatesRoot = mkdtempSync(join(tmpdir(), 'scribe-init-tpl-empty-'));
    streams = captureStreams();

    await expect(initCommand({ path: project })).resolves.toBeUndefined();

    expect(existsSync(join(project, '.claude'))).toBe(false);
    expect(existsSync(join(project, 'scribetronic'))).toBe(false);
  });

  it('detects an existing scribetronic install and continues idempotently', async () => {
    streams = captureStreams();
    await initCommand({ path: project });
    expect(existsSync(join(project, 'scribetronic/calendar/README.md'))).toBe(true);

    await expect(initCommand({ path: project })).resolves.toBeUndefined();
  });
});
