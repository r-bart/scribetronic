# Code Quality Checks

Rules for working ON the scribetronic codebase itself. After implementing a feature or modifying existing code, **always run the following checks** before considering the task complete.

## Package Manager

scribetronic uses **npm** (lockfile: `package-lock.json`). All commands below assume npm.

If you ever see `pnpm-lock.yaml`, `yarn.lock`, or `bun.lockb` in this repo, something is wrong — investigate before running anything.

## Working Directory

The CLI lives in `packages/cli/`. All quality commands must be run from there:

```bash
cd packages/cli
```

## Required Validation Steps

### 1. Type Checking

```bash
npm run typecheck
```

- Must complete with **zero errors**.
- Do not silence errors with `any` or `// @ts-ignore`. If a type genuinely cannot be expressed, use `// @ts-expect-error` with a one-line justification immediately above.

### 2. Linting

```bash
npm run lint
```

- Must complete clean (zero warnings, zero errors).
- For intentionally unused destructured variables, prefix with `_`.

### 3. Tests

```bash
npm test
```

Runs vitest. All tests must pass. Tests live next to source under `__tests__/` and use the `.test.ts` suffix.

### 4. Build

```bash
npm run build
```

Runs tsup. Must produce a valid `dist/` directory with the CLI bundled and its bin entry intact.

## Order of Operations

```
1. typecheck  →  catches type errors early
2. lint       →  enforces code quality rules
3. test       →  verifies behavior
4. build      →  confirms the published artifact still works
```

## Quick Reference

```bash
# All checks in sequence (run from packages/cli/)
npm run typecheck && npm run lint && npm test && npm run build
```

## When to Skip

Only skip these checks if:

- The user explicitly says the change is WIP/draft.
- The user specifically asks to skip validation.

Otherwise, never report a task complete without running them.

## No `any` Without Justification

`any` is prohibited as a quick fix. If you must use it (e.g. interfacing with an untyped third-party module), add an `// @ts-expect-error` directive with a one-line explanation immediately above the offending line. PR reviewers should be able to grep for these and audit them.
