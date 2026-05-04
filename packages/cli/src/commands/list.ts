import chalk from 'chalk';
import { loadSkills, groupByCategory, type SkillCategory, type Skill } from '../data/skills.js';
import * as out from '../utils/output.js';

const CATEGORY_ORDER: SkillCategory[] = [
  'Orchestrators',
  'Long-form',
  'Short-form',
  'Shared',
];

export interface ListOptions {
  json?: boolean;
}

interface SkillJSON {
  name: string;
  category: SkillCategory;
  path: string;
  description: string | null;
}

/**
 * List the bundled skills.
 *
 * Human mode: chalk-styled tree on stderr (chrome) with the skill names
 * on stderr too. Stdout stays empty.
 * JSON mode: one line on stdout with `{ skills: [{name, category, path, description}] }`.
 */
export async function listCommand(options: ListOptions = {}): Promise<void> {
  const skills = await loadSkills();

  if (options.json) {
    const payload: { skills: SkillJSON[] } = {
      skills: skills.map((s: Skill) => ({
        name: s.name,
        category: s.category,
        path: s.path,
        description: typeof s.frontmatter.description === 'string' ? s.frontmatter.description : null,
      })),
    };
    out.data(payload);
    return;
  }

  if (skills.length === 0) {
    out.warn('No skills found.');
    out.note(
      chalk.dim(
        '  (The templates directory is missing or empty — skills are populated by the publish step.)'
      )
    );
    return;
  }

  const grouped = groupByCategory(skills);

  process.stderr.write('\n');
  process.stderr.write(chalk.bold('scribetronic skills') + chalk.dim(` (${skills.length})`) + '\n');
  process.stderr.write('\n');

  for (const cat of CATEGORY_ORDER) {
    const items = grouped[cat];
    if (items.length === 0) continue;

    process.stderr.write(`  ${chalk.bold.underline(cat)}\n`);
    for (const skill of items) {
      const desc = oneLineDescription(skill.frontmatter.description);
      const namePart = chalk.cyan(skill.name.padEnd(32));
      const descPart = desc.length > 0 ? chalk.dim(desc) : chalk.dim('(no description)');
      process.stderr.write(`    ${chalk.dim('•')} ${namePart} ${descPart}\n`);
    }
    process.stderr.write('\n');
  }
}

function oneLineDescription(raw: string | string[] | undefined): string {
  if (raw === undefined) return '';
  const text = Array.isArray(raw) ? raw.join(' ') : raw;
  const flat = text.replace(/\s+/g, ' ').trim();
  return flat.length > 80 ? flat.slice(0, 77) + '...' : flat;
}
