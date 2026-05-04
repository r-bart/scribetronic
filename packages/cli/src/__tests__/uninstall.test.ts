import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { uninstallCommand } from '../commands/uninstall.js';
import {
  isPluginRegistered,
  registerGitHubPlugin,
} from '../utils/settings.js';
import { GITHUB_MARKETPLACE_REPO, MARKETPLACE_NAME, PLUGIN_NAME } from '../data/plugin.js';

let project: string;

beforeEach(() => {
  project = mkdtempSync(join(tmpdir(), 'scribe-uninstall-'));
});

afterEach(() => {
  rmSync(project, { recursive: true, force: true });
  vi.restoreAllMocks();
});

describe('uninstallCommand', () => {
  it('disables the plugin when it was registered', async () => {
    await registerGitHubPlugin(project, PLUGIN_NAME, MARKETPLACE_NAME, GITHUB_MARKETPLACE_REPO);
    await uninstallCommand({ path: project });

    expect(await isPluginRegistered(project, PLUGIN_NAME, MARKETPLACE_NAME)).toBe(false);
  });

  it('preserves the user content (scribetronic/ is left intact)', async () => {
    await registerGitHubPlugin(project, PLUGIN_NAME, MARKETPLACE_NAME, GITHUB_MARKETPLACE_REPO);
    mkdirSync(join(project, 'scribetronic/calendar'), { recursive: true });
    writeFileSync(join(project, 'scribetronic/calendar/plan.md'), 'my draft');

    await uninstallCommand({ path: project });

    expect(existsSync(join(project, 'scribetronic/calendar/plan.md'))).toBe(true);
  });

  it('is a no-op when the plugin was never registered', async () => {
    await expect(uninstallCommand({ path: project })).resolves.toBeUndefined();
  });
});
