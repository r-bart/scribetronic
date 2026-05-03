import { existsSync, mkdirSync, copyFileSync, statSync } from 'node:fs';
import { dirname, join, relative, basename } from 'node:path';
import { glob } from 'glob';

export interface CopyResult {
  copied: string[];
  skipped: string[];
}

/**
 * Recursively copies files from `sourceDir` into `destDir`, preserving the
 * directory structure. Skips destination files that already exist.
 *
 * Rename rule: any file ending in `.example.yaml` is written without the
 * `.example` infix at the destination (e.g. `rules.example.yaml` → `rules.yaml`).
 *
 * @returns paths (relative to destDir) of copied and skipped files.
 */
export async function copyTemplates(
  sourceDir: string,
  destDir: string
): Promise<CopyResult> {
  const copied: string[] = [];
  const skipped: string[] = [];

  if (!existsSync(sourceDir)) {
    return { copied, skipped };
  }

  // Use glob with dot:true so we capture files in dot-folders (.claude/, etc.)
  const matches = await glob('**/*', {
    cwd: sourceDir,
    dot: true,
    nodir: true,
    absolute: false,
  });

  for (const relPath of matches) {
    const sourcePath = join(sourceDir, relPath);

    // Defensive: ensure source still exists and is a file
    if (!existsSync(sourcePath) || !statSync(sourcePath).isFile()) {
      continue;
    }

    const destRelPath = transformDestPath(relPath);
    const destPath = join(destDir, destRelPath);

    if (existsSync(destPath)) {
      skipped.push(destRelPath);
      continue;
    }

    mkdirSync(dirname(destPath), { recursive: true });
    copyFileSync(sourcePath, destPath);
    copied.push(destRelPath);
  }

  return { copied, skipped };
}

/**
 * Applies rename rules to a relative path:
 * - `*.example.yaml` → `*.yaml`
 */
export function transformDestPath(relPath: string): string {
  const dir = dirname(relPath);
  const name = basename(relPath);

  if (name.endsWith('.example.yaml')) {
    const renamed = name.replace(/\.example\.yaml$/, '.yaml');
    return dir === '.' ? renamed : join(dir, renamed);
  }

  return relPath;
}

/**
 * Resolves a path relative to a base path. Re-exported for test convenience.
 */
export function relPath(from: string, to: string): string {
  return relative(from, to);
}
