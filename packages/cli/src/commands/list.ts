import chalk from 'chalk';
import { loadSkills, groupByCategory, type SkillCategory } from '../data/skills.js';

const CATEGORY_ORDER: SkillCategory[] = [
  'Orchestrators',
  'Long-form',
  'Short-form',
  'Shared',
];

/**
 * Prints a chalk-styled tree of bundled skills, grouped by category.
 * Gracefully degrades to "no skills found" if the templates dir is empty.
 */
export async function listCommand(): Promise<void> {
  const skills = await loadSkills();

  if (skills.length === 0) {
    console.log(chalk.yellow('No skills found.'));
    console.log(
      chalk.dim(
        '  (The templates directory is missing or empty — skills are populated by the publish step.)'
      )
    );
    return;
  }

  const grouped = groupByCategory(skills);

  console.log();
  console.log(chalk.bold(`scribetronic skills`) + chalk.dim(` (${skills.length})`));
  console.log();

  for (const cat of CATEGORY_ORDER) {
    const items = grouped[cat];
    if (items.length === 0) continue;

    console.log(`  ${chalk.bold.underline(cat)}`);
    for (const skill of items) {
      const desc = oneLineDescription(skill.frontmatter.description);
      const namePart = chalk.cyan(skill.name.padEnd(32));
      const descPart = desc.length > 0 ? chalk.dim(desc) : chalk.dim('(no description)');
      console.log(`    ${chalk.dim('•')} ${namePart} ${descPart}`);
    }
    console.log();
  }
}

function oneLineDescription(raw: string | string[] | undefined): string {
  if (raw === undefined) return '';
  const text = Array.isArray(raw) ? raw.join(' ') : raw;
  const flat = text.replace(/\s+/g, ' ').trim();
  return flat.length > 80 ? flat.slice(0, 77) + '...' : flat;
}
