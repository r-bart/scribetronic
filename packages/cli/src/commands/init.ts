import { existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import * as p from '@clack/prompts';
import chalk from 'chalk';
import { copyTemplates } from '../generators/templateCopier.js';
import { analyzeProject } from '../analyzers/project.js';
import { getTemplatesDir } from '../data/skills.js';
import {
  GITHUB_MARKETPLACE_REPO,
  MARKETPLACE_NAME,
  PLUGIN_KEY,
  PLUGIN_NAME,
} from '../data/plugin.js';
import { registerGitHubPlugin } from '../utils/settings.js';
import * as out from '../utils/output.js';
import { ExitCode } from '../utils/exit.js';

export interface InitOptions {
  path?: string;
}

/**
 * Scaffolds the writing system into the target directory.
 *
 * What gets written locally:
 *   - `<target>/scribetronic/` — calendar templates, ideas, publish-config
 *   - `<target>/.claude/settings.json` — registers the GitHub plugin marketplace
 *   - `<target>/.claude/<other>` — any non-`skills/` files from `templates/claude-code/`
 *
 * What does NOT get written: bundled `SKILL.md` files. Those live in the
 * scribetronic-plugin marketplace repo and are loaded by Claude Code at
 * runtime as `/scribetronic:<skill>`.
 *
 * Idempotent: existing files are skipped, the marketplace registration is
 * upserted, and re-running is safe.
 *
 * Output discipline: this command mutates the filesystem, so it has no
 * "data" payload. All progress chrome routes to stderr (via `out` and clack
 * when interactive); stdout stays empty. Exit codes: 0 success, 2 if the
 * target path doesn't exist.
 */
export async function initCommand(options: InitOptions): Promise<void> {
  const targetDir = resolve(options.path ?? process.cwd());

  if (out.isInteractive()) {
    p.intro(chalk.bold('scribetronic init'));
  } else {
    out.note('scribetronic init');
  }

  if (!existsSync(targetDir)) {
    out.error(`Directory does not exist: ${targetDir}`, 'PATH_NOT_FOUND');
    process.exit(ExitCode.Usage);
  }

  const analysis = analyzeProject(targetDir);
  if (analysis.hasScribetronic) {
    out.note(
      chalk.dim(
        'Detected an existing scribetronic install — re-running is safe (existing files are preserved).'
      )
    );
  }

  const templatesDir = getTemplatesDir();
  const claudeSource = join(templatesDir, 'claude-code');
  const projectSource = join(templatesDir, 'project');

  if (!existsSync(claudeSource) && !existsSync(projectSource)) {
    out.warn('No bundled templates found. (Templates dir is missing — nothing to copy.)');
    if (out.isInteractive()) p.outro(chalk.dim('Nothing to do.'));
    return;
  }

  let spinner: ReturnType<typeof p.spinner> | undefined;
  if (out.isInteractive()) {
    spinner = p.spinner();
    spinner.start('Copying templates...');
  } else {
    out.note('copying templates...');
  }

  // Skills no longer ship inside the project — they live in the plugin
  // marketplace and load at runtime. Anything else under templates/claude-code/
  // (rules, agents, etc.) still gets copied.
  const claudeResult = existsSync(claudeSource)
    ? await copyTemplates(claudeSource, targetDir, {
        exclude: ['.claude/skills/**'],
      })
    : { copied: [], skipped: [] };
  const projectResult = existsSync(projectSource)
    ? await copyTemplates(projectSource, targetDir)
    : { copied: [], skipped: [] };

  if (spinner) spinner.stop('Templates processed');

  await registerGitHubPlugin(targetDir, PLUGIN_NAME, MARKETPLACE_NAME, GITHUB_MARKETPLACE_REPO);

  const allCopied = [...claudeResult.copied, ...projectResult.copied].sort();
  const allSkipped = [...claudeResult.skipped, ...projectResult.skipped].sort();

  if (allCopied.length > 0) {
    out.success(`copied: ${allCopied.length} file(s)`);
    for (const f of allCopied) {
      out.note(`  ${chalk.green('+')} ${f}`);
    }
  }
  for (const f of allSkipped) {
    out.note(`  ${chalk.yellow(`skipped: ${f} (exists)`)}`);
  }

  if (out.isInteractive()) {
    p.note(
      [
        `${chalk.bold('copied')}:  ${allCopied.length}`,
        `${chalk.bold('skipped')}: ${allSkipped.length}`,
        `${chalk.bold('plugin')}:  ${PLUGIN_KEY} (${GITHUB_MARKETPLACE_REPO})`,
      ].join('\n'),
      'Summary'
    );
    p.outro(
      chalk.green(
        'Done. Restart Claude Code — skills will load from the marketplace as `/scribetronic:<name>`.'
      )
    );
  } else {
    out.note(
      `summary: copied=${allCopied.length} skipped=${allSkipped.length} plugin=${PLUGIN_KEY} (${GITHUB_MARKETPLACE_REPO})`
    );
    out.success(
      'Done. Restart Claude Code — skills will load from the marketplace as `/scribetronic:<name>`.'
    );
  }
}
