/**
 * Constants for the Claude Code plugin marketplace that ships scribetronic's
 * skills + hooks. The CLI registers this marketplace in `.claude/settings.json`
 * during `init` — the plugin content itself lives in a separate repo and is
 * cached/updated by Claude Code at runtime.
 */

export const PLUGIN_NAME = 'scribetronic';
export const MARKETPLACE_NAME = 'scribetronic';
export const GITHUB_MARKETPLACE_REPO = 'r-bart/scribetronic-plugin';

/** The composite key used in `enabledPlugins`. */
export const PLUGIN_KEY = `${PLUGIN_NAME}@${MARKETPLACE_NAME}`;
