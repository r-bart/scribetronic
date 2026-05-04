import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const SETTINGS_FILE = '.claude/settings.json';

interface MarketplaceSource {
  source: string;
  repo?: string;
  path?: string;
  package?: string;
}

export interface ClaudeSettings {
  extraKnownMarketplaces?: Record<string, { source: MarketplaceSource }>;
  enabledPlugins?: Record<string, boolean>;
  [key: string]: unknown;
}

/**
 * Reads `.claude/settings.json` from the target directory.
 * Returns an empty object if the file is missing or unparseable — never throws.
 */
export async function readClaudeSettings(targetDir: string): Promise<ClaudeSettings> {
  const settingsPath = join(targetDir, SETTINGS_FILE);
  try {
    const raw = await readFile(settingsPath, 'utf-8');
    return JSON.parse(raw) as ClaudeSettings;
  } catch {
    return {};
  }
}

/**
 * Writes `.claude/settings.json`, creating `.claude/` if needed.
 * Preserves all existing keys — callers should read-modify-write.
 */
export async function writeClaudeSettings(
  targetDir: string,
  settings: ClaudeSettings
): Promise<void> {
  const settingsPath = join(targetDir, SETTINGS_FILE);
  await mkdir(dirname(settingsPath), { recursive: true });
  await writeFile(settingsPath, `${JSON.stringify(settings, null, 2)}\n`);
}

/**
 * Registers a GitHub-hosted plugin marketplace and enables the named plugin.
 * Idempotent — safe to call repeatedly. Preserves unrelated keys in
 * `extraKnownMarketplaces` and `enabledPlugins`.
 *
 * If the same marketplace already exists with a different source (e.g. a stale
 * directory pointer from a local-dev run), the entry is rewritten to the new
 * source. Other entries (third-party plugins) are left untouched.
 */
export async function registerGitHubPlugin(
  targetDir: string,
  pluginName: string,
  marketplaceName: string,
  githubRepo: string
): Promise<void> {
  const settings = await readClaudeSettings(targetDir);

  if (!settings.extraKnownMarketplaces) {
    settings.extraKnownMarketplaces = {};
  }
  settings.extraKnownMarketplaces[marketplaceName] = {
    source: { source: 'github', repo: githubRepo },
  };

  if (!settings.enabledPlugins) {
    settings.enabledPlugins = {};
  }
  const pluginKey = `${pluginName}@${marketplaceName}`;
  if (settings.enabledPlugins[pluginKey] === undefined) {
    settings.enabledPlugins[pluginKey] = true;
  }

  await writeClaudeSettings(targetDir, settings);
}

/**
 * Disables the named plugin and removes its marketplace entry.
 * Idempotent. Leaves other plugins/marketplaces intact.
 */
export async function unregisterPlugin(
  targetDir: string,
  pluginName: string,
  marketplaceName: string
): Promise<void> {
  const settings = await readClaudeSettings(targetDir);
  const pluginKey = `${pluginName}@${marketplaceName}`;

  if (settings.enabledPlugins) {
    delete settings.enabledPlugins[pluginKey];
  }
  if (settings.extraKnownMarketplaces) {
    delete settings.extraKnownMarketplaces[marketplaceName];
  }

  await writeClaudeSettings(targetDir, settings);
}

/**
 * True iff the plugin is currently enabled in this project's settings.
 */
export async function isPluginRegistered(
  targetDir: string,
  pluginName: string,
  marketplaceName: string
): Promise<boolean> {
  const settings = await readClaudeSettings(targetDir);
  const pluginKey = `${pluginName}@${marketplaceName}`;
  return settings.enabledPlugins?.[pluginKey] === true;
}
