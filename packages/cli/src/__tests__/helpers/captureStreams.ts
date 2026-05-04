import { vi, type MockInstance } from 'vitest';
import * as out from '../../utils/output.js';

export interface CapturedStreams {
  stdout: () => string;
  stderr: () => string;
  restore: () => void;
}

/**
 * Capture process.stdout/process.stderr writes for the duration of a test,
 * and configure the output module deterministically (no TTY, no color, no JSON
 * unless overridden).
 *
 * Returns getters so the test reads the latest accumulated output, plus a
 * `restore` to undo all spies.
 */
export function captureStreams(opts: { json?: boolean; isTTY?: boolean } = {}): CapturedStreams {
  const stdoutChunks: string[] = [];
  const stderrChunks: string[] = [];

  const stdoutSpy: MockInstance = vi
    .spyOn(process.stdout, 'write')
    .mockImplementation(((chunk: string | Uint8Array) => {
      stdoutChunks.push(typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString('utf-8'));
      return true;
    }) as never);

  const stderrSpy: MockInstance = vi
    .spyOn(process.stderr, 'write')
    .mockImplementation(((chunk: string | Uint8Array) => {
      stderrChunks.push(typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString('utf-8'));
      return true;
    }) as never);

  // Reset the output module and configure for the test.
  out._resetForTests();
  out.configure({
    json: opts.json ?? false,
    isTTY: opts.isTTY ?? false,
    noColor: true,
  });

  return {
    stdout: () => stdoutChunks.join(''),
    stderr: () => stderrChunks.join(''),
    restore: () => {
      stdoutSpy.mockRestore();
      stderrSpy.mockRestore();
      out._resetForTests();
    },
  };
}
