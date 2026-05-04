import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import * as p from '@clack/prompts';
import chalk from 'chalk';
import { MARKETPLACE_NAME, PLUGIN_KEY, PLUGIN_NAME } from '../data/plugin.js';
import { isPluginRegistered, unregisterPlugin } from '../utils/settings.js';
import * as out from '../utils/output.js';
import { ExitCode } from '../utils/exit.js';

export interface UninstallOptions {
  path?: string;
}

/**
 * Disables the scribetronic plugin in this project's `.claude/settings.json`.
 * Does NOT touch `scribetronic/` content — drafts, calendar, and config are
 * the user's; we never delete prose. To remove them, the user can `rm -rf`
 * manually.
 *
 * Output discipline: chrome on stderr, stdout empty. Exit codes: 0 success
 * (including no-op), 2 if target path doesn't exist.
 */
export async function uninstallCommand(options: UninstallOptions): Promise<void> {
  const targetDir = resolve(options.path ?? process.cwd());

  if (out.isInteractive()) {
    p.intro(chalk.bold('scribetronic uninstall'));
  } else {
    out.note('scribetronic uninstall');
  }

  if (!existsSync(targetDir)) {
    out.error(`Directory does not exist: ${targetDir}`, 'PATH_NOT_FOUND');
    process.exit(ExitCode.Usage);
  }

  if (!isPluginRegistered(targetDir, PLUGIN_NAME, MARKETPLACE_NAME)) {
    out.note(chalk.dim(`${PLUGIN_KEY} is not registered in this project — nothing to do.`));
    if (out.isInteractive()) p.outro(chalk.dim('No changes.'));
    return;
  }

  unregisterPlugin(targetDir, PLUGIN_NAME, MARKETPLACE_NAME);

  out.success(`${PLUGIN_KEY} disabled and marketplace entry removed.`);
  out.note(
    chalk.dim(
      'Your `scribetronic/` directory (drafts, calendar, ideas, publish-config) was left untouched. Delete it manually if you no longer need it.'
    )
  );
  if (out.isInteractive()) p.outro(chalk.green('Done.'));
}
