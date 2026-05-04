import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import * as p from '@clack/prompts';
import chalk from 'chalk';
import {
  GITHUB_MARKETPLACE_REPO,
  MARKETPLACE_NAME,
  PLUGIN_KEY,
  PLUGIN_NAME,
} from '../data/plugin.js';
import { isPluginRegistered, registerGitHubPlugin } from '../utils/settings.js';
import * as out from '../utils/output.js';
import { ExitCode } from '../utils/exit.js';

export interface UpdateOptions {
  path?: string;
}

/**
 * Re-applies the marketplace registration in `.claude/settings.json`. Useful
 * after a fresh `git clone`, after upgrading the CLI, or when settings drift.
 * Does not touch `scribetronic/` content — use `scribetronic init` for that.
 *
 * Output discipline: chrome on stderr, stdout empty. Exit codes: 0 success,
 * 2 if target path doesn't exist.
 */
export async function updateCommand(options: UpdateOptions): Promise<void> {
  const targetDir = resolve(options.path ?? process.cwd());

  if (out.isInteractive()) {
    p.intro(chalk.bold('scribetronic update'));
  } else {
    out.note('scribetronic update');
  }

  if (!existsSync(targetDir)) {
    out.error(`Directory does not exist: ${targetDir}`, 'PATH_NOT_FOUND');
    process.exit(ExitCode.Usage);
  }

  const wasRegistered = isPluginRegistered(targetDir, PLUGIN_NAME, MARKETPLACE_NAME);
  registerGitHubPlugin(targetDir, PLUGIN_NAME, MARKETPLACE_NAME, GITHUB_MARKETPLACE_REPO);

  out.success(
    wasRegistered
      ? `marketplace refreshed: ${PLUGIN_KEY}`
      : `marketplace registered: ${PLUGIN_KEY}`
  );

  if (out.isInteractive()) {
    p.outro(
      chalk.dim('Restart Claude Code so it pulls the latest version of the plugin from GitHub.')
    );
  } else {
    out.note('restart Claude Code so it pulls the latest version of the plugin from GitHub.');
  }
}
