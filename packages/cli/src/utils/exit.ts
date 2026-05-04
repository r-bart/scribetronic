/**
 * Stable exit-code contract for the scribetronic CLI.
 *
 * - 0  Success.
 * - 1  Unexpected error (uncaught throw, internal bug, FS failure mid-op).
 * - 2  Usage error (bad arguments, missing path, unknown skill).
 * - 3  State error (config drift, plugin not registered when expected,
 *      doctor checks failed).
 *
 * Never reuse codes for unrelated meanings. Document any new code added
 * here in `docs/cli-reference.md` and `--help` epilog.
 */
export const ExitCode = {
  Success: 0,
  Unexpected: 1,
  Usage: 2,
  State: 3,
} as const;

export type ExitCodeValue = (typeof ExitCode)[keyof typeof ExitCode];
