import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import * as p from '@clack/prompts';
import chalk from 'chalk';
import { MARKETPLACE_NAME, PLUGIN_KEY, PLUGIN_NAME } from '../data/plugin.js';
import { isPluginRegistered, unregisterPlugin } from '../utils/settings.js';

export interface UninstallOptions {
  path?: string;
}

/**
 * Disables the scribetronic plugin in this project's `.claude/settings.json`.
 * Does NOT touch `scribetronic/` content — drafts, calendar, and config are
 * the user's; we never delete prose. To remove them, the user can `rm -rf`
 * manually.
 */
export async function uninstallCommand(options: UninstallOptions): Promise<void> {
  const targetDir = resolve(options.path ?? process.cwd());

  p.intro(chalk.bold('scribetronic uninstall'));

  if (!existsSync(targetDir)) {
    p.cancel(`Directory does not exist: ${targetDir}`);
    process.exit(1);
  }

  if (!isPluginRegistered(targetDir, PLUGIN_NAME, MARKETPLACE_NAME)) {
    p.log.info(chalk.dim(`${PLUGIN_KEY} is not registered in this project — nothing to do.`));
    p.outro(chalk.dim('No changes.'));
    return;
  }

  unregisterPlugin(targetDir, PLUGIN_NAME, MARKETPLACE_NAME);

  p.log.success(chalk.green(`${PLUGIN_KEY} disabled and marketplace entry removed.`));
  p.note(
    chalk.dim(
      'Your `scribetronic/` directory (drafts, calendar, ideas, publish-config) was left untouched. Delete it manually if you no longer need it.'
    ),
    'Note'
  );
  p.outro(chalk.green('Done.'));
}
