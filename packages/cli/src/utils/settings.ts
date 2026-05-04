import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
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
export function readClaudeSettings(targetDir: string): ClaudeSettings {
  const settingsPath = join(targetDir, SETTINGS_FILE);
  if (!existsSync(settingsPath)) return {};
  try {
    return JSON.parse(readFileSync(settingsPath, 'utf-8')) as ClaudeSettings;
  } catch {
    return {};
  }
}

/**
 * Writes `.claude/settings.json`, creating `.claude/` if needed.
 * Preserves all existing keys — callers should read-modify-write.
 */
export function writeClaudeSettings(targetDir: string, settings: ClaudeSettings): void {
  const settingsPath = join(targetDir, SETTINGS_FILE);
  mkdirSync(dirname(settingsPath), { recursive: true });
  writeFileSync(settingsPath, `${JSON.stringify(settings, null, 2)}\n`);
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
export function registerGitHubPlugin(
  targetDir: string,
  pluginName: string,
  marketplaceName: string,
  githubRepo: string
): void {
  const settings = readClaudeSettings(targetDir);

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

  writeClaudeSettings(targetDir, settings);
}

/**
 * Disables the named plugin and removes its marketplace entry.
 * Idempotent. Leaves other plugins/marketplaces intact.
 */
export function unregisterPlugin(
  targetDir: string,
  pluginName: string,
  marketplaceName: string
): void {
  const settings = readClaudeSettings(targetDir);
  const pluginKey = `${pluginName}@${marketplaceName}`;

  if (settings.enabledPlugins) {
    delete settings.enabledPlugins[pluginKey];
  }
  if (settings.extraKnownMarketplaces) {
    delete settings.extraKnownMarketplaces[marketplaceName];
  }

  writeClaudeSettings(targetDir, settings);
}

/**
 * True iff the plugin is currently enabled in this project's settings.
 */
export function isPluginRegistered(
  targetDir: string,
  pluginName: string,
  marketplaceName: string
): boolean {
  const settings = readClaudeSettings(targetDir);
  const pluginKey = `${pluginName}@${marketplaceName}`;
  return settings.enabledPlugins?.[pluginKey] === true;
}
