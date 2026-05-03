import { existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import * as p from '@clack/prompts';
import chalk from 'chalk';
import { copyTemplates } from '../generators/templateCopier.js';
import { analyzeProject } from '../analyzers/project.js';
import { getTemplatesDir } from '../data/skills.js';

export interface InitOptions {
  path?: string;
}

/**
 * Scaffolds the writing system into the target directory. Idempotent: any
 * destination file that already exists is skipped (printed in yellow). Files
 * matching `*.example.yaml` are renamed (the `.example` infix is dropped) at
 * the destination.
 */
export async function initCommand(options: InitOptions): Promise<void> {
  const targetDir = resolve(options.path ?? process.cwd());

  p.intro(chalk.bold('scribetronic init'));

  if (!existsSync(targetDir)) {
    p.cancel(`Directory does not exist: ${targetDir}`);
    process.exit(1);
  }

  const analysis = analyzeProject(targetDir);
  if (analysis.hasScribetronic) {
    p.log.info(
      chalk.dim('Detected an existing scribetronic install — re-running is safe (existing files are preserved).')
    );
  }

  const templatesDir = getTemplatesDir();
  const claudeSource = join(templatesDir, 'claude-code');
  const projectSource = join(templatesDir, 'project');

  if (!existsSync(claudeSource) && !existsSync(projectSource)) {
    p.log.warn(
      chalk.yellow(
        'No bundled templates found. (Templates dir is missing — nothing to copy.)'
      )
    );
    p.outro(chalk.dim('Nothing to do.'));
    return;
  }

  const spinner = p.spinner();
  spinner.start('Copying templates...');

  const claudeResult = existsSync(claudeSource)
    ? await copyTemplates(claudeSource, targetDir)
    : { copied: [], skipped: [] };
  const projectResult = existsSync(projectSource)
    ? await copyTemplates(projectSource, targetDir)
    : { copied: [], skipped: [] };

  spinner.stop('Templates processed');

  const allCopied = [...claudeResult.copied, ...projectResult.copied].sort();
  const allSkipped = [...claudeResult.skipped, ...projectResult.skipped].sort();

  if (allCopied.length > 0) {
    p.log.success(chalk.green(`copied: ${allCopied.length} file(s)`));
    for (const f of allCopied) {
      console.log(`  ${chalk.green('+')} ${f}`);
    }
  }

  if (allSkipped.length > 0) {
    for (const f of allSkipped) {
      console.log(`  ${chalk.yellow(`skipped: ${f} (exists)`)}`);
    }
  }

  p.note(
    [
      `${chalk.bold('copied')}:  ${allCopied.length}`,
      `${chalk.bold('skipped')}: ${allSkipped.length}`,
    ].join('\n'),
    'Summary'
  );

  p.outro(chalk.green('Done. Restart Claude Code to pick up new skills.'));
}
