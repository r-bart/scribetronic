# Plugin Mode

Since v0.2.0 scribetronic ships its skills via a Claude Code **plugin marketplace**. The CLI handles project scaffolding (calendar, ideas, publish-config, settings); skills, hooks, and agents are loaded by Claude Code at runtime from a separate repo: [`r-bart/scribetronic-plugin`](https://github.com/r-bart/scribetronic-plugin).

This document explains the architecture, what gets written where, and how to migrate from v0.1.x.

---

## Why a plugin

Plugins give scribetronic three things the bundled-skills approach can't:

- **Auto-update.** Bump the plugin repo's `plugin.json:version` and every install picks it up the next time Claude Code starts. No `init` re-run.
- **Namespacing.** Skills load as `/scribetronic:write`, `/scribetronic:agenda`, etc. Avoids collisions with other tools or your own `/write`.
- **Workflow hooks.** SessionStart and Stop hooks ship with the plugin and run automatically — no per-project configuration.

The CLI still owns everything that has to live *in your project* (calendar templates, publish config, drafts) — those can't be served from a remote plugin.

---

## How it works

```
npx scribetronic init .
       │
       ▼
  .claude/settings.json
  ┌────────────────────────────────────────────┐
  │ extraKnownMarketplaces: {                  │
  │   "scribetronic": {                        │
  │     source: { source: "github",            │
  │               repo: "r-bart/               │
  │                      scribetronic-plugin"} │
  │   }                                        │
  │ }                                          │
  │ enabledPlugins: {                          │
  │   "scribetronic@scribetronic": true        │
  │ }                                          │
  └────────────────────────────────────────────┘
       │
       ▼
  Claude Code at startup:
  1. Reads .claude/settings.json
  2. Clones r-bart/scribetronic-plugin (cached)
  3. Reads marketplace.json → finds plugin "scribetronic"
  4. Reads plugin.json → checks version
  5. Loads skills/ + hooks/
  6. Skills available as /scribetronic:write, /scribetronic:agenda, ...
```

---

## What lives where

### In your project (written by the CLI)

```
your-project/
├── .claude/
│   └── settings.json                       # marketplace registration
└── scribetronic/
    ├── README.md
    ├── publish-config.yaml                 # renamed from .example.yaml
    ├── calendar/
    │   ├── README.md
    │   ├── index.md
    │   ├── rules.yaml                      # renamed from .example.yaml
    │   ├── history.md
    │   └── archive/.gitkeep
    └── ideas/
        ├── README.md
        └── <14 type files>.md
```

No `SKILL.md` files in your project — those live in the marketplace repo and load at runtime.

### In the plugin marketplace ([r-bart/scribetronic-plugin](https://github.com/r-bart/scribetronic-plugin))

```
.claude-plugin/marketplace.json             # marketplace descriptor
plugins/scribetronic/
├── .claude-plugin/plugin.json              # plugin metadata + version
├── skills/                                 # 22 SKILL.md files
└── hooks/hooks.json                        # SessionStart + Stop hooks
```

---

## Hooks

Two hooks ship with the plugin and run automatically. Both stay silent in non-scribetronic projects, so the plugin is safe to enable globally.

| Hook | Trigger | What it does |
|---|---|---|
| `SessionStart` | Claude Code session opens | If `scribetronic/calendar/<ISO-week>/plan.md` exists, prints today's resolved slot in 1–2 lines. Suggests `/scribetronic:agenda plan-week` if the week is missing. |
| `Stop` | Claude Code session ends | If drafts under `scribetronic/calendar/*/drafts/` were touched in this session, reminds about `/editing-pass` + `/ai-slop-check` before marking `status: ready`. |

Both use the Haiku model (cheap, fast) and exit silently when irrelevant.

---

## CLI commands for the plugin

| Command | Purpose |
|---|---|
| `scribetronic init [path]` | Scaffolds project templates **and** registers the marketplace in `.claude/settings.json`. |
| `scribetronic update [path]` | Re-applies the marketplace registration. Use after a fresh `git clone` of a scribetronic project, after upgrading the CLI globally, or if `settings.json` drifted. |
| `scribetronic doctor [path]` | Verifies the install end-to-end. Checks: `scribetronic/` exists, `calendar/` exists, `publish-config.yaml` is present, plugin is enabled in settings, marketplace points at the canonical repo, `writing-style/SKILL.md` is seeded. Exits 1 on failure. |
| `scribetronic uninstall [path]` | Disables the plugin and removes the marketplace entry. Leaves `scribetronic/` content (drafts, calendar, history) intact — those are yours. |

---

## Direct install (without the CLI)

If you only want the skills and don't need scribetronic's calendar templates, install the plugin directly inside Claude Code:

```
/plugin marketplace add r-bart/scribetronic-plugin
/plugin install scribetronic@scribetronic
```

This is what the CLI does for you under the hood. Without the CLI, you won't get `scribetronic/calendar/`, `publish-config.yaml`, or the editorial scaffolding — but every skill (`/scribetronic:writing-style`, `/scribetronic:editing-pass`, `/scribetronic:ai-slop-check`, etc.) will still work standalone.

---

## Migration from v0.1.x

```bash
# 1. Update the CLI
npm install -g scribetronic@latest

# 2. Register the marketplace in your existing project
cd your-writing-project
npx scribetronic update

# 3. Remove the old bundled skill copies (they're now duplicated by the marketplace)
rm -rf .claude/skills/agenda .claude/skills/write .claude/skills/write-publish \
       .claude/skills/long-form-* .claude/skills/short-form-* \
       .claude/skills/writing-style .claude/skills/editing-pass \
       .claude/skills/ai-slop-check .claude/skills/style-extract \
       .claude/skills/style-refine

# 4. Restart Claude Code
# Skills now load as /scribetronic:write, /scribetronic:agenda, etc.

# 5. Verify
npx scribetronic doctor
```

Your `scribetronic/` directory (drafts, calendar, history, publish-config) is untouched throughout.

---

## Versioning

The plugin repo's `plugin.json:version` tracks the CLI's `package.json:version` lockstep. Both repos get the same `vX.Y.Z` tag at release time. If they ever drift, `scribetronic doctor` will not detect it (only Claude Code's `/plugin update scribetronic` shows the installed plugin version) — open an issue if you spot a mismatch.

## Cache and updates

Claude Code caches the marketplace clone under `~/.claude/plugins/cache/`. To force a refresh:

```
/plugin marketplace update scribetronic
/plugin update scribetronic
```

This pulls the latest commit on the plugin repo's default branch.
