import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { updateCommand } from '../commands/update.js';
import {
  isPluginRegistered,
  readClaudeSettings,
  writeClaudeSettings,
} from '../utils/settings.js';
import { GITHUB_MARKETPLACE_REPO, MARKETPLACE_NAME, PLUGIN_NAME } from '../data/plugin.js';

let project: string;

beforeEach(() => {
  project = mkdtempSync(join(tmpdir(), 'scribe-update-'));
});

afterEach(() => {
  rmSync(project, { recursive: true, force: true });
  vi.restoreAllMocks();
});

describe('updateCommand', () => {
  it('registers the plugin when settings is empty', async () => {
    await updateCommand({ path: project });

    expect(isPluginRegistered(project, PLUGIN_NAME, MARKETPLACE_NAME)).toBe(true);
    const s = readClaudeSettings(project);
    expect(s.extraKnownMarketplaces?.[MARKETPLACE_NAME]?.source.repo).toBe(
      GITHUB_MARKETPLACE_REPO
    );
  });

  it('rewrites a stale marketplace source (e.g. local-dev directory)', async () => {
    // Simulate an old install pointing at a local directory
    const stale = readClaudeSettings(project);
    stale.extraKnownMarketplaces = {
      [MARKETPLACE_NAME]: { source: { source: 'directory', path: '/old/path' } },
    };
    stale.enabledPlugins = { [`${PLUGIN_NAME}@${MARKETPLACE_NAME}`]: true };
    writeClaudeSettings(project, stale);

    await updateCommand({ path: project });

    const s = readClaudeSettings(project);
    expect(s.extraKnownMarketplaces?.[MARKETPLACE_NAME]?.source).toEqual({
      source: 'github',
      repo: GITHUB_MARKETPLACE_REPO,
    });
  });

  it('exits 1 when the target path does not exist', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new Error(`process.exit(${code ?? 0})`);
    }) as never);

    await expect(updateCommand({ path: join(project, 'nope') })).rejects.toThrow(
      'process.exit(2)'
    );
    exitSpy.mockRestore();
  });

  it('is idempotent', async () => {
    await updateCommand({ path: project });
    const first = readFileSync(join(project, '.claude/settings.json'), 'utf-8');
    await updateCommand({ path: project });
    const second = readFileSync(join(project, '.claude/settings.json'), 'utf-8');
    expect(second).toBe(first);
  });
});
