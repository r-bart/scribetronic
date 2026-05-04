import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import chalk from 'chalk';
import { getSkillsRoot, parseFrontmatter } from '../data/skills.js';
import * as out from '../utils/output.js';
import { ExitCode } from '../utils/exit.js';

export interface InfoOptions {
  json?: boolean;
}

/**
 * Show one skill's frontmatter + body.
 *
 * Human mode: pretty-printed on stderr; the body is also stderr (it's
 * documentation, not data). Stdout stays empty.
 * JSON mode: one line on stdout with `{name, path, frontmatter, body}`.
 *
 * Exit codes: 0 success, 2 if skill is not found.
 */
export async function infoCommand(skillName: string, options: InfoOptions = {}): Promise<void> {
  const root = getSkillsRoot();
  const skillPath = join(root, skillName, 'SKILL.md');

  if (!existsSync(skillPath)) {
    out.error(`skill "${skillName}" not found (expected ${skillPath})`, 'SKILL_NOT_FOUND');
    process.exit(ExitCode.Usage);
  }

  const raw = readFileSync(skillPath, 'utf-8');
  const { frontmatter, body } = parseFrontmatter(raw);

  if (options.json) {
    out.data({ name: skillName, path: skillPath, frontmatter, body });
    return;
  }

  process.stderr.write('\n');
  process.stderr.write(chalk.bold.cyan(skillName) + '\n');
  process.stderr.write(chalk.dim(skillPath) + '\n');
  process.stderr.write('\n');

  const fields: Array<[string, string | string[] | undefined]> = [
    ['name', frontmatter.name],
    ['description', frontmatter.description],
    ['inherits', frontmatter.inherits],
    ['length_target', frontmatter.length_target],
    ['cadence', frontmatter.cadence],
  ];

  for (const [label, value] of fields) {
    if (value === undefined) continue;
    const formatted = Array.isArray(value) ? value.join(', ') : value;
    process.stderr.write(`  ${chalk.bold(label.padEnd(14))}${chalk.dim(':')} ${formatted}\n`);
  }

  // Surface any other frontmatter keys we don't have a dedicated label for.
  const known = new Set(['name', 'description', 'inherits', 'length_target', 'cadence']);
  for (const [key, value] of Object.entries(frontmatter)) {
    if (known.has(key) || value === undefined) continue;
    const formatted = Array.isArray(value) ? value.join(', ') : value;
    process.stderr.write(`  ${chalk.bold(key.padEnd(14))}${chalk.dim(':')} ${formatted}\n`);
  }

  process.stderr.write('\n');
  process.stderr.write(chalk.bold.underline('Body') + '\n');
  process.stderr.write('\n');
  process.stderr.write(body.trimEnd() + '\n');
  process.stderr.write('\n');
}
