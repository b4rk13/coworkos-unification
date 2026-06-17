# CoworkOS Unification — Build Spec

*Status: spec — ready for build (2026-06-16) · Owner: David*
*Architecture (source of truth): [`design/architecture.md`](./architecture.md) — Approach B: shared tree, lane-as-tag*
*Tracking: pad PLAN-137 (command-center, project: general) · Feeds Phase-3 build tasks TASK-140 through TASK-148, plus memory tasks TASK-167 (primary) / TASK-143 / TASK-169*
*Memory section revised 2026-06-17: lane now spans three stores (typed-curated primary + per-surface auto-memory children), so the system works in both Cowork and Claude Code.*

---

## How to use this spec

This is the build-ready companion to `architecture.md`. The architecture doc says *what* we
decided and *why*; this doc says *exactly what to create, where, and with what contents* so each
Phase-3 build task can run cold from its own section without re-deriving anything.

Every section below maps to one build task and carries its TASK ref in the heading. Paths are
absolute from the repo root `C:\Users\david\OneDrive\Documents\CoworkOS-Home\` (written as
`./` here). All YAML, file skeletons, and rule text are copy-ready — no `[TBD]` left to resolve.

**Section index**
- [TASK-140 — Build the shared-context tree](#task-140--build-the-shared-context-tree)
- [TASK-141 — Apply lane blocks + classify all projects](#task-141--apply-lane-blocks--classify-all-projects)
- [TASK-142 — Update root config (outputs split, voice-work, routing)](#task-142--update-root-config-outputs-split-voice-work-routing)
- [TASK-167 — Lane-map the typed curated memory (primary)](#task-167--lane-map-the-typed-curated-memory-primary)
- [TASK-143 — Lane-tag the Claude Code session auto-memory (child of 167)](#task-143--lane-tag-the-claude-code-session-auto-memory-child-of-167)
- [TASK-169 — Lane-tag the Cowork space auto-memory (child of 167)](#task-169--lane-tag-the-cowork-space-auto-memory-child-of-167)
- [TASK-144 — Create Work pad workspace + wire pad-workspace routing](#task-144--create-work-pad-workspace--wire-pad-workspace-routing)
- [TASK-147 — Define + apply standard project scaffold](#task-147--define--apply-standard-project-scaffold)
- [TASK-148 — Retire workstations → projects + domain skills](#task-148--retire-workstations--projects--domain-skills)

---

## TASK-140 — Build the shared-context tree

**Goal:** Stand up the attachable `shared-context/` tree (John Wishon's model) so projects pull
named context folders instead of loading a monolithic resources workstation.

### Folders to create

Starting from the current state (`shared-context/` contains only `family-context.md`), create:

```
shared-context/
├── _universal/
│   ├── CLAUDE.md                # base layer every project loads (full content below)
│   └── project-template/        # created by TASK-147 — leave the dir, that task fills it
├── work/
│   ├── adt/
│   │   └── index.md
│   └── servicenow/
│       └── index.md
└── home/
    ├── family/
    │   ├── family-context.md     # MOVED from shared-context/family-context.md
    │   └── index.md
    ├── medical/
    │   └── index.md
    └── travel/
        └── index.md
```

### Exact steps

1. Create the directory tree above (empty dirs are fine where a task downstream fills them).
2. **Move** `./shared-context/family-context.md` → `./shared-context/home/family/family-context.md`.
   Use a move (preserve history/content), not a copy-then-delete that loses the original.
3. Write `./shared-context/_universal/CLAUDE.md` with the content in the next subsection.
4. Add an `index.md` to each domain folder (`work/adt`, `work/servicenow`, `home/family`,
   `home/medical`, `home/travel`) using the index format below. Domain folders start with just an
   `index.md`; atomic knowledge files get added as content lands (empty scaffolding not required).

### Content of `shared-context/_universal/CLAUDE.md`

This is the base layer **every** connected project loads on top of its own `CLAUDE.md`. Keep it
lean — universal conventions only, nothing lane-specific (lane-specific behavior comes from the
project's own header).

```markdown
# Universal Base Layer

Every CoworkOS project loads this file on top of its own CLAUDE.md. It holds the conventions
that are true regardless of lane. Each project header declares only its **lane** (plus `skills:`
and `attach:`); voice, pad board, and outputs are **derived from `lane`** by the rule below — not
hand-declared.

## Lane → behavior (derive before acting)

1. Read the current project's CLAUDE.md lane-declaration block (the YAML frontmatter at the top) —
   it declares `lane`, `skills:`, and `attach:`.
2. Derive these from `lane` (each can be **overridden** by an explicit field in the header):
   - **voice:** `work` → `00-resources/voice-work.md`; `home`/`shared` → `00-resources/voice-principles.md`.
   - **pad board:** `work` → `work`; `home`/`shared` → `command-center`. Call `pad_set_workspace`
     to it before creating any pad item.
   - **outputs:** `work` → `outputs/work/<slug>`; `home`/`shared` → `outputs/home/<slug>`, where
     `<slug>` = the folder name lowercased, spaces/underscores → hyphens.
3. Treat the project's `attach:` paths as additional context for the session.
4. Invoke any persona skills named in `skills:`.
5. **Overrides win:** if the header carries an explicit `voice:`, `pad-workspace:`, or `outputs:`,
   use that instead of the derived value.

