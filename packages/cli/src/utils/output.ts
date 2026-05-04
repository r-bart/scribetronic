/**
 * Output router. The single point through which all CLI commands emit text.
 *
 * Two contracts it enforces:
 *
 * 1. **stdout is for data**, stderr is for everything else (chrome, progress,
 *    warnings, errors). This lets agents pipe `scribetronic list | jq` even
 *    without `--json`, and `scribetronic foo > out 2> err` separates cleanly.
 * 2. **`--json` mode** — when active, only `data()` writes (a single newline-
 *    terminated JSON line on stdout); `note/success/warn` are silenced;
 *    `error()` emits a structured envelope on stdout instead of stderr.
 *
 * Also honors `NO_COLOR` and TTY detection. When stdout is not a TTY (piped)
 * or `NO_COLOR` is set, color is disabled globally and decorative chrome is
 * downgraded to plain text.
 */

import chalk from 'chalk';

interface OutputConfig {
  json: boolean;
  isTTY: boolean;
  noColor: boolean;
}

let cfg: OutputConfig = {
  json: false,
  isTTY: Boolean(process.stdout.isTTY),
  noColor: Boolean(process.env['NO_COLOR']),
};

let chalkLevelInitialized = false;

/**
 * Configure the output module. Must be called once at CLI entry, before any
 * `data/note/success/warn/error` calls. Calling more than once is safe — the
 * last config wins; chalk's global level is only adjusted on the first call
 * to keep behavior predictable in tests.
 */
export function configure(opts: Partial<OutputConfig>): void {
  cfg = { ...cfg, ...opts };
  if (!chalkLevelInitialized && (cfg.noColor || !cfg.isTTY)) {
    chalk.level = 0;
    chalkLevelInitialized = true;
  }
}

/** True iff JSON mode is active. Commands branch on this for output shape. */
export function isJson(): boolean {
  return cfg.json;
}

/** True iff stdout is an interactive terminal (and NO_COLOR is unset). */
export function isInteractive(): boolean {
  return cfg.isTTY && !cfg.noColor;
}

/**
 * Emit machine-readable data on **stdout**. In JSON mode, `payload` is
 * serialized as a single newline-terminated JSON line. In human mode,
 * `payload` MUST be a string already formatted by the command's humanizer.
 */
export function data(payload: unknown): void {
  if (cfg.json) {
    process.stdout.write(JSON.stringify(payload) + '\n');
    return;
  }
  if (typeof payload !== 'string') {
    throw new Error(
      'output.data() in human mode requires a pre-formatted string. ' +
        'Commands must format their human-mode output before calling data().'
    );
  }
  process.stdout.write(payload + (payload.endsWith('\n') ? '' : '\n'));
}

/**
 * Decorative note on **stderr**. Suppressed in JSON mode and in non-TTY runs.
 * Use for hints, summaries, breadcrumbs that a human likes but a script
 * would discard.
 */
export function note(msg: string): void {
  if (cfg.json || !cfg.isTTY) return;
  process.stderr.write(msg + '\n');
}

/**
 * Success line on **stderr**. Suppressed in JSON mode. In non-TTY/NO_COLOR
 * runs the leading glyph is dropped but the message still prints (so a CI
 * log shows what happened).
 */
export function success(msg: string): void {
  if (cfg.json) return;
  const prefix = isInteractive() ? chalk.green('✓ ') : '';
  process.stderr.write(prefix + msg + '\n');
}

/**
 * Warning on **stderr**. Suppressed in JSON mode (a warning isn't structured
 * data; if it matters, surface it as a `data()` field instead).
 */
export function warn(msg: string): void {
  if (cfg.json) return;
  const prefix = isInteractive() ? chalk.yellow('! ') : 'warn: ';
  process.stderr.write(prefix + msg + '\n');
}

/**
 * Error.
 *
 * - **JSON mode**: emits `{"ok": false, "error": {"message", "code"}}` on
 *   **stdout** (yes, stdout — agents pipe stdout to jq; this is the standard
 *   convention used by gh/kubectl/aws CLIs).
 * - **Human mode**: emits `error: <msg>` on **stderr**.
 *
 * `code` is an optional machine-readable error code (e.g. `SKILL_NOT_FOUND`,
 * `NEEDS_TTY`). Document new codes in `docs/cli-reference.md`.
 */
export function error(msg: string, code?: string): void {
  if (cfg.json) {
    const envelope: { ok: false; error: { message: string; code?: string } } = {
      ok: false,
      error: { message: msg },
    };
    if (code) envelope.error.code = code;
    process.stdout.write(JSON.stringify(envelope) + '\n');
    return;
  }
  const prefix = isInteractive() ? chalk.red('error: ') : 'error: ';
  process.stderr.write(prefix + msg + '\n');
}

/** Test-only: reset internal state. Not exported in the public API surface. */
export function _resetForTests(): void {
  cfg = {
    json: false,
    isTTY: Boolean(process.stdout.isTTY),
    noColor: Boolean(process.env['NO_COLOR']),
  };
  chalkLevelInitialized = false;
}
