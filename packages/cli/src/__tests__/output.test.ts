import { describe, it, expect, beforeEach, afterEach, vi, type MockInstance } from 'vitest';
import * as out from '../utils/output.js';

let stdoutChunks: string[];
let stderrChunks: string[];
let stdoutSpy: MockInstance;
let stderrSpy: MockInstance;

function setup(opts: Partial<{ json: boolean; isTTY: boolean; noColor: boolean }>) {
  out._resetForTests();
  out.configure({
    json: opts.json ?? false,
    isTTY: opts.isTTY ?? false,
    noColor: opts.noColor ?? true,
  });
}

beforeEach(() => {
  stdoutChunks = [];
  stderrChunks = [];
  stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(((chunk: string | Uint8Array) => {
    stdoutChunks.push(typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString('utf-8'));
    return true;
  }) as never);
  stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(((chunk: string | Uint8Array) => {
    stderrChunks.push(typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString('utf-8'));
    return true;
  }) as never);
});

afterEach(() => {
  stdoutSpy.mockRestore();
  stderrSpy.mockRestore();
  out._resetForTests();
});

const stdout = () => stdoutChunks.join('');
const stderr = () => stderrChunks.join('');

describe('output module — JSON mode', () => {
  it('data() emits a single JSON line on stdout', () => {
    setup({ json: true });
    out.data({ skills: [{ name: 'agenda' }] });
    expect(stdout()).toBe('{"skills":[{"name":"agenda"}]}\n');
    expect(stderr()).toBe('');
  });

  it('note/success/warn are silenced in JSON mode', () => {
    setup({ json: true });
    out.note('hint');
    out.success('done');
    out.warn('careful');
    expect(stdout()).toBe('');
    expect(stderr()).toBe('');
  });

  it('error() emits a structured envelope on stdout (gh/kubectl convention)', () => {
    setup({ json: true });
    out.error('something broke', 'BROKE');
    expect(stdout()).toBe('{"ok":false,"error":{"message":"something broke","code":"BROKE"}}\n');
    expect(stderr()).toBe('');
  });

  it('error() omits the code field when not provided', () => {
    setup({ json: true });
    out.error('plain error');
    expect(stdout()).toBe('{"ok":false,"error":{"message":"plain error"}}\n');
  });
});

describe('output module — human mode (non-TTY)', () => {
  it('data() in human mode requires a string', () => {
    setup({ json: false, isTTY: false });
    expect(() => out.data({ not: 'a string' })).toThrow();
  });

  it('data(string) writes verbatim to stdout', () => {
    setup({ json: false, isTTY: false });
    out.data('the value');
    expect(stdout()).toBe('the value\n');
  });

  it('note() is silent when not a TTY', () => {
    setup({ json: false, isTTY: false });
    out.note('hint');
    expect(stderr()).toBe('');
  });

  it('success() prints to stderr without color glyph', () => {
    setup({ json: false, isTTY: false });
    out.success('done');
    expect(stderr()).toBe('done\n');
    expect(stderr().includes(String.fromCharCode(27))).toBe(false); // no ANSI
  });

  it('warn() uses "warn:" prefix in non-TTY mode', () => {
    setup({ json: false, isTTY: false });
    out.warn('careful');
    expect(stderr()).toBe('warn: careful\n');
  });

  it('error() prints to stderr with "error:" prefix', () => {
    setup({ json: false, isTTY: false });
    out.error('something broke');
    expect(stderr()).toBe('error: something broke\n');
    expect(stdout()).toBe('');
  });
});

describe('output module — human mode (TTY without NO_COLOR)', () => {
  it('isInteractive() returns true', () => {
    setup({ json: false, isTTY: true, noColor: false });
    expect(out.isInteractive()).toBe(true);
  });

  it('note() prints decorations to stderr in TTY', () => {
    setup({ json: false, isTTY: true, noColor: false });
    out.note('hint');
    expect(stderr()).toContain('hint');
  });
});

describe('output module — NO_COLOR honored', () => {
  it('isInteractive() returns false when noColor is set, even in TTY', () => {
    setup({ json: false, isTTY: true, noColor: true });
    expect(out.isInteractive()).toBe(false);
  });
});