If you are in a root/non-project Cowork chat with no project header, use the root CLAUDE.md
routing table to pick a lane, then default to the home voice until a project is in scope.

## Memory system

- The shared brain is the typed curated `memory/` files (`user.md` / `feedback.md` /
  `projects.md` / `reference.md`). Read all four at session start; let them inform your work
  without announcing it. (There is no monolithic root `MEMORY.md` — the typed files are the
  authoritative layer both surfaces read.)
- Two axes per entry: a **type** (user / feedback / project / reference) and a **lane**
  (`[work]` / `[home]` / `[shared]`). In the typed files lane is an **inline tag per entry**; each
  surface's own auto-memory store (Cowork's space store; Claude Code's per-folder store) carries the
  same lane in its native frontmatter. Types stay primary; lane is the orthogonal second axis.
- **Recall:** prefer Shared entries plus the active lane's, and de-prioritize the other lane.
- **Write:** when David says "remember this," write it immediately to the right typed file, stamp
  the entry's `[lane]` tag, and confirm.

## Writing

- Before producing any written content, read the voice file named by the active lane.
- Professional but conversational. If it reads like a corporate memo, rewrite it.
- Concise by default (under ~300 words) unless more detail is requested.
- One strong recommendation, not three options, unless alternatives are explicitly requested.

## Task tracking

- Actionable work lives on pad, not scattered in notes. Add tasks via the `/pad` skill.
- New tasks start in `backlog`, assigned to Claude by default, with `project` and `priority` set.
- Tasks assigned to Claude need a self-actionable body: Objective + Acceptance criteria + links.

## Project shape

- Every project follows the standard scaffold (spine: CLAUDE.md, README.md, status.md, memory.md,
  wrap-up.md, docs/index.md, docs/{requirements,architecture,plans}). Template lives at
  `shared-context/_universal/project-template/`.
```

### `index.md` format (retrieval index for each domain folder)

Each domain folder's `index.md` is a retrieval map: it tells a session what's in the folder and
when to read each file, so the agent can pull the one atomic file it needs instead of the whole
folder. Format:

```markdown
# <Domain> — Context Index

*Lane: <work|home> · Attach via: `shared-context/<lane>/<domain>`*

One-line description of what this domain covers and who/what it's about.

## Files

| File | Read when... |
|---|---|
| family-context.md | You need household details — names, roles, schedules, preferences. |
| <atomic-file>.md | <specific trigger condition that should make a session open this file> |

## Conventions
- Keep each file atomic (one subject). Add a row here whenever you add a file.
```

Seed each `index.md` with the header + an empty/seeded Files table. For `home/family/index.md`,
include the `family-context.md` row shown above. For `work/adt`, `work/servicenow`,
`home/medical`, `home/travel`, the table starts with just the header row plus a comment line
`<!-- add rows as atomic files land -->`.

**Acceptance:** all folders exist; `family-context.md` lives under `home/family/`;
`_universal/CLAUDE.md` matches above; every domain folder has an `index.md` in the specified format.

---

## TASK-141 — Apply lane blocks + classify all projects

**Goal:** Every active project's `CLAUDE.md` opens with a lane-declaration block, and the
classification matches the locked table.

### Canonical lane-declaration block (template)

Prepend this YAML frontmatter to each project's `CLAUDE.md` (above the existing `# <Project>`
heading). Fill the fields per the project's row in the table below.

```yaml
---
lane: work                      # work | home | shared  — the only declared lane field
skills:                         # persona/expertise skills to adopt at session start
  - sn-spm-architect            # use `skills: []` if none
attach:                         # shared-context folders this project pulls
  - shared-context/_universal
  - shared-context/work/servicenow
---

@../../shared-context/_universal/CLAUDE.md

> **Base layer:** before acting, read `shared-context/_universal/CLAUDE.md` and follow it on top of
> this file.

# <Project>
```

