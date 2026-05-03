#!/usr/bin/env node

import { Command } from 'commander';
import { initCommand } from './commands/init.js';
import { styleCommand } from './commands/style.js';
import { listCommand } from './commands/list.js';
import { infoCommand } from './commands/info.js';

const program = new Command();

program
  .name('scribetronic')
  .description('Editorial calendar + weekly-newsletter pipeline for Claude Code')
  .version('0.1.0');

program
  .command('init')
  .description('Scaffold writing system into a project')
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
  .description('List bundled skills')
  .action(async () => {
    await listCommand();
  });

program
  .command('info')
  .description('Show one skill\'s metadata')
  .argument('<skill>', 'Skill name (folder name under .claude/skills/)')
  .action(async (skill: string) => {
    await infoCommand(skill);
  });

program.parseAsync().catch((err) => {
  console.error(`\nError: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
