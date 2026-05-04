import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { getSkillsRoot, loadSkills } from '../data/skills.js';

describe('bundled skills', () => {
  it('ships style-refine in the real templates tree', () => {
    const path = join(getSkillsRoot(), 'style-refine', 'SKILL.md');
    expect(existsSync(path)).toBe(true);
  });

  it('loadSkills picks up style-refine and assigns it the Shared category', async () => {
    const skills = await loadSkills();
    const refine = skills.find((s) => s.name === 'style-refine');
    expect(refine).toBeDefined();
    expect(refine?.category).toBe('Shared');
    expect(refine?.frontmatter.name).toBe('style-refine');
  });
});
