import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { doctorCommand } from '../commands/doctor.js';
import { registerGitHubPlugin } from '../utils/settings.js';
import { captureStreams, type CapturedStreams } from './helpers/captureStreams.js';

let project: string;
let streams: CapturedStreams;
let exitSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  project = mkdtempSync(join(tmpdir(), 'scribe-doctor-'));
  exitSpy = vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
    throw new Error(`process.exit(${code ?? 0})`);
  }) as never);
});

afterEach(() => {
  streams?.restore();
  rmSync(project, { recursive: true, force: true });
  vi.restoreAllMocks();
});

describe('doctorCommand (human mode)', () => {
  it('reports failures on stderr and exits 3 when nothing is set up', async () => {
    streams = captureStreams();

    await expect(doctorCommand({ path: project })).rejects.toThrow('process.exit(3)');

    expect(exitSpy).toHaveBeenCalledWith(3);
    const stderr = streams.stderr();
    expect(stderr).toContain('scribetronic/ directory');
    expect(stderr).toContain('not registered');
    expect(streams.stdout()).toBe('');
  });

  it('passes (exit 0) when project skeleton + plugin + writing-style are present', async () => {
    mkdirSync(join(project, 'scribetronic/calendar'), { recursive: true });
    writeFileSync(join(project, 'scribetronic/publish-config.yaml'), 'target: blog');
    mkdirSync(join(project, 'scribetronic/style'), { recursive: true });
    writeFileSync(join(project, 'scribetronic/style/writing-style.md'), '---\nname: x\n---\n');
    registerGitHubPlugin(project, 'scribetronic', 'scribetronic', 'r-bart/scribetronic-plugin');

    streams = captureStreams();

    await expect(doctorCommand({ path: project })).resolves.toBeUndefined();

    expect(exitSpy).not.toHaveBeenCalled();
    expect(streams.stderr()).toContain('all 6 checks passed');
    expect(streams.stdout()).toBe('');
  });

  it('reports a marketplace mismatch and exits 3', async () => {
    mkdirSync(join(project, 'scribetronic/calendar'), { recursive: true });
    writeFileSync(join(project, 'scribetronic/publish-config.yaml'), 'target: blog');
    registerGitHubPlugin(project, 'scribetronic', 'scribetronic', 'someone/fork');

    streams = captureStreams();

    await expect(doctorCommand({ path: project })).rejects.toThrow('process.exit(3)');

    const stderr = streams.stderr();
    expect(stderr).toContain('marketplace source resolves to r-bart/scribetronic-plugin');
    expect(stderr).toContain('current: someone/fork');
  });
});

describe('doctorCommand (--json)', () => {
  it('emits {ok:false, target, checks: [...]} on stdout and exits 3 on failure', async () => {
    streams = captureStreams({ json: true });

    await expect(doctorCommand({ path: project, json: true })).rejects.toThrow(
      'process.exit(3)'
    );

    const parsed = JSON.parse(streams.stdout());
    expect(parsed.ok).toBe(false);
    expect(parsed.target).toBe(project);
    expect(parsed.checks).toHaveLength(6);
    for (const c of parsed.checks) {
      expect(typeof c.label).toBe('string');
      expect(typeof c.ok).toBe('boolean');
    }
    expect(streams.stderr()).toBe('');
  });

  it('emits {ok:true, ...} and exits 0 when all checks pass', async () => {
    mkdirSync(join(project, 'scribetronic/calendar'), { recursive: true });
    writeFileSync(join(project, 'scribetronic/publish-config.yaml'), 'target: blog');
    mkdirSync(join(project, 'scribetronic/style'), { recursive: true });
    writeFileSync(join(project, 'scribetronic/style/writing-style.md'), '---\nname: x\n---\n');
    registerGitHubPlugin(project, 'scribetronic', 'scribetronic', 'r-bart/scribetronic-plugin');

    streams = captureStreams({ json: true });

    await expect(doctorCommand({ path: project, json: true })).resolves.toBeUndefined();

    expect(exitSpy).not.toHaveBeenCalled();
    const parsed = JSON.parse(streams.stdout());
    expect(parsed.ok).toBe(true);
    expect(parsed.checks.every((c: { ok: boolean }) => c.ok)).toBe(true);
    expect(streams.stderr()).toBe('');
  });
});
