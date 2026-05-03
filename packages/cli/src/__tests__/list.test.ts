import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { Skill } from '../data/skills.js';

// Holder for the per-test skill list. Mock factory closes over it lazily.
let fakeSkills: Skill[] = [];

vi.mock('../data/skills.js', async () => {
  const actual = await vi.importActual<typeof import('../data/skills.js')>(
    '../data/skills.js'
  );
  return {
    ...actual,
    loadSkills: async () => fakeSkills,
  };
});

// Import AFTER vi.mock is registered.
const { listCommand } = await import('../commands/list.js');

beforeEach(() => {
  fakeSkills = [];
});

afterEach(() => {
  vi.restoreAllMocks();
});

function makeSkill(name: string, description?: string | string[]): Skill {
  const category = name.startsWith('long-form-')
    ? 'Long-form'
    : name.startsWith('short-form-')
      ? 'Short-form'
      : ['agenda', 'write', 'write-publish'].includes(name)
        ? 'Orchestrators'
        : 'Shared';
  // The SkillFrontmatter index signature allows string[] for any key. The
  // explicit `description?: string` is a hint, not enforced at parse time —
  // the inline-list parser will store arrays for any key.
  const frontmatter = (
    description === undefined ? { name } : { name, description }
  ) as Skill['frontmatter'];
  return {
    name,
    category,
    path: `/fake/${name}/SKILL.md`,
    frontmatter,
    body: 'body',
  };
}

describe('listCommand', () => {
  it('prints a yellow "no skills found" hint when the registry is empty', async () => {
    fakeSkills = [];

    const logs: string[] = [];
    const spy = vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      logs.push(args.map((a) => String(a)).join(' '));
    });

    await listCommand();
    const output = logs.join('\n');

    expect(output).toMatch(/no skills found/i);

    spy.mockRestore();
  });

  it('groups skills by category and lists each one', async () => {
    fakeSkills = [
      makeSkill('agenda', 'Plan the week.'),
      makeSkill('write', 'Master writer.'),
      makeSkill('long-form-weekly-newsletter', 'Weekly long-form.'),
      makeSkill('short-form-listicle', 'Numbered list.'),
      makeSkill('writing-style', 'Voice guide.'),
    ];

    const logs: string[] = [];
    const spy = vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      logs.push(args.map((a) => String(a)).join(' '));
    });

    await listCommand();
    const output = logs.join('\n');

    expect(output).toContain('Orchestrators');
    expect(output).toContain('Long-form');
    expect(output).toContain('Short-form');
    expect(output).toContain('Shared');
    expect(output).toContain('agenda');
    expect(output).toContain('write');
    expect(output).toContain('long-form-weekly-newsletter');
    expect(output).toContain('short-form-listicle');
    expect(output).toContain('writing-style');
    expect(output).toContain('5');

    spy.mockRestore();
  });

  it('truncates descriptions longer than 80 chars with ellipsis', async () => {
    const longDesc = 'A'.repeat(120);
    fakeSkills = [makeSkill('agenda', longDesc)];

    const logs: string[] = [];
    const spy = vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      logs.push(args.map((a) => String(a)).join(' '));
    });

    await listCommand();
    const output = logs.join('\n');

    expect(output).toContain('...');
    expect(output).not.toContain('A'.repeat(120));

    spy.mockRestore();
  });

  it('renders "(no description)" for skills missing one', async () => {
    fakeSkills = [makeSkill('agenda')];

    const logs: string[] = [];
    const spy = vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      logs.push(args.map((a) => String(a)).join(' '));
    });

    await listCommand();
    const output = logs.join('\n');

    expect(output).toContain('(no description)');

    spy.mockRestore();
  });

  it('joins array-valued descriptions before truncating', async () => {
    fakeSkills = [makeSkill('agenda', ['part one', 'part two'])];

    const logs: string[] = [];
    const spy = vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      logs.push(args.map((a) => String(a)).join(' '));
    });

    await listCommand();
    const output = logs.join('\n');

    expect(output).toContain('part one part two');

    spy.mockRestore();
  });
});