The header declares only `lane`, `skills`, and `attach`. **`voice`, `pad-workspace`, and `outputs`
are derived from `lane`** (by the rule in `_universal/CLAUDE.md`) and are **not** written into the
header — normalizing to one source so they can't drift across 14 files. The `@import` line + the
prose "Base layer" note go **immediately after the frontmatter, above the `# <Project>` heading** —
they are how the project actually loads the universal base layer (see TASK-147's "Base-layer load —
why both lines"). Every project gets both lines.

**Field rules**
- `lane` — from the table; the single declared hygiene field. `voice` / `pad-workspace` / `outputs`
  **derive** from it (work → `voice-work.md` / `work` board / `outputs/work/<slug>`; home & shared →
  `voice-principles.md` / `command-center` / `outputs/home/<slug>`). `<slug>` = folder name
  lowercased, spaces/underscores → hyphens. Do **not** put these three in the header.
- **Override (rare):** add an explicit `voice:`, `pad-workspace:`, or `outputs:` line *only* to
  deviate from the derived value — e.g. `Capacity Managment`, whose folder name is misspelled, sets
  `outputs: outputs/work/capacity-management` so the deliverable path reads correctly. Everything
  else derives.
- `skills` — only the personas listed in the table (today: `sn-spm-architect` for the two
  ServiceNow SPM projects). Everything else → `skills: []`.
- `attach` — always include `shared-context/_universal`. Add the domain folders the project needs
  (see the table).
- **base-layer load:** after the frontmatter, add the `@../../shared-context/_universal/CLAUDE.md`
  import line **and** the prose "Base layer" instruction (above). The prose line is the
  cross-surface guarantee; the import is the Claude Code convenience. Adjust `../../` if the project
  isn't at `projects/<name>/` depth. Keep it relative (the repo git-syncs to non-Windows machines);
  never put the import inside a code fence (fenced imports aren't evaluated).

**Verify once before applying to all 14 (build note).** Drop the `@import` line into a single
project's `CLAUDE.md`, start a Claude Code session in that project, and run `/memory` to confirm the
`_universal` base layer is included **without a trust prompt** (imports are content-inclusion, not
directory access, so it should load clean). Only after that passes, roll the import line across the
remaining projects. The prose "Base layer" line can go in immediately — it has no such dependency.

### Standing instruction wording (goes in root CLAUDE.md, applied by TASK-142)

Add this rule so every session honors the header:

> **Before acting in a project, read its lane-declaration header (the YAML block at the top of the
> project's CLAUDE.md). Derive voice, pad workspace, and outputs from its `lane` (call
> `pad_set_workspace` to the derived board before creating any pad item), honoring any explicit
> `voice:` / `pad-workspace:` / `outputs:` override; invoke the skills it lists; treat its `attach:`
> paths as the session's context; and write deliverables to the derived (or overridden) outputs path.**

### Per-project classification + headers

Apply to these active project folders under `./projects/`. Each header carries only `lane`, `skills`,
and `attach` — **voice / pad-workspace / outputs are derived from `lane`** (see field rules); the
last column lists the rare overrides. Note `Capacity Managment`, `Knowledge Presentation`, and
`Work Email Triage` keep their existing (mis)spelled/spaced folder names — do not rename folders in
this task; just add headers.

| Project folder | lane | skills | attach (beyond `_universal`) | override (only if non-derived) |
|---|---|---|---|---|
| Capacity Managment | work | `sn-spm-architect` | `shared-context/work/servicenow`, `shared-context/work/adt` | `outputs: outputs/work/capacity-management` (fix folder misspelling) |
| nowaikit | work | `sn-spm-architect` | `shared-context/work/servicenow` | — |
| Work Email Triage | work | — | `shared-context/work/adt` | — |
| Knowledge Presentation | work | — | `shared-context/work/adt` | — |
| onedrive-sync | work | — | — | — |
| cancer-treatment | home | — | `shared-context/home/medical`, `shared-context/home/family` | — |
| treatment-collab-suite | home | — | `shared-context/home/medical`, `shared-context/home/family` | — |
| estate-claudeen-barkhausen | home | — | `shared-context/home/family` | — |
| home-lab | home | — | — | — |
| Network_Segregation | home | — | — | — |
| personal-knowledge-brain | home | — | — | — |
| worst-case-scenario | home | — | `shared-context/home/family` | — |
| helimath | home | — | — | — |
| coworkos-unification | shared | — | `shared-context/_universal` | — |

Derived for reference: every `work` row → `voice-work.md` / `work` board / `outputs/work/<slug>`;
every `home`/`shared` row → `voice-principles.md` / `command-center` / `outputs/home/<slug>`.

**Example — `projects/nowaikit/CLAUDE.md` header (concrete):**

```markdown
---
lane: work
skills:
  - sn-spm-architect
attach:
  - shared-context/_universal
  - shared-context/work/servicenow
---

@../../shared-context/_universal/CLAUDE.md

> **Base layer:** before acting, read `shared-context/_universal/CLAUDE.md` and follow it on top of
> this file.

# nowaikit
```
*(voice `work`, board `work`, outputs `outputs/work/nowaikit` derive from `lane: work` — not declared.)*

**Example — `projects/cancer-treatment/CLAUDE.md` header (concrete):**

```markdown
---
lane: home
skills: []
attach:
  - shared-context/_universal
  - shared-context/home/medical
  - shared-context/home/family
---

@../../shared-context/_universal/CLAUDE.md

> **Base layer:** before acting, read `shared-context/_universal/CLAUDE.md` and follow it on top of
> this file.

# cancer-treatment
```
*(voice `home`, board `command-center`, outputs `outputs/home/cancer-treatment` derive from `lane: home`.)*

**Archive:** ensure `Jira-ALM Data Sync` lives under `./projects/_archive/` (TASK-148 handles the
physical move if not already done); do not add a lane header to archived projects.

**Acceptance:** every active project listed has a valid lane block matching the table, **plus the
base-layer load** (the `@../../shared-context/_universal/CLAUDE.md` import line and the prose "Base
layer" instruction) immediately after the frontmatter; no active project is missing either; archived
project has none.

---

## TASK-142 — Update root config (outputs split, voice-work, routing)

**Goal:** The root `00-resources/`, `outputs/`, and root `CLAUDE.md` reflect the lane model.

### 142a — Outputs split

Create the lane-split outputs tree:

```
outputs/
├── work/      # outputs/work/<project-slug>/
└── home/      # outputs/home/<project-slug>/
```

Create `outputs/work/` and `outputs/home/`. Per-project subfolders are created lazily by their
`outputs:` field when a deliverable is first written — don't pre-create all 14. If a legacy flat
`outputs/<project>/` exists, move its contents to the lane-correct path from the TASK-141 table.

**New output rule** (add to root CLAUDE.md, "Rules" section):

> **Write every deliverable to the active project's outputs path — `outputs/<lane>/<slug>`,
> derived from its `lane` (or the explicit `outputs:` override if the header sets one). Never write
> deliverables to a project folder's root. Code projects may use a project-local `outputs/` only for
> build scratch / intermediate artifacts; final deliverables still go to the root lane path.**

### 142b — `voice-work.md`

Create `./00-resources/voice-work.md` — the professional work register for the ADT ServiceNow SPM
context. Outline:

```markdown
# Work Voice — ADT / ServiceNow SPM Register

*Load this voice when the active project's lane is `work` (derived; or an explicit `voice: work` override).*
*This layers on top of, and where they conflict overrides, voice-principles.md for work-lane work.*

## Context
You are writing inside ADT's ServiceNow Strategic Portfolio Management (SPM) program — capacity
management, demand/idea intake, PPM, resource and financial planning. Audience is ADT
stakeholders: platform owners, portfolio managers, PMO, and engineering leads.

## Register
- Professional and precise. Plain business English, not breezy and not stiff corporate-memo.
- Lead with the recommendation or decision, then the reasoning. Executives skim.
- Confident and specific: name the table, the workflow, the owner, the date. Avoid hedging.
- No emoji. No exclamation marks. Contractions are fine; slang is not.

## Terminology
- Use ServiceNow-correct terms: demand (`dmn_demand`), idea, project (`pm_project`), portfolio,
  resource plan, allocation, SPW (Strategic Planning Workspace), goal framework / OKRs.
- "ADT" not "the company." "Capacity management" not "cap mgmt" in written deliverables.
- Spell out an acronym on first use in any document meant for a mixed audience.

## Structure
- Short paragraphs; bullets for lists of items, prose for reasoning.
- Decisions/specs: state Objective, then Approach, then Acceptance criteria.
- Always make the next action and its owner explicit.

## What to avoid
- Marketing tone, filler ("in today's fast-paced world"), and false certainty.
- Burying the recommendation under background.
- Warm/personal register — that belongs to voice-principles.md (home lane).
```

### 142c — Root CLAUDE.md updates

Make these edits to `./CLAUDE.md`:

1. **Voice rule change.** Replace the standing "always read voice-principles.md before writing"
   instruction with:

   > **Before producing any written content, read the voice file for the active project's lane —
   > derived from `lane` (`work` → `00-resources/voice-work.md`; `home`/`shared` →
   > `00-resources/voice-principles.md`), or the explicit `voice:` override if the header sets one.
   > In a non-project root chat, default to `voice-principles.md` unless the routing table puts you
   > in the work lane.**

2. **Add the lane-header standing instruction** (the wording from TASK-141 "Standing instruction").

3. **Add the output rule** (from 142a above).

4. **Add the root Routing Map rows** (replace/extend the existing Routing Map table):

   | Folder / trigger | Route here when I... | Lane |
   |---|---|---|
   | `projects/<work project>` | ...work in any project whose header says `lane: work` | work |
   | `projects/<home project>` | ...work in any project whose header says `lane: home` | home |
   | ServiceNow / SPM / capacity / demand / ADT platform talk | ...ask anything about ServiceNow SPM or ADT capacity work | work |
   | Work email (Outlook) | ...need to triage or draft work mail | work |
   | Bridget care / medical / treatment | ...work on cancer-treatment, collab suite, or medical context | home |
   | Family / household / estate / travel | ...work on family, estate, or travel matters | home |
   | Personal email (Gmail) | ...need to triage or draft personal mail | home |
   | Home lab / network / Proxmox / UniFi | ...work on home-lab or network segregation | home |
   | (no project, ambiguous) | ...start a general chat with no clear lane | home (default) |

5. **Add the lane-detection rule** right under the routing table:

   > **Lane detection:** if a project is in scope, its lane header wins. Otherwise match the
   > request against the routing table above; if nothing matches, default to the home lane and
   > `voice-principles.md`. When the match is genuinely ambiguous, ask which lane before acting.

6. **Memory System section — defer to TASK-167.** The lane-aware read + write rules for root
   `CLAUDE.md`'s Memory System section are owned by **TASK-167** (the primary memory task), which
   lands right after 142 in the build order — do **not** rewrite that section here. This task only
   touches voice, routing, outputs, and the lane-header instruction.

**Acceptance:** `outputs/work` and `outputs/home` exist; `voice-work.md` matches the outline; root
CLAUDE.md has the new voice rule, lane-header instruction, output rule, routing table, and
lane-detection rule, with the old "always voice-principles" rule removed; the Memory System
section's lane rules are left to TASK-167.

---

## Memory — lane across three stores

The lane axis applies to **three** distinct memory stores, so the system works identically whether
David is in Cowork (the primary surface) or Claude Code (deep coding). The 4-tier types
(user / feedback / project / reference) are **unchanged** in all three — lane is an additive second
axis, not a merge. One **primary** task owns the authoritative, surface-neutral lane layer
(TASK-167); two **child** tasks enforce the same tag on each surface's private auto-memory
(TASK-143 for Claude Code, TASK-169 for Cowork).

> **Why three.** Both surfaces read the typed curated `memory/` files at session start (via root
> `CLAUDE.md`), so that layer is the real hygiene boundary — tag it and both surfaces inherit lane.
> But each surface *also* keeps a private auto-memory store it generates on its own: Claude Code's
> is hard-isolated per project folder path; Cowork's is space-scoped with **no** project wall. We
> tag both so neither can bleed, but neither is the boundary — the typed layer is.

---

## TASK-167 — Lane-map the typed curated memory (primary)

**Goal:** The OneDrive root typed curated memory files carry an inline lane tag per entry, the
nightly `memory-sync` stamps lane on everything it writes, and root + `_universal` CLAUDE.md honor
lane on read and write. This is the **first-class** lane layer both surfaces share.

**Scope:** `memory/user.md`, `memory/feedback.md`, `memory/projects.md`, `memory/reference.md`
(type-aggregated narrative prose, curated nightly by `memory-sync`). These are read at session
start by **both** Cowork and Claude Code, per root `CLAUDE.md`. Project-level
`projects/<name>/memory.md` files are already lane-scoped by their project's lane declaration and
need nothing.

### Lane tag format (inline, not frontmatter)

These files are prose with no per-fact frontmatter, so lane is an inline `[work]` / `[home]` /
`[shared]` tag appended to each entry (per bullet / line). Assign `home` by default; `work` when the
subject is clearly work (ServiceNow / ADT / capacity); `shared` when cross-cutting (the unification
initiative, pad mechanics, memory plumbing). Example entry in `reference.md`:

```markdown
| pad (project tracker) | Self-hosted on Proxmox LXC 104 … `command-center` workspace. | `[shared]`
```

…or, for prose-style entries, a trailing tag: `… runs Sunday 9am. [home]`

### memory-sync changes

Extend `memory/memory-sync.md` so the nightly job **stamps the lane** on every entry it adds or
edits (it already decides where each fact goes by type; it now also assigns the lane). Backfill lane
tags on all existing entries across the four files in the same pass.

### CLAUDE.md read + write rules

Add to **both** root `CLAUDE.md` (Memory System section) and `shared-context/_universal/CLAUDE.md`:

> Each typed memory entry carries a `[work]` / `[home]` / `[shared]` tag. **Read:** at session start
> load all four typed files, prefer the Shared entries plus the active lane's, and de-prioritize the
> other lane. **Write:** when "remember this" appends to a typed file, stamp the entry's lane tag.

**Sequencing:** do this after lane headers + `_universal/CLAUDE.md` exist (TASK-140/141) — don't
point sessions at a tag scheme before the files carry it.

### Encoding

Save all four files UTF-8 (no BOM); fix any existing smart-quote / em-dash mojibake while in there.
From PowerShell use `-Encoding utf8`.

**Acceptance:** all four typed files carry a lane tag on every entry; `memory-sync.md` stamps lane
on add/edit; root + `_universal` CLAUDE.md carry the read + write rules; files are clean UTF-8.

---

## TASK-143 — Lane-tag the Claude Code session auto-memory (child of 167)

**Goal:** Claude Code's own session auto-memory carries `lane` in frontmatter so a multi-lane coding
session can't bleed, and its index surfaces lane. *Implements TASK-167 on the Claude Code surface.*

**Scope:** the per-topic files (each with YAML frontmatter) + `MEMORY.md` index that **Claude Code**
maintains under `~/.claude/projects/<encoded-path>/memory/`. This store is **Claude Code only** and
already hard-isolated per project folder path — lane handles multi-lane sessions and shared facts
within it. It does **not** touch the typed curated `memory/` files (TASK-167) or the Cowork store
(TASK-169).

### Frontmatter field

Add a `lane:` key (`work | home | shared`) to each file's frontmatter, alongside the unchanged
`type`. Default `home` unless the subject is clearly work (ServiceNow / ADT / capacity) → `work`, or
cross-cutting → `shared`.

Before:
```markdown
---
type: project
title: CoworkOS Unification initiative
updated: 2026-06-16
---
```

After:
```markdown
---
type: project
lane: shared
title: CoworkOS Unification initiative
updated: 2026-06-16
---
```

### MEMORY.md surfacing

Keep the index's type-first organization; append a `` `[lane]` `` tag to each index line (optionally
sub-group `### Shared` / `### Work` / `### Home` within a type). Example:

```markdown
- [coworkos-unification](coworkos-unification.md) `[shared]` — merging work+home into one
  lane-segregated root (Approach B); design signed off, tracked in pad PLAN-137.
```

### Recall rule + encoding

Recall: load shared + the active lane, de-prioritize the other (folder-path isolation already
separates projects). The shared read/write rule from TASK-167's `_universal/CLAUDE.md` covers this
surface too. While editing, fix any SessionStart charmap / mojibake warnings; save UTF-8, no BOM.

**Acceptance:** every Claude Code session-auto-memory file has a valid `lane:` in frontmatter; types
untouched; that store's `MEMORY.md` shows lane per entry; no SessionStart encoding warnings remain.

---

## TASK-169 — Lane-tag the Cowork space auto-memory (child of 167)

**Goal:** Cowork's own space-scoped auto-memory carries `lane` and recall honors it — closing the
biggest bleed gap, since Cowork is the primary surface yet its store has **no** automatic lane wall.
*Implements TASK-167 on the Cowork surface.*

**Scope:** the per-fact `.md` files + `MEMORY.md` index Cowork maintains in its space-scoped store
(e.g. `…/spaces/<space-id>/memory/`). This store is **Cowork only** and is scoped to the Cowork
space, **not** isolated per project — so unlike Claude Code there is no folder-path wall; the lane
tag is the only separation.

### Frontmatter field (Cowork's native schema)

Cowork auto-memory files use frontmatter with `name`, `description`, and a nested `metadata` block
that already holds `type`. Add `lane` **under `metadata`**, alongside `type`:

```markdown
---
name: pad-workspace-routing
description: Which pad board each lane targets and when to call pad_set_workspace.
metadata:
  type: reference
  lane: shared
---
```

Same default rule: `home` unless clearly work → `work`, or cross-cutting → `shared`.

### MEMORY.md surfacing + recall

Append a `` `[lane]` `` tag to each `MEMORY.md` index line (same format as TASK-143). Recall on this
surface is relevance-surfaced (description-ranked, shown in system-reminders), not folder-isolated,
so the lane preference must be an explicit instruction: the TASK-167 read rule in `_universal` /
root CLAUDE.md ("prefer shared + the active lane") governs Cowork recall.

**Acceptance:** every Cowork space-auto-memory file carries `lane` under `metadata` (types
unchanged); its `MEMORY.md` surfaces lane per entry; the shared + active-lane recall rule is present
and applies to the Cowork surface.

---

## TASK-144 — Create Work pad workspace + wire pad-workspace routing

*(This task has its own primary owner; this section is the cross-referenced spec it builds to.)*

**Goal:** A `work` pad workspace exists, and every path that creates pad items targets the
workspace named in each project's `pad-workspace:` field before creating. **`pad-workspace:` is
authoritative — never create on the session-default board without resolving it first.**
`pad-snapshot` becomes lane-aware.

### Create the workspace

Create a pad workspace with slug **`work`** (display name "Work"). It mirrors the `command-center`
collection lifecycle (`tasks` collection; statuses `backlog → ready → in-progress → review → done`
+ `blocked`/`cancelled`; same custom fields: `project`, `priority`, `complexity`, `kind`,
`impact`). Personal/home/shared work stays on `command-center`; work-lane work goes to `work`.

### Wire `pad-workspace:` routing

Every path that creates pad items must resolve the target workspace from the active project's
`lane` (deriving the board, since `pad-workspace` is no longer declared in the header) and call
`pad_set_workspace` **before** any create/update, using this logic:

```text
1. Determine active project (folder in scope, or the project named in the request).
2. Read its CLAUDE.md lane-declaration block -> lane (and any explicit pad-workspace override).
   - derive board: if lane == "work"        -> target = "work"
                   if lane == "home"|"shared"-> target = "command-center"
   - if the header has an explicit pad-workspace: override -> use it instead
   - if no project in scope / no header     -> target = "command-center" (home default)
3. Call pad_set_workspace(workspace=target) BEFORE pad_item(action="create", ...).
4. Create/update the item. Never create on the session-default board without this resolve step.
```

**Where this gets wired — two paths, two homes.** Note the `/pad` skill is a **bundled** skill at
`.claude/skills/pad/SKILL.md` — it is *not* a custom skill in the root `Skills/` source-of-truth
(today only `wrap-up` lives there), so do **not** fork or hand-edit it. Wire the two paths instead:

- **Interactive (`/pad`):** enforced by the **standing instruction in root `CLAUDE.md` +
  `shared-context/_universal/CLAUDE.md`** (the `_universal` Memory/board step: "Target the board
  named in `pad-workspace:` … call `pad_set_workspace` first"). The agent runs the
  resolve-then-`pad_set_workspace` step *around* the bundled skill; the skill itself is untouched.
- **Autonomous routines:** bake the resolve step into the **routine prompt files David owns** —
  `projects/personal-knowledge-brain/pad/routine-prompt.md` (`pad-ai-task-sweep`),
  `projects/personal-knowledge-brain/pad/idea-triage-routine-prompt.md` (`pad-idea-triage`), and
  `projects/personal-knowledge-brain/pad/dreaming-routine-prompt.md` (`pad-dreaming`) — so an
  overnight work task never lands on the personal board.
- **Backstop (recommended):** add a pad **Convention** card (`CONVE`, trigger `always`) — "resolve
  `pad-workspace:` and call `pad_set_workspace` before creating any item" — so the rule is visible
  to every routine that loads conventions, independent of any one prompt file.

### Lane-aware `pad-snapshot`

Per the resolved decision, produce **two** snapshot files (not one combined):
- `./pad-snapshot.md` — mirror of the `command-center` (home/shared) board.
- `./pad-snapshot-work.md` — mirror of the `work` board.

The `pad-idea-triage` routine regenerates both nightly: set workspace to `command-center`, dump
to `pad-snapshot.md`; set workspace to `work`, dump to `pad-snapshot-work.md`. Each file keeps the
existing snapshot format (board columns → cards). Both remain read-caches; pad is source of truth.

**Acceptance:** `work` workspace exists with matching lifecycle/fields; the resolve-then-
`pad_set_workspace` step is enforced on both paths (interactive via the root + `_universal`
CLAUDE.md standing instruction; routines via their prompt files — the bundled `/pad` skill is not
forked); both snapshot files generated nightly.

---

## TASK-147 — Define + apply standard project scaffold

**Goal:** A reusable project template exists at `shared-context/_universal/project-template/`, and
active projects are brought up to the standard spine (notably consolidating any top-level
`architecture/` into `docs/architecture/`). Folds IDEA-115 (per-project wrap-up into `wrap-up.md`).

### Template location + contents

Create `./shared-context/_universal/project-template/` with the **required spine**:

```
project-template/
├── CLAUDE.md          # lane-declaration block (placeholder values) + Identity/Objective/Working-notes
├── README.md          # human orientation: what it is, how to run/use
├── status.md          # living state: Done / In-progress / Next / Blockers
├── memory.md          # project-local working memory (decisions, gotchas)
├── wrap-up.md         # project-specific wrap-up instructions (replaces per-project wrap-up skills)
└── docs/
    ├── index.md       # retrieval index for this project's docs
    ├── requirements/
    │   └── .gitkeep
    ├── architecture/
    │   └── .gitkeep
    └── plans/
        └── .gitkeep
```

Code projects additionally create (only when there's content for them — empty scaffolding not
required): `src/` (or `app/`), `tests/`, `communications/`, and domain dirs as needed
(`n8n/`, `prompts/`, `research/`, …).

**`project-template/CLAUDE.md` skeleton:**

```markdown
---
lane: home                      # work | home | shared  — set per project (the ONLY declared lane field)
skills: []                      # persona skills, e.g. - sn-spm-architect
attach:
  - shared-context/_universal   # add domain folders this project needs
---

@../../shared-context/_universal/CLAUDE.md

# <Project Name>

> **Base layer:** before acting, read `shared-context/_universal/CLAUDE.md` and follow it on top of
> this file. (The `@import` line above auto-loads it in Claude Code; this prose instruction is the
> cross-surface guarantee — it loads the base layer in Cowork too.)
>
> **Derived from `lane`** (do not declare unless overriding): voice, pad-workspace, and outputs —
> see `_universal/CLAUDE.md`. Add an explicit `voice:` / `pad-workspace:` / `outputs:` line only to
> override the rule.

## Identity
One paragraph: what this project is, what routes here, what doesn't.

## Objective
What "done" looks like for this project.

## Authoritative files
- Design / architecture: `docs/architecture/...`
- Tracking: pad <PLAN/EPIC ref> (<workspace>, project: <name>).

## Working notes
- Decisions and gotchas worth keeping in front of mind.
```

**Base-layer load — why both lines.** Listing `shared-context/_universal` in `attach:` makes the
folder *readable*, but neither surface loads its `CLAUDE.md` *as instructions* from that alone:
Cowork only reads attach paths because the root CLAUDE.md tells it to, and Claude Code's automatic
parent-directory discovery climbs the path to root (so it picks up the root `CLAUDE.md`) but never
descends into a **sibling subtree** like `shared-context/`. So make the load explicit, two ways:

- **The prose "Base layer" line — load-bearing.** Cowork does **not** honor `@import` (it's a Claude
  Code memory feature), so the plain instruction to read the base layer is what Cowork relies on.
  Both surfaces follow it. This is the authoritative mechanism — keep it.
- **`@../../shared-context/_universal/CLAUDE.md` — Code convenience.** Claude Code evaluates `@path`
  imports inside any CLAUDE.md it loads, resolving the path relative to the file containing the line;
  from `projects/<name>/CLAUDE.md`, `../../` walks to the root and down into
  `shared-context/_universal/`. Because `_universal/` is a sibling subtree (not an ancestor of the
  project), the import is what pulls it in — no `--add-dir` needed — and it makes inclusion eager and
  deterministic rather than relying on the agent acting on the prose. *(Confirmed via Claude Code,
  2026-06-17: import resolves above the session cwd as content-inclusion, not directory access.)*

**Convention caveats (apply in TASK-141):**
- **Relative, never absolute.** The repo git-syncs to the MacBook / work laptop, so an absolute
  `C:\Users\david\…` path would break off-Windows; `../../` ports cleanly.
- **Depth must match nesting.** `../../` assumes every project sits at `projects/<name>/`. A nested
  or differently-placed project needs a different depth — this works as a uniform rule only because
  the scaffold puts all projects one level under `projects/`.
- **Not inside a code fence.** Imports in fenced/inline code aren't evaluated; the live import line
  goes in each real project `CLAUDE.md` as plain text. (The `_universal/CLAUDE.md` body shown fenced
  elsewhere in this spec is template text — correctly not evaluated.)
- **Import depth:** Claude Code resolves nested imports up to 5 hops; this scheme is 1 hop.

**`project-template/status.md` skeleton:**

```markdown
# <Project> — Status

*Updated: <date>*

## Done
## In progress
## Next
## Blockers
```

**`project-template/wrap-up.md` skeleton** (absorbs IDEA-115 — the per-project wrap-up that the
shared `wrap-up` skill defers to):

```markdown
# Wrap-up — <Project>

Run at end of session for this project. Steps:
1. Update `status.md` (Done / In-progress / Next / Blockers) from this session's work.
2. Append durable decisions/gotchas to `memory.md`.
3. Refresh `docs/index.md` if docs were added or moved.
4. Update root memory (`memory/`) only for facts that outlive this project — stamp each new
   entry's `[work]`/`[home]`/`[shared]` lane tag (per TASK-167).
5. Emit the git commit command (do not commit unless asked).

Project-specific notes:
- <anything special this project needs at wrap-up>
```

**`project-template/docs/index.md` skeleton:**

```markdown
# <Project> — Docs Index

| Doc | Read when... |
|---|---|
| docs/architecture/architecture.md | You need the design / why decisions were made. |
| docs/requirements/... | You need scope and acceptance criteria. |
| docs/plans/... | You need the build sequence / specs. |
```

`README.md` and `memory.md` get minimal seeded headers (`# <Project>` + one-line purpose; and
`# <Project> — Memory` with `## Decisions` / `## Gotchas`).

### Apply to active projects

For each active project:
1. Ensure the spine files exist (create missing ones from the template; do not overwrite existing
   content).
2. **Consolidate docs:** if a project has a top-level `architecture/` folder, move its contents to
   `docs/architecture/` and update any links. The unification project itself currently uses
   `design/` for its architecture + this spec; treat `design/` as that project's docs home (it is
   the reference implementation) — do not force-rename it, but ensure a `docs/index.md` or
   equivalent retrieval index points to it.
3. Replace any per-project wrap-up **skill** with a `wrap-up.md` in the project (IDEA-115). The
   shared `wrap-up` skill should defer to the project's `wrap-up.md` when present.

**Acceptance:** template exists at the specified path with all spine files; the template
`CLAUDE.md` carries the base-layer load (the `@../../shared-context/_universal/CLAUDE.md` import +
the prose "Base layer" instruction); active projects have the spine; top-level `architecture/`
folders consolidated under `docs/architecture/`; per-project wrap-up skills replaced by `wrap-up.md`.

---

## TASK-148 — Retire workstations → projects + domain skills

**Goal:** `workstations/` is gone; each former workstation is either a project or a skill; routing
no longer references workstations. Build the `email` skill.

### Per-workstation disposition

Current `./workstations/` contains: `email-hq/`, `family/`, `travel/`, `meal-planning/`,
`home-lab/`, `worst-case/`.

| Workstation | Disposition |
|---|---|
| `email-hq/` | **→ `email` skill.** Fold its CLAUDE.md/memory into a new `Skills/email/SKILL.md`. The skill triggers on email phrasing, loads the active lane's voice, and routes channel by lane: Gmail MCP for personal (home), Playwright/Outlook for work. Migrate any reusable context into `shared-context/` (work email context → `work/adt`; personal → leave with the skill). |
| `family/` | **→ `shared-context/home/family/`.** Merge its context into `family-context.md` (already moved there in TASK-140); drop the workstation shell. |
| `travel/` | **→ `shared-context/home/travel/`.** Move reference content under that domain folder; add rows to its `index.md`. |
| `meal-planning/` | **→ skill(s) + home context.** Its skill files are the source of truth for the Skylight skills already deployed; reconcile into `Skills/` (skylight-* skills). Outputs move to `outputs/home/meal-planning/`. Reference content → `shared-context/home/` (new `meal-planning/` domain folder if needed, with an `index.md`). |
| `home-lab/` | **Already a project** (`projects/home-lab`). Move any unique workstation content into the project's `docs/`; delete the workstation shell. |
| `worst-case/` | **Already a project.** It contains a nested `projects/worst-case-scenario/`; move that nested project's content to the top-level `projects/worst-case-scenario/` (do not nest projects), then delete the `worst-case/` workstation shell. |

After migrating each, delete the now-empty `./workstations/` tree.

### `email` skill (build)

Create `./Skills/email/SKILL.md` (canonical source; deploy a copy to `~/.claude/skills/email/`):

```markdown
---
name: email
description: Draft, reply to, triage, and review email. Use for any email task — personal or work.
  Routes channel by the active lane: Gmail MCP for personal (home lane), Playwright/Outlook for
  work (work lane). Triggers on "email", "reply to", "draft a message", "triage inbox", etc.
---

# Email

## Lane → channel
- Active lane `home` (or personal mailbox): use the Gmail MCP (david.barkhausen@gmail.com).
- Active lane `work` (or ADT mailbox): use Playwright/Outlook for ADT mail.
- If lane is ambiguous, ask which mailbox before acting.

## Voice
Load the active lane's voice file before drafting (home → voice-principles.md, work → voice-work.md).
Match the formality of the message you're replying to.

## Rules
- Before drafting a new email, search existing threads with that recipient; reply in-thread if one exists.
- Match the original message's formality. No emoji in work mail.
- Don't send — produce a draft for review unless explicitly told to send.
```

### Routing map cleanup

In root `CLAUDE.md`, remove the old `workstations/`-based Routing Map rows (e.g. "Email HQ",
"Personal Finances" placeholders) — the TASK-142 routing table replaces them. Ensure no doc still
points sessions at `workstations/`.

**Acceptance:** `workstations/` deleted; family/travel/meal context under `shared-context/home/`;
home-lab and worst-case consolidated as top-level projects; `email` skill exists in `Skills/email/`
and is deployed; root routing no longer references workstations.

---

## Build order

Recommended sequence (dependencies in parentheses): **140** (tree + `_universal/CLAUDE.md`) →
**147** (template, lives in `_universal/`) → **141** (lane headers; uses attach paths from 140) →
**142** (root config + outputs + voice; references 141's standing instruction) → **167** (primary
memory: typed-curated lane tags + `memory-sync` + CLAUDE.md read/write rules) → **143** + **169**
(per-surface auto-memory children; each enforces 167's scheme — 143 on Claude Code, 169 on Cowork) →
**144** (pad workspace + routing; `/pad` references 141 headers) → **148** (retire workstations;
depends on 140's `shared-context/home/` being ready).

Memory ordering matters: **167 lands first** (it defines the lane scheme and the CLAUDE.md rules the
children rely on), then 143 and 169 can run in parallel. 144 can also run in parallel once 142 lands.

*End of spec.*
