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

export interface UpdateOptions {
  path?: string;
}

/**
 * Re-applies the marketplace registration in `.claude/settings.json`. Useful
 * after a fresh `git clone`, after upgrading the CLI, or when settings drift.
 * Does not touch `scribetronic/` content — use `scribetronic init` for that.
 */
export async function updateCommand(options: UpdateOptions): Promise<void> {
  const targetDir = resolve(options.path ?? process.cwd());

  p.intro(chalk.bold('scribetronic update'));

  if (!existsSync(targetDir)) {
    p.cancel(`Directory does not exist: ${targetDir}`);
    process.exit(1);
  }

  const wasRegistered = isPluginRegistered(targetDir, PLUGIN_NAME, MARKETPLACE_NAME);
  registerGitHubPlugin(targetDir, PLUGIN_NAME, MARKETPLACE_NAME, GITHUB_MARKETPLACE_REPO);

  p.log.success(
    wasRegistered
      ? chalk.green(`marketplace refreshed: ${PLUGIN_KEY}`)
      : chalk.green(`marketplace registered: ${PLUGIN_KEY}`)
  );

  p.outro(
    chalk.dim(
      'Restart Claude Code so it pulls the latest version of the plugin from GitHub.'
    )
  );
}
