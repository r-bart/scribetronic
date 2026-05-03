import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import chalk from 'chalk';
import { getSkillsRoot, parseFrontmatter } from '../data/skills.js';

/**
 * Pretty-prints one bundled skill's frontmatter and body.
 * Exits 1 if the skill folder doesn't exist.
 */
export async function infoCommand(skillName: string): Promise<void> {
  const root = getSkillsRoot();
  const skillPath = join(root, skillName, 'SKILL.md');

  if (!existsSync(skillPath)) {
    console.error(chalk.red(`error: skill "${skillName}" not found`));
    console.error(chalk.dim(`  expected: ${skillPath}`));
    process.exit(1);
  }

  const raw = readFileSync(skillPath, 'utf-8');
  const { frontmatter, body } = parseFrontmatter(raw);

  console.log();
  console.log(chalk.bold.cyan(skillName));
  console.log(chalk.dim(skillPath));
  console.log();

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
    console.log(`  ${chalk.bold(label.padEnd(14))}${chalk.dim(':')} ${formatted}`);
  }

  // Surface any other frontmatter keys we don't have a dedicated label for.
  const known = new Set(['name', 'description', 'inherits', 'length_target', 'cadence']);
  for (const [key, value] of Object.entries(frontmatter)) {
    if (known.has(key) || value === undefined) continue;
    const formatted = Array.isArray(value) ? value.join(', ') : value;
    console.log(`  ${chalk.bold(key.padEnd(14))}${chalk.dim(':')} ${formatted}`);
  }

  console.log();
  console.log(chalk.bold.underline('Body'));
  console.log();
  console.log(body.trimEnd());
  console.log();
}
