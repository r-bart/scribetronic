# Recommended Skills

Scribetronic ships 21 writing-pipeline skills. These pair well with it for a fuller Claude Code workflow.

## Engineering workflow — devtronic

[`r-bart/devtronic`](https://github.com/r-bart/devtronic) provides the engineering counterpart: spec, plan, execute, review. Scribetronic borrows its repo shape and conventions.

If you also do code, install both. The two plugins do not overlap: scribetronic owns `thoughts/writing/`, devtronic owns `thoughts/{plans,specs,notes}/` and engineering skills (`/create-plan`, `/execute-plan`, `/post-review`, `/spec`, etc.).

## Claude Code built-ins

Scribetronic skills assume the standard Claude Code surface is available:

- `/review` — GitHub PR review
- `/help`, `/clear`, `/cost`
- TaskCreate / TaskList / TaskUpdate for subagent coordination

No installation needed; these come with Claude Code itself.

## Companion skills you might write

Things scribetronic intentionally does NOT do, and that you might add as your own thin wrappers:

- **Image generation for hero / og:images** — scribetronic produces text only. Hook into your image stack of choice (DALL·E, Replicate, Figma) when `/write-publish` runs.
- **Social-network publishers** — `/write-publish` writes drafts to platform-specific files (`.x.md`, `.li.md`, `.threads.md`) and stops. Posting them is yours, via Buffer / Typefully / direct API.
- **Analytics callback** — once a piece is live, scribetronic does not look at views or clicks. Plug your own loop if you want to learn from performance.

## Out of scope

- General-purpose blogging engines. Scribetronic assumes Astro + Markdown content collections, but only the `publish-config.yaml` target is project-specific. Any static-site generator with a markdown ingestion path works.
- AI ghostwriting. Scribetronic structures the work and enforces a style; it does not replace the writer.
