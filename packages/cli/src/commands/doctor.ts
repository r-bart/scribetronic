import { existsSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import chalk from 'chalk';
import { MARKETPLACE_NAME, PLUGIN_KEY, PLUGIN_NAME } from '../data/plugin.js';
import { isPluginRegistered, readClaudeSettings } from '../utils/settings.js';

export interface DoctorOptions {
  path?: string;
}

interface Check {
  label: string;
  ok: boolean;
  detail?: string;
}

/**
 * Health check for a scribetronic installation. Verifies the project skeleton,
 * publish config, plugin registration, and writing-style seed.
 *
 * Exit codes:
 *   0 — all checks pass
 *   1 — at least one check failed
 */
export async function doctorCommand(options: DoctorOptions): Promise<void> {
  const targetDir = resolve(options.path ?? process.cwd());
  const checks: Check[] = [];

  // 1. scribetronic/ exists
  const scribetronicDir = join(targetDir, 'scribetronic');
  checks.push({
    label: 'scribetronic/ directory',
    ok: existsSync(scribetronicDir) && statSync(scribetronicDir).isDirectory(),
    detail: scribetronicDir,
  });

  // 2. calendar/ exists
  const calendarDir = join(scribetronicDir, 'calendar');
  checks.push({
    label: 'scribetronic/calendar/ directory',
    ok: existsSync(calendarDir) && statSync(calendarDir).isDirectory(),
    detail: calendarDir,
  });

  // 3. publish-config.yaml present
  const publishConfig = join(scribetronicDir, 'publish-config.yaml');
  checks.push({
    label: 'scribetronic/publish-config.yaml',
    ok: existsSync(publishConfig),
    detail: existsSync(publishConfig)
      ? publishConfig
      : 'missing — re-run `scribetronic init` to scaffold it',
  });

  // 4. .claude/settings.json registers the plugin
  const settings = readClaudeSettings(targetDir);
  const pluginRegistered = isPluginRegistered(targetDir, PLUGIN_NAME, MARKETPLACE_NAME);
  checks.push({
    label: `${PLUGIN_KEY} enabled in .claude/settings.json`,
    ok: pluginRegistered,
    detail: pluginRegistered
      ? 'enabled'
      : 'not registered — run `scribetronic update` (or `scribetronic init`)',
  });

  // 5. Marketplace source matches expected repo
  const expectedRepo = settings.extraKnownMarketplaces?.[MARKETPLACE_NAME]?.source.repo;
  checks.push({
    label: `marketplace source resolves to r-bart/scribetronic-plugin`,
    ok: expectedRepo === 'r-bart/scribetronic-plugin',
    detail: expectedRepo ? `current: ${expectedRepo}` : 'no marketplace entry',
  });

  // 6. scribetronic/style/writing-style.md seeded (user voice override)
  const writingStyle = join(scribetronicDir, 'style', 'writing-style.md');
  const writingStyleOk = existsSync(writingStyle);
  checks.push({
    label: 'scribetronic/style/writing-style.md seeded',
    ok: writingStyleOk,
    detail: writingStyleOk
      ? `present: ${writingStyle}`
      : 'missing — run `scribetronic style` to seed your voice from the template',
  });

  console.log();
  console.log(chalk.bold('scribetronic doctor'));
  console.log(chalk.dim(targetDir));
  console.log();

  let failed = 0;
  for (const c of checks) {
    const mark = c.ok ? chalk.green('✓') : chalk.red('✗');
    const line = `  ${mark} ${c.label}`;
    console.log(line);
    if (c.detail) console.log(`     ${chalk.dim(c.detail)}`);
    if (!c.ok) failed++;
  }

  console.log();
  if (failed === 0) {
    console.log(chalk.green(`all ${checks.length} checks passed`));
  } else {
    console.log(chalk.red(`${failed}/${checks.length} check(s) failed`));
    process.exit(1);
  }
}
