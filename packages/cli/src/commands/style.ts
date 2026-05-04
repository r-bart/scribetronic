import { existsSync, mkdirSync, copyFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import * as p from '@clack/prompts';
import chalk from 'chalk';
import { getTemplatesDir } from '../data/skills.js';
import * as out from '../utils/output.js';
import { ExitCode } from '../utils/exit.js';

export interface StyleOptions {
  reset?: boolean;
  /** Bypass confirm prompts. Also honored: SCRIBETRONIC_YES=1 env var. */
  yes?: boolean;
}

/**
 * Manages `scribetronic/style/writing-style.md` in the current project.
 *
 * This is the user's voice override. The skills loaded from the plugin
 * marketplace (`/scribetronic:write`, `/scribetronic:editing-pass`, etc.)
 * read this path first; the bundled `writing-style/SKILL.md` template only
 * applies when the override is absent.
 *
 * - Missing target + no `--reset`: copy the seed and exit (`created:` line on stderr).
 * - Existing target + no `--reset` + TTY: open in `$EDITOR`.
 * - Existing target + no `--reset` + no TTY: print the absolute path on **stdout**
 *   (so an agent can capture the path with `path=$(scribetronic style)`).
 * - `--reset`: prompt for confirmation, then overwrite from the seed. Bypass
 *   the prompt with `--yes` or `SCRIBETRONIC_YES=1` (required when stdin is
 *   not a TTY, e.g. CI / agent invocations).
 *
 * Exit codes: 0 success, 1 unexpected (missing seed, editor failure),
 * 2 usage error (--reset without TTY and without --yes).
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
    out.error(`bundled writing-style seed not found at ${seedPath}`, 'SEED_MISSING');
    process.exit(ExitCode.Unexpected);
  }

  // Reset flow
  if (options.reset) {
    const yes = options.yes || process.env['SCRIBETRONIC_YES'] === '1';

    if (!yes && !process.stdin.isTTY) {
      out.error(
        '--reset requires either an interactive terminal, --yes, or SCRIBETRONIC_YES=1.',
        'NEEDS_TTY'
      );
      process.exit(ExitCode.Usage);
    }

    if (!yes) {
      // Interactive confirm
      if (out.isInteractive()) p.intro(chalk.bold('scribetronic style --reset'));
      const confirmed = await p.confirm({
        message: `Overwrite ${targetPath} with the seed template?`,
        initialValue: false,
      });

      if (p.isCancel(confirmed) || !confirmed) {
        out.note(chalk.dim('cancelled'));
        if (out.isInteractive()) p.outro('');
        return;
      }
    }

    mkdirSync(dirname(targetPath), { recursive: true });
    copyFileSync(seedPath, targetPath);
    out.success(`reset: ${targetPath}`);
    if (out.isInteractive() && !yes) p.outro(chalk.green('Done.'));
    return;
  }

  // Missing target → seed
  if (!existsSync(targetPath)) {
    mkdirSync(dirname(targetPath), { recursive: true });
    copyFileSync(seedPath, targetPath);
    out.success(`created: ${targetPath}`);
    return;
  }

  // Existing target → open in editor (TTY) or print path
  if (!process.stdin.isTTY) {
    // Print the path on stdout so an agent can do `path=$(scribetronic style)`.
    process.stdout.write(targetPath + '\n');
    return;
  }

  const editor = process.env['EDITOR'] || process.env['VISUAL'] || 'vi';
  const result = spawnSync(editor, [targetPath], { stdio: 'inherit' });
  if (result.error) {
    out.error(`failed to launch editor "${editor}": ${result.error.message}`, 'EDITOR_FAILED');
    process.exit(ExitCode.Unexpected);
  }
  if (typeof result.status === 'number' && result.status !== 0) {
    process.exit(result.status);
  }
}
