# Writing skills

Flat catalog of writing skills for the scribetronic system. Each skill lives in its own folder with a single `SKILL.md`.

## Orchestrators

- **`/agenda`** (`agenda/`) — Manage writing cadence with per-ISO-week `plan.md`, recurring `rules.yaml`, and append-only `history.md`.
- **`/write`** (`write/`) — Master pipeline: seed → draft → edit → slop-check → optional repurpose. Routes via agenda or interview.
- **`/write-publish`** (`write-publish/`) — Move a `status: ready` draft to the Astro blog and archive social derivatives.

## Shared / Quality

- **`writing-style`** — User's voice base, shipped as a personalization template. Inherited by every type and quality skill.
- **`editing-pass`** — Read-and-revise pass. Tightens prose, kills filler, sharpens closer.
- **`ai-slop-check`** — Detection pass for AI-generated patterns and clichés. Last gate before publish.
- **`style-extract`** — Distil a reusable writing-style guide from 3-5 reference samples + 1-2 of your own.
- **`style-refine`** — Propose evidence-backed deltas to `writing-style/SKILL.md` from real (draft → published) edit history.
- **`review`** — Parallel multi-focus review (voice, structure, slop, hook, closer, optional factual). Spawns N subagents concurrently and aggregates findings into a severity-grouped report.

## Long-form types

- **`long-form-weekly-newsletter`** — Sunday parent piece. ~600-1200 words. Spawns 5-7 derivatives.
- **`long-form-monthly-devlog`** — Reflective monthly recap with through-line. ~1200-2000 words.
- **`long-form-hot-take`** — Contrarian opinion against conventional wisdom. ~800-1500 words.
- **`long-form-how-to`** — Actionable guide grounded in personal experience. ~1500-3500 words.
- **`long-form-launch-retro`** — Post-launch breakdown with honest numbers. ~800-1500 words.
- **`long-form-manifesto`** — Vision/strategy piece. ~1500-3000 words. Rare format.

## Short-form types

- **`short-form-voice-adjustments`** — Voice deltas for X / LinkedIn / Threads. Inherited by every short-form type.
- **`short-form-x-vs-y`** — Two things contrasted to reveal a non-obvious preference.
- **`short-form-listicle`** — Numbered list with a strong hook. 3-7 items.
- **`short-form-observation`** — Single noticed thing, stated clearly.
- **`short-form-motivational`** — Niche-anchored motivational post. Quota: 1-2/month.
- **`short-form-present-vs-future`** — Temporal contrast: now vs next.
- **`short-form-thread-from-longform`** — Repurposing engine. 1 long-form → 2-4 short-form pieces.
- **`short-form-carousel-li`** — LinkedIn carousel content (8-10 slides).

---

23 skills total. See [docs/skills.md](../../../../../../docs/skills.md) for detail.
