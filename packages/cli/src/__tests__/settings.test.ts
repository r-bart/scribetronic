import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  isPluginRegistered,
  readClaudeSettings,
  registerGitHubPlugin,
  unregisterPlugin,
  writeClaudeSettings,
} from '../utils/settings.js';

let project: string;

beforeEach(() => {
  project = mkdtempSync(join(tmpdir(), 'scribe-settings-'));
});

afterEach(() => {
  rmSync(project, { recursive: true, force: true });
});

describe('readClaudeSettings', () => {
  it('returns {} when settings.json is missing', async () => {
    expect(await readClaudeSettings(project)).toEqual({});
  });

  it('returns {} when settings.json is malformed JSON', async () => {
    mkdirSync(join(project, '.claude'), { recursive: true });
    writeFileSync(join(project, '.claude/settings.json'), '{not json');
    expect(await readClaudeSettings(project)).toEqual({});
  });

  it('parses and returns existing settings', async () => {
    mkdirSync(join(project, '.claude'), { recursive: true });
    writeFileSync(join(project, '.claude/settings.json'), JSON.stringify({ theme: 'dark' }));
    expect(await readClaudeSettings(project)).toEqual({ theme: 'dark' });
  });
});

describe('writeClaudeSettings', () => {
  it('creates .claude/ if missing', async () => {
    await writeClaudeSettings(project, { theme: 'dark' });
    expect(existsSync(join(project, '.claude/settings.json'))).toBe(true);
  });

  it('writes pretty-printed JSON with trailing newline', async () => {
    await writeClaudeSettings(project, { theme: 'dark' });
    const raw = readFileSync(join(project, '.claude/settings.json'), 'utf-8');
    expect(raw).toBe('{\n  "theme": "dark"\n}\n');
  });
});

describe('registerGitHubPlugin', () => {
  it('writes marketplace + enabledPlugins entries when none exist', async () => {
    await registerGitHubPlugin(project, 'scribetronic', 'scribetronic', 'r-bart/scribetronic-plugin');

    const s = await readClaudeSettings(project);
    expect(s.extraKnownMarketplaces?.scribetronic.source).toEqual({
      source: 'github',
      repo: 'r-bart/scribetronic-plugin',
    });
    expect(s.enabledPlugins?.['scribetronic@scribetronic']).toBe(true);
  });

  it('is idempotent — repeated calls produce the same file', async () => {
    await registerGitHubPlugin(project, 'scribetronic', 'scribetronic', 'r-bart/scribetronic-plugin');
    const first = readFileSync(join(project, '.claude/settings.json'), 'utf-8');

    await registerGitHubPlugin(project, 'scribetronic', 'scribetronic', 'r-bart/scribetronic-plugin');
    const second = readFileSync(join(project, '.claude/settings.json'), 'utf-8');

    expect(second).toBe(first);
  });

  it('does NOT clobber the user toggling enabledPlugins to false', async () => {
    await registerGitHubPlugin(project, 'scribetronic', 'scribetronic', 'r-bart/scribetronic-plugin');

    const s = await readClaudeSettings(project);
    s.enabledPlugins!['scribetronic@scribetronic'] = false;
    await writeClaudeSettings(project, s);

    await registerGitHubPlugin(project, 'scribetronic', 'scribetronic', 'r-bart/scribetronic-plugin');

    const after = await readClaudeSettings(project);
    expect(after.enabledPlugins?.['scribetronic@scribetronic']).toBe(false);
  });

  it('preserves unrelated marketplaces and plugins', async () => {
    mkdirSync(join(project, '.claude'), { recursive: true });
    writeFileSync(
      join(project, '.claude/settings.json'),
      JSON.stringify({
        theme: 'light',
        extraKnownMarketplaces: { other: { source: { source: 'directory', path: '/x' } } },
        enabledPlugins: { 'other@other': true },
      })
    );

    await registerGitHubPlugin(project, 'scribetronic', 'scribetronic', 'r-bart/scribetronic-plugin');

    const s = await readClaudeSettings(project);
    expect(s.theme).toBe('light');
    expect(s.extraKnownMarketplaces?.other).toBeDefined();
    expect(s.enabledPlugins?.['other@other']).toBe(true);
    expect(s.enabledPlugins?.['scribetronic@scribetronic']).toBe(true);
  });

  it('rewrites the marketplace source when the repo changes (e.g. fork rename)', async () => {
    await registerGitHubPlugin(project, 'scribetronic', 'scribetronic', 'r-bart/old-plugin');
    await registerGitHubPlugin(project, 'scribetronic', 'scribetronic', 'r-bart/scribetronic-plugin');

    const s = await readClaudeSettings(project);
    expect(s.extraKnownMarketplaces?.scribetronic.source.repo).toBe('r-bart/scribetronic-plugin');
  });
});

describe('unregisterPlugin', () => {
  it('removes both the plugin and its marketplace entry', async () => {
    await registerGitHubPlugin(project, 'scribetronic', 'scribetronic', 'r-bart/scribetronic-plugin');
    await unregisterPlugin(project, 'scribetronic', 'scribetronic');

    const s = await readClaudeSettings(project);
    expect(s.enabledPlugins?.['scribetronic@scribetronic']).toBeUndefined();
    expect(s.extraKnownMarketplaces?.scribetronic).toBeUndefined();
  });

  it('does not touch unrelated plugins or marketplaces', async () => {
    await registerGitHubPlugin(project, 'scribetronic', 'scribetronic', 'r-bart/scribetronic-plugin');
    const s = await readClaudeSettings(project);
    s.enabledPlugins!['other@thirdparty'] = true;
    s.extraKnownMarketplaces!.thirdparty = { source: { source: 'github', repo: 'a/b' } };
    await writeClaudeSettings(project, s);

    await unregisterPlugin(project, 'scribetronic', 'scribetronic');

    const after = await readClaudeSettings(project);
    expect(after.enabledPlugins?.['other@thirdparty']).toBe(true);
    expect(after.extraKnownMarketplaces?.thirdparty).toBeDefined();
  });

  it('is a no-op when the plugin was never registered', async () => {
    await expect(unregisterPlugin(project, 'scribetronic', 'scribetronic')).resolves.toBeUndefined();
  });
});

describe('isPluginRegistered', () => {
  it('returns false when settings is missing', async () => {
    expect(await isPluginRegistered(project, 'scribetronic', 'scribetronic')).toBe(false);
  });

  it('returns true after registerGitHubPlugin', async () => {
    await registerGitHubPlugin(project, 'scribetronic', 'scribetronic', 'r-bart/scribetronic-plugin');
    expect(await isPluginRegistered(project, 'scribetronic', 'scribetronic')).toBe(true);
  });

  it('returns false when the user explicitly disabled it', async () => {
    await registerGitHubPlugin(project, 'scribetronic', 'scribetronic', 'r-bart/scribetronic-plugin');
    const s = await readClaudeSettings(project);
    s.enabledPlugins!['scribetronic@scribetronic'] = false;
    await writeClaudeSettings(project, s);

    expect(await isPluginRegistered(project, 'scribetronic', 'scribetronic')).toBe(false);
  });
});
