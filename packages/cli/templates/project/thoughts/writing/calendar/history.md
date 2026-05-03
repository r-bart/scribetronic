---
description: Append-only log of writing events. Updated by /write (drafted, ready) and /write-publish (published). /agenda only reads this file. Source of truth for the table format below — see /agenda for the full contract.
---

# History

| Date | Type | Slug | Status | Source |
|---|---|---|---|---|
<!-- entries appended here -->

## Field reference

- **Date** — `YYYY-MM-DD`. The date the event happened (today when the row was written).
- **Type** — one of the writing post types (long-form or short-form).
- **Slug** — kebab-case identifier of the post. Same slug as in the draft filename.
- **Status** — one of:
  - `drafted` — Phase 2 of `/write` produced a draft. (Currently emitted at Phase 6 only as `ready`.)
  - `ready` — `/write` Phase 6 completed; draft is edited + slop-checked.
  - `published` — `/write-publish` succeeded; the post is live in your blog target.
- **Source** — the slash command that wrote the row: `/write` or `/write-publish`.

## Notes

- This file is **append-only**. Do not edit or remove existing entries by hand.
- Multiple rows per slug are expected — one for each lifecycle event (e.g. one `ready`, then one `published`).
- Ownership: only `/write` writes `drafted`/`ready` rows. Only `/write-publish` writes `published` rows. `/agenda` never writes here.
