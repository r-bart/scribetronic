import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { Skill } from '../data/skills.js';
import { captureStreams, type CapturedStreams } from './helpers/captureStreams.js';

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

const { listCommand } = await import('../commands/list.js');

let streams: CapturedStreams;

beforeEach(() => {
  fakeSkills = [];
});

afterEach(() => {
  streams?.restore();
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

describe('listCommand (human mode)', () => {
  it('warns "no skills found" on stderr when registry is empty', async () => {
    fakeSkills = [];
    streams = captureStreams();

    await listCommand();

    expect(streams.stderr()).toMatch(/no skills found/i);
    expect(streams.stdout()).toBe('');
  });

  it('groups skills by category on stderr; stdout stays empty', async () => {
    fakeSkills = [
      makeSkill('agenda', 'Plan the week.'),
      makeSkill('write', 'Master writer.'),
      makeSkill('long-form-weekly-newsletter', 'Weekly long-form.'),
      makeSkill('short-form-listicle', 'Numbered list.'),
      makeSkill('writing-style', 'Voice guide.'),
    ];
    streams = captureStreams();

    await listCommand();
    const stderr = streams.stderr();

    expect(stderr).toContain('Orchestrators');
    expect(stderr).toContain('Long-form');
    expect(stderr).toContain('Short-form');
    expect(stderr).toContain('Shared');
    expect(stderr).toContain('agenda');
    expect(stderr).toContain('write');
    expect(stderr).toContain('long-form-weekly-newsletter');
    expect(stderr).toContain('short-form-listicle');
    expect(stderr).toContain('writing-style');
    expect(stderr).toContain('5');
    expect(streams.stdout()).toBe('');
  });

  it('truncates descriptions longer than 80 chars with ellipsis', async () => {
    const longDesc = 'A'.repeat(120);
    fakeSkills = [makeSkill('agenda', longDesc)];
    streams = captureStreams();

    await listCommand();
    const stderr = streams.stderr();

    expect(stderr).toContain('...');
    expect(stderr).not.toContain('A'.repeat(120));
  });

  it('renders "(no description)" for skills missing one', async () => {
    fakeSkills = [makeSkill('agenda')];
    streams = captureStreams();

    await listCommand();

    expect(streams.stderr()).toContain('(no description)');
  });

  it('joins array-valued descriptions before truncating', async () => {
    fakeSkills = [makeSkill('agenda', ['part one', 'part two'])];
    streams = captureStreams();

    await listCommand();

    expect(streams.stderr()).toContain('part one part two');
  });
});

describe('listCommand (--json)', () => {
  it('emits one JSON line on stdout, nothing on stderr, when registry is empty', async () => {
    fakeSkills = [];
    streams = captureStreams({ json: true });

    await listCommand({ json: true });

    const stdout = streams.stdout();
    const parsed = JSON.parse(stdout);
    expect(parsed).toEqual({ skills: [] });
    expect(streams.stderr()).toBe('');
  });

  it('serializes every skill with name, category, path, description', async () => {
    fakeSkills = [
      makeSkill('agenda', 'Plan the week.'),
      makeSkill('write'),
      makeSkill('long-form-weekly-newsletter', ['part one', 'part two']),
    ];
    streams = captureStreams({ json: true });

    await listCommand({ json: true });

    const parsed = JSON.parse(streams.stdout());
    expect(parsed.skills).toHaveLength(3);
    expect(parsed.skills[0]).toEqual({
      name: 'agenda',
      category: 'Orchestrators',
      path: '/fake/agenda/SKILL.md',
      description: 'Plan the week.',
    });
    expect(parsed.skills[1].description).toBeNull();
    // Array-valued descriptions are not coerced to strings in JSON output —
    // they stay null per the SkillJSON contract (description: string | null).
    expect(parsed.skills[2].description).toBeNull();
    expect(streams.stderr()).toBe('');
  });
});
