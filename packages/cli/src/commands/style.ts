import { existsSync, mkdirSync, copyFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import * as p from '@clack/prompts';
import chalk from 'chalk';
import { getTemplatesDir } from '../data/skills.js';

export interface StyleOptions {
  reset?: boolean;
}

/**
 * Manages `scribetronic/style/writing-style.md` in the current project.
 *
 * This is the user's voice override. The skills loaded from the plugin
 * marketplace (`/scribetronic:write`, `/scribetronic:editing-pass`, etc.)
 * read this path first; the bundled `writing-style/SKILL.md` template only
 * applies when the override is absent.
 *
 * - Missing target + no `--reset`: copy the seed and exit.
 * - Existing target + no `--reset` + TTY: open in `$EDITOR`.
 * - Existing target + no `--reset` + no TTY: print the absolute path.
 * - `--reset`: prompt for confirmation, then overwrite from the seed.
 */
export async function styleCommand(options: StyleOptions): Promise<void> {
  const cwd = resolve(process.cwd());
  const targetPath = join(cwd, 'scribetronic', 'style', 'writing-style.md');
  const seedPath = join(
    getTemplatesDir(),
    'claude-code',
    '.claude',
    'skills',
    'writing-style',
    'SKILL.md'
  );

  if (!existsSync(seedPath)) {
    console.error(
      chalk.red(`error: bundled writing-style seed not found at ${seedPath}`)
    );
    process.exit(1);
  }

  // Reset flow
  if (options.reset) {
    if (!process.stdin.isTTY) {
      console.error(
        chalk.red('error: --reset requires an interactive terminal (no TTY detected).')
      );
      process.exit(1);
    }

    p.intro(chalk.bold('scribetronic style --reset'));
    const confirmed = await p.confirm({
      message: `Overwrite ${targetPath} with the seed template?`,
      initialValue: false,
    });

    if (p.isCancel(confirmed) || !confirmed) {
      console.log(chalk.dim('cancelled'));
      p.outro('');
      return;
    }

    mkdirSync(dirname(targetPath), { recursive: true });
    copyFileSync(seedPath, targetPath);
    console.log(chalk.green(`reset: ${targetPath}`));
    p.outro(chalk.green('Done.'));
    return;
  }

  // Missing target → seed
  if (!existsSync(targetPath)) {
    mkdirSync(dirname(targetPath), { recursive: true });
    copyFileSync(seedPath, targetPath);
    console.log(chalk.green(`created: ${targetPath}`));
    return;
  }

  // Existing target → open in editor (TTY) or print path
  if (!process.stdin.isTTY) {
    console.log(targetPath);
    return;
  }

  const editor = process.env.EDITOR || process.env.VISUAL || 'vi';
  const result = spawnSync(editor, [targetPath], { stdio: 'inherit' });
  if (result.error) {
    console.error(chalk.red(`error: failed to launch editor "${editor}": ${result.error.message}`));
    process.exit(1);
  }
  if (typeof result.status === 'number' && result.status !== 0) {
    process.exit(result.status);
  }
}
