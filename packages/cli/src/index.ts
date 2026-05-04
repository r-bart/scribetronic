#!/usr/bin/env node

import { Command } from 'commander';
import { initCommand } from './commands/init.js';
import { styleCommand } from './commands/style.js';
import { listCommand } from './commands/list.js';
import { infoCommand } from './commands/info.js';
import { updateCommand } from './commands/update.js';
import { doctorCommand } from './commands/doctor.js';
import { uninstallCommand } from './commands/uninstall.js';

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
    await initCommand({ path });
  });

program
  .command('style')
  .description('Seed or edit writing-style/SKILL.md')
  .option('--reset', 'Overwrite the existing file with the seed template')
  .action(async (options: { reset?: boolean }) => {
    await styleCommand({ reset: options.reset });
  });

program
  .command('list')
  .description('List bundled skills (mirrors what the marketplace ships)')
  .action(async () => {
    await listCommand();
  });

program
  .command('info')
  .description("Show one skill's metadata")
  .argument('<skill>', 'Skill name (folder name under .claude/skills/)')
  .action(async (skill: string) => {
    await infoCommand(skill);
  });

program
  .command('update')
  .description('Refresh the plugin marketplace registration in .claude/settings.json')
  .argument('[path]', 'Target directory (default: current directory)')
  .action(async (path: string | undefined) => {
    await updateCommand({ path });
  });

program
  .command('doctor')
  .description('Verify the scribetronic install (project skeleton + plugin registration)')
  .argument('[path]', 'Target directory (default: current directory)')
  .action(async (path: string | undefined) => {
    await doctorCommand({ path });
  });

program
  .command('uninstall')
  .description('Disable the scribetronic plugin (leaves your scribetronic/ content intact)')
  .argument('[path]', 'Target directory (default: current directory)')
  .action(async (path: string | undefined) => {
    await uninstallCommand({ path });
  });

program.parseAsync().catch((err) => {
  console.error(`\nError: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
