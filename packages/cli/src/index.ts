#!/usr/bin/env node

import { Command } from 'commander';
import { initCommand } from './commands/init.js';
import { styleCommand } from './commands/style.js';
import { listCommand } from './commands/list.js';
import { infoCommand } from './commands/info.js';
import { updateCommand } from './commands/update.js';
import { doctorCommand } from './commands/doctor.js';
import { uninstallCommand } from './commands/uninstall.js';
import { configure as configureOutput, error as outError } from './utils/output.js';
import { ExitCode } from './utils/exit.js';

const program = new Command();

program
  .name('scribetronic')
  .description('Editorial calendar + writing pipeline for Claude Code')
  .version('0.2.1');

program
  .command('init')
  .description('Scaffold writing system + register plugin marketplace')
  .argument('[path]', 'Target directory (default: current directory)')
  .action(async (path: string | undefined) => {
    configureOutput({ json: false });
    await initCommand({ path });
  });

program
  .command('style')
  .description('Seed or edit scribetronic/style/writing-style.md')
  .option('--reset', 'Overwrite the existing file with the seed template')
  .option(
    '--yes',
    'bypass confirm prompts (also: SCRIBETRONIC_YES=1) — required for --reset in non-interactive shells'
  )
  .action(async (options: { reset?: boolean; yes?: boolean }) => {
    configureOutput({ json: false });
    await styleCommand({ reset: options.reset, yes: options.yes });
  });

program
  .command('list')
  .description('List bundled skills (mirrors what the marketplace ships)')
  .option('--json', 'machine-readable output (single JSON line on stdout)')
  .action(async (options: { json?: boolean }) => {
    configureOutput({ json: !!options.json });
    await listCommand({ json: options.json });
  });

program
  .command('info')
  .description("Show one skill's metadata")
  .argument('<skill>', 'Skill name (folder name under .claude/skills/)')
  .option('--json', 'machine-readable output (single JSON line on stdout)')
  .action(async (skill: string, options: { json?: boolean }) => {
    configureOutput({ json: !!options.json });
    await infoCommand(skill, { json: options.json });
  });

program
  .command('update')
  .description('Refresh the plugin marketplace registration in .claude/settings.json')
  .argument('[path]', 'Target directory (default: current directory)')
  .action(async (path: string | undefined) => {
    configureOutput({ json: false });
    await updateCommand({ path });
  });

program
  .command('doctor')
  .description('Verify the scribetronic install (project skeleton + plugin registration)')
  .argument('[path]', 'Target directory (default: current directory)')
  .option('--json', 'machine-readable output (single JSON line on stdout)')
  .action(async (path: string | undefined, options: { json?: boolean }) => {
    configureOutput({ json: !!options.json });
    await doctorCommand({ path, json: options.json });
  });

program
  .command('uninstall')
  .description('Disable the scribetronic plugin (leaves your scribetronic/ content intact)')
  .argument('[path]', 'Target directory (default: current directory)')
  .action(async (path: string | undefined) => {
    configureOutput({ json: false });
    await uninstallCommand({ path });
  });

program.addHelpText(
  'after',
  `
Examples for agents:
  scribetronic list --json
  scribetronic info agenda --json
  scribetronic doctor /path/to/project --json
  scribetronic style --reset --yes        # also: SCRIBETRONIC_YES=1
  NO_COLOR=1 scribetronic init .

Exit codes:
  0  success
  1  unexpected error (uncaught throw, internal bug)
  2  usage error (bad arguments, missing path, unknown skill)
  3  state error (plugin not registered, doctor checks failed)

JSON output (read-only commands only — list, info, doctor):
  - One newline-terminated JSON line on stdout
  - All chrome (progress, hints) suppressed
  - Errors emitted as {"ok": false, "error": {"message", "code"}} on stdout
`
);

program.parseAsync().catch((err) => {
  outError(err instanceof Error ? err.message : String(err));
  process.exit(ExitCode.Unexpected);
});
