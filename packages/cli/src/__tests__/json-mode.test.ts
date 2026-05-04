/**
 * E2E tests that spawn the built CLI and assert stdout/stderr/exit-code.
 *
 * Requires `npm run build` to have been run. Skipped if dist/index.js is
 * missing (so a clean clone can run the rest of the suite without failing).
 */

import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const CLI = resolve(__dirname, '..', '..', 'dist', 'index.js');
const HAS_BUILD = existsSync(CLI);

const skipIfNoBuild = HAS_BUILD ? describe : describe.skip;

let tmp: string;

beforeAll(() => {
  if (!HAS_BUILD) {
    console.warn(
      `[json-mode.test] Skipping spawn-based tests: ${CLI} not found. Run 'npm run build' first.`
    );
  }
});

beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), 'scribe-json-mode-'));
});

afterEach(() => {
  rmSync(tmp, { recursive: true, force: true });
});

function runCli(args: string[], opts: { cwd?: string } = {}): {
  stdout: string;
  stderr: string;
  status: number;
} {
  const result = spawnSync('node', [CLI, ...args], {
    cwd: opts.cwd ?? process.cwd(),
    env: { ...process.env, NO_COLOR: '1' },
    encoding: 'utf-8',
  });
  return {
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    status: result.status ?? -1,
  };
}

skipIfNoBuild('CLI --json mode (spawned binary)', () => {
  it('list --json: stdout is valid JSON, stderr empty, exit 0', () => {
    const r = runCli(['list', '--json']);
    expect(r.status).toBe(0);
    expect(r.stderr).toBe('');
    const parsed = JSON.parse(r.stdout);
    expect(Array.isArray(parsed.skills)).toBe(true);
    expect(parsed.skills.length).toBeGreaterThan(0);
    for (const s of parsed.skills) {
      expect(typeof s.name).toBe('string');
      expect(['Orchestrators', 'Long-form', 'Short-form', 'Shared']).toContain(s.category);
      expect(typeof s.path).toBe('string');
    }
  });

  it('info <skill> --json: stdout has name/path/frontmatter/body, exit 0', () => {
    const r = runCli(['info', 'agenda', '--json']);
    expect(r.status).toBe(0);
    expect(r.stderr).toBe('');
    const parsed = JSON.parse(r.stdout);
    expect(parsed.name).toBe('agenda');
    expect(parsed.path).toContain('agenda/SKILL.md');
    expect(parsed.frontmatter.name).toBe('agenda');
    expect(typeof parsed.body).toBe('string');
    expect(parsed.body.length).toBeGreaterThan(0);
  });

  it('info nonexistent --json: structured error envelope on stdout, exit 2', () => {
    const r = runCli(['info', 'definitely-not-a-skill', '--json']);
    expect(r.status).toBe(2);
    expect(r.stderr).toBe('');
    const parsed = JSON.parse(r.stdout);
    expect(parsed.ok).toBe(false);
    expect(parsed.error.code).toBe('SKILL_NOT_FOUND');
    expect(parsed.error.message).toContain('definitely-not-a-skill');
  });

  it('doctor --json on uninitialized dir: ok=false, exit 3', () => {
    const r = runCli(['doctor', tmp, '--json']);
    expect(r.status).toBe(3);
    expect(r.stderr).toBe('');
    const parsed = JSON.parse(r.stdout);
    expect(parsed.ok).toBe(false);
    expect(parsed.target).toBe(tmp);
    expect(parsed.checks).toHaveLength(6);
    expect(parsed.checks.some((c: { ok: boolean }) => !c.ok)).toBe(true);
  });

  it('doctor --json on initialized dir: ok=true, exit 0', () => {
    // Minimal initialized state: scaffold the project bits + register plugin manually
    mkdirSync(join(tmp, 'scribetronic/calendar'), { recursive: true });
    writeFileSync(join(tmp, 'scribetronic/publish-config.yaml'), 'target: blog');
    mkdirSync(join(tmp, 'scribetronic/style'), { recursive: true });
    writeFileSync(join(tmp, 'scribetronic/style/writing-style.md'), '---\nname: x\n---\n');
    mkdirSync(join(tmp, '.claude'), { recursive: true });
    writeFileSync(
      join(tmp, '.claude/settings.json'),
      JSON.stringify({
        extraKnownMarketplaces: {
          scribetronic: { source: { source: 'github', repo: 'r-bart/scribetronic-plugin' } },
        },
        enabledPlugins: { 'scribetronic@scribetronic': true },
      })
    );

    const r = runCli(['doctor', tmp, '--json']);
    expect(r.status).toBe(0);
    expect(r.stderr).toBe('');
    const parsed = JSON.parse(r.stdout);
    expect(parsed.ok).toBe(true);
  });

  it('init <nonexistent> --json: NOT supported (init has no --json), uses human error path with exit 2', () => {
    // init does not advertise --json. Passing it makes commander complain.
    // What we do verify: bad path → exit 2, stderr contains 'Directory does not exist'.
    const r = runCli(['init', join(tmp, 'definitely-not-here')]);
    expect(r.status).toBe(2);
    expect(r.stderr).toContain('Directory does not exist');
    expect(r.stdout).toBe('');
  });

  it('list (human mode, NO_COLOR): stderr has the tree, stdout empty, exit 0', () => {
    const r = runCli(['list']);
    expect(r.status).toBe(0);
    expect(r.stdout).toBe('');
    expect(r.stderr).toContain('scribetronic skills');
    expect(r.stderr).toContain('Orchestrators');
  });
});
