import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { analyzeProject } from '../analyzers/project.js';

let sandbox: string;

beforeEach(() => {
  sandbox = mkdtempSync(join(tmpdir(), 'scribe-analyze-'));
});

afterEach(() => {
  rmSync(sandbox, { recursive: true, force: true });
});

function writeSkill(name: string) {
  const dir = join(sandbox, '.claude', 'skills', name);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'SKILL.md'), `---\nname: ${name}\n---\nbody`);
}

describe('analyzeProject', () => {
  it('reports all-false for an empty directory', () => {
    const r = analyzeProject(sandbox);
    expect(r).toEqual({
      hasScribetronic: false,
      hasClaudeSkills: false,
      hasScribetronicDir: false,
    });
  });

  it('detects .claude/skills/ but not scribetronic/ install', () => {
    writeSkill('agenda');
    const r = analyzeProject(sandbox);
    expect(r.hasClaudeSkills).toBe(true);
    expect(r.hasScribetronicDir).toBe(false);
    expect(r.hasScribetronic).toBe(false);
  });

  it('detects scribetronic/ alone but not full install', () => {
    mkdirSync(join(sandbox, 'scribetronic'));
    const r = analyzeProject(sandbox);
    expect(r.hasScribetronicDir).toBe(true);
    expect(r.hasClaudeSkills).toBe(false);
    expect(r.hasScribetronic).toBe(false);
  });

  it('reports hasScribetronic=true only with an orchestrator skill AND scribetronic/ dir', () => {
    writeSkill('agenda');
    mkdirSync(join(sandbox, 'scribetronic'));
    const r = analyzeProject(sandbox);
    expect(r.hasScribetronic).toBe(true);
    expect(r.hasClaudeSkills).toBe(true);
    expect(r.hasScribetronicDir).toBe(true);
  });

  it('does NOT count a non-orchestrator skill as a scribetronic install', () => {
    // writing-style alone is shared, not an orchestrator
    writeSkill('writing-style');
    mkdirSync(join(sandbox, 'scribetronic'));
    const r = analyzeProject(sandbox);
    expect(r.hasScribetronic).toBe(false);
    expect(r.hasClaudeSkills).toBe(true);
    expect(r.hasScribetronicDir).toBe(true);
  });

  it('accepts any of the three orchestrator names', () => {
    for (const name of ['agenda', 'write', 'write-publish']) {
      const dir = mkdtempSync(join(tmpdir(), 'scribe-analyze-orch-'));
      try {
        const skillDir = join(dir, '.claude', 'skills', name);
        mkdirSync(skillDir, { recursive: true });
        writeFileSync(join(skillDir, 'SKILL.md'), '---\n---\nbody');
        mkdirSync(join(dir, 'scribetronic'));
        const r = analyzeProject(dir);
        expect(r.hasScribetronic).toBe(true);
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    }
  });
});
