import { existsSync } from 'node:fs';
import { join } from 'node:path';

export interface ProjectAnalysis {
  /** True if the project already has scribetronic-installed skills/templates. */
  hasScribetronic: boolean;
  /** True if any `.claude/skills/<name>/SKILL.md` exists at all. */
  hasClaudeSkills: boolean;
  /** True if `thoughts/writing/` exists. */
  hasWritingDir: boolean;
}

/**
 * Inspects `targetDir` to detect whether scribetronic appears to be installed.
 * Heuristic: presence of any of the orchestrator skills (agenda, write,
 * write-publish) under `.claude/skills/` is a strong signal.
 */
export function analyzeProject(targetDir: string): ProjectAnalysis {
  const claudeSkillsDir = join(targetDir, '.claude', 'skills');
  const writingDir = join(targetDir, 'thoughts', 'writing');

  const hasClaudeSkills = existsSync(claudeSkillsDir);
  const hasWritingDir = existsSync(writingDir);

  const orchestrators = ['agenda', 'write', 'write-publish'];
  const hasAnyOrchestrator = orchestrators.some((name) =>
    existsSync(join(claudeSkillsDir, name, 'SKILL.md'))
  );

  return {
    hasScribetronic: hasAnyOrchestrator && hasWritingDir,
    hasClaudeSkills,
    hasWritingDir,
  };
}
