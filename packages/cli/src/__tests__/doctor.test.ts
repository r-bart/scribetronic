import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { doctorCommand } from '../commands/doctor.js';
import { registerGitHubPlugin } from '../utils/settings.js';

let project: string;
let logSpy: ReturnType<typeof vi.spyOn>;
let exitSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  project = mkdtempSync(join(tmpdir(), 'scribe-doctor-'));
  logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  exitSpy = vi.spyOn(process, 'exit').mockImplementation(((_code?: number) => {
    throw new Error('process.exit called');
  }) as never);
});

afterEach(() => {
  rmSync(project, { recursive: true, force: true });
  vi.restoreAllMocks();
});

function output(): string {
  return logSpy.mock.calls.map((c: unknown[]) => c.join(' ')).join('\n');
}

describe('doctorCommand', () => {
  it('reports failures and exits 1 when nothing is set up', async () => {
    await expect(doctorCommand({ path: project })).rejects.toThrow('process.exit called');

    expect(exitSpy).toHaveBeenCalledWith(1);
    const out = output();
    expect(out).toContain('scribetronic/ directory');
    expect(out).toContain('not registered');
  });

  it('passes when project skeleton + plugin + writing-style are present', async () => {
    // Project skeleton
    mkdirSync(join(project, 'scribetronic/calendar'), { recursive: true });
    writeFileSync(join(project, 'scribetronic/publish-config.yaml'), 'target: blog');
    mkdirSync(join(project, 'scribetronic/writing-style'), { recursive: true });
    writeFileSync(join(project, 'scribetronic/writing-style/SKILL.md'), '---\nname: x\n---\n');

    // Plugin registration
    registerGitHubPlugin(project, 'scribetronic', 'scribetronic', 'r-bart/scribetronic-plugin');

    await expect(doctorCommand({ path: project })).resolves.toBeUndefined();

    expect(exitSpy).not.toHaveBeenCalled();
    expect(output()).toContain('all 6 checks passed');
  });

  it('reports a marketplace mismatch when the repo URL drifts', async () => {
    mkdirSync(join(project, 'scribetronic/calendar'), { recursive: true });
    writeFileSync(join(project, 'scribetronic/publish-config.yaml'), 'target: blog');
    registerGitHubPlugin(project, 'scribetronic', 'scribetronic', 'someone/fork');

    await expect(doctorCommand({ path: project })).rejects.toThrow('process.exit called');

    const out = output();
    expect(out).toContain('marketplace source resolves to r-bart/scribetronic-plugin');
    expect(out).toContain('current: someone/fork');
  });
});
