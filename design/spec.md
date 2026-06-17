# CoworkOS Unification — Build Spec

*Status: spec — ready for build (2026-06-16) · Owner: David*
*Architecture (source of truth): [`design/architecture.md`](./architecture.md) — Approach B: shared tree, lane-as-tag*
*Tracking: pad PLAN-137 (command-center, project: general) · Feeds Phase-3 build tasks TASK-140 through TASK-148*

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
- [TASK-143 — Add lane axis to 4-tier memory](#task-143--add-lane-axis-to-4-tier-memory)
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
that are true regardless of lane. Lane-specific behavior (voice, board, outputs) comes from the
project's own lane-declaration header — read that first.

## Lane detection (do this before acting)

1. Read the current project's CLAUDE.md lane-declaration block (the YAML frontmatter at the top).
2. Load the voice file it names (`voice: home` → `00-resources/voice-principles.md`;
   `voice: work` → `00-resources/voice-work.md`).
3. Treat the project's `attach:` paths as additional context for the session.
4. Invoke any persona skills named in `skills:`.
5. Target the board named in `pad-workspace:` for any pad item (call `pad_set_workspace` first).
6. Write deliverables to the path in `outputs:`.

If you are in a root/non-project Cowork chat with no project header, use the root CLAUDE.md
routing table to pick a lane, then default `voice: home` until a project is in scope.

## Memory system

- Read `memory/MEMORY.md` at session start; let it inform your work without announcing it.
- When David says "remember this," write it immediately and confirm.
- Each memory file carries both a `type` (user / feedback / project / reference) and a
  `lane` (work / home / shared) in its frontmatter. Recall loads shared + the active lane and
  de-prioritizes the other lane.

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
lane: work                      # work | home | shared
voice: work                     # home -> voice-principles.md, work -> voice-work.md
pad-workspace: work             # command-center (home/shared) | work (work lane)
skills:                         # persona/expertise skills to adopt at session start
  - sn-spm-architect            # omit the list (use `skills: []`) if none
attach:                         # shared-context folders this project pulls
  - shared-context/_universal
  - shared-context/work/servicenow
outputs: outputs/work/<project-slug>
---
```

**Field rules**
- `lane` from the table. `voice` follows lane: work-lane → `work`, home/shared-lane → `home`
  (shared uses the warmer home voice per the architecture; see the unification project's own note).
- `pad-workspace`: work-lane → `work`; home/shared-lane → `command-center`.
- `skills`: only the personas listed in the table (today: `sn-spm-architect` for the two
  ServiceNow SPM projects). Everything else → `skills: []`.
- `attach`: always include `shared-context/_universal`. Add the domain folders the project needs
  (see per-project notes below).
- `outputs`: `outputs/<lane>/<project-slug>` where `<lane>` is `work` or `home` (shared projects
  use `home`). Slug = the project folder name, lowercased/hyphenated.

### Standing instruction wording (goes in root CLAUDE.md, applied by TASK-142)

Add this rule so every session honors the header:

> **Before acting in a project, read its lane-declaration header (the YAML block at the top of
> the project's CLAUDE.md). Load the voice file it names, set the pad workspace it names (call
> `pad_set_workspace` before creating any pad item), invoke the skills it lists, treat its
> `attach:` paths as the session's context, and write deliverables to its `outputs:` path.**

### Per-project classification + headers

Apply to these active project folders under `./projects/`. Note `Capacity Managment` and
`Knowledge Presentation` and `Work Email Triage` keep their existing (mis)spelled/spaced folder
names — do not rename folders in this task; just add headers.

| Project folder | lane | voice | pad-workspace | skills | attach (beyond `_universal`) | outputs |
|---|---|---|---|---|---|---|
| Capacity Managment | work | work | work | `sn-spm-architect` | `shared-context/work/servicenow`, `shared-context/work/adt` | `outputs/work/capacity-management` |
| nowaikit | work | work | work | `sn-spm-architect` | `shared-context/work/servicenow` | `outputs/work/nowaikit` |
| Work Email Triage | work | work | work | — | `shared-context/work/adt` | `outputs/work/work-email-triage` |
| Knowledge Presentation | work | work | work | — | `shared-context/work/adt` | `outputs/work/knowledge-presentation` |
| onedrive-sync | work | work | work | — | — | `outputs/work/onedrive-sync` |
| cancer-treatment | home | home | command-center | — | `shared-context/home/medical`, `shared-context/home/family` | `outputs/home/cancer-treatment` |
| treatment-collab-suite | home | home | command-center | — | `shared-context/home/medical`, `shared-context/home/family` | `outputs/home/treatment-collab-suite` |
| estate-claudeen-barkhausen | home | home | command-center | — | `shared-context/home/family` | `outputs/home/estate-claudeen-barkhausen` |
| home-lab | home | home | command-center | — | — | `outputs/home/home-lab` |
| Network_Segregation | home | home | command-center | — | — | `outputs/home/network-segregation` |
| personal-knowledge-brain | home | home | command-center | — | — | `outputs/home/personal-knowledge-brain` |
| worst-case-scenario | home | home | command-center | — | `shared-context/home/family` | `outputs/home/worst-case-scenario` |
| helimath | home | home | command-center | — | — | `outputs/home/helimath` |
| coworkos-unification | shared | home | command-center | — | `shared-context/_universal` | `outputs/home/coworkos-unification` |

**Example — `projects/nowaikit/CLAUDE.md` header (concrete):**

```yaml
---
lane: work
voice: work
pad-workspace: work
skills:
  - sn-spm-architect
attach:
  - shared-context/_universal
  - shared-context/work/servicenow
outputs: outputs/work/nowaikit
---
```

**Example — `projects/cancer-treatment/CLAUDE.md` header (concrete):**

```yaml
---
lane: home
voice: home
pad-workspace: command-center
skills: []
attach:
  - shared-context/_universal
  - shared-context/home/medical
  - shared-context/home/family
outputs: outputs/home/cancer-treatment
---
```

**Archive:** ensure `Jira-ALM Data Sync` lives under `./projects/_archive/` (TASK-148 handles the
physical move if not already done); do not add a lane header to archived projects.

**Acceptance:** every active project listed has a valid lane block matching the table; no active
project is missing one; archived project has none.

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

> **Write every deliverable to the `outputs:` path named in the active project's lane header,
> which resolves to `outputs/<lane>/<project>`. Never write deliverables to a project folder's
> root. Code projects may use a project-local `outputs/` only for build scratch / intermediate
> artifacts; final deliverables still go to the root lane path.**

### 142b — `voice-work.md`

Create `./00-resources/voice-work.md` — the professional work register for the ADT ServiceNow SPM
context. Outline:

```markdown
# Work Voice — ADT / ServiceNow SPM Register

*Load this voice when the active project's lane header says `voice: work`.*
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

   > **Before producing any written content, read the voice file named in the active project's
   > lane header (`voice: home` → `00-resources/voice-principles.md`; `voice: work` →
   > `00-resources/voice-work.md`). In a non-project root chat, default to `voice-principles.md`
   > unless the routing table puts you in the work lane.**

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

**Acceptance:** `outputs/work` and `outputs/home` exist; `voice-work.md` matches the outline; root
CLAUDE.md has the new voice rule, lane-header instruction, output rule, routing table, and
lane-detection rule, with the old "always voice-principles" rule removed.

---

## TASK-143 — Add lane axis to 4-tier memory

**Goal:** Every memory file carries both `type` and `lane`; `MEMORY.md` surfaces lane; recall
honors the active lane. The 4-tier type structure (user / feedback / project / reference) is
**unchanged** — this is an additive second axis, not a merge.

### Frontmatter field

Add a `lane:` key to each memory file's frontmatter. Allowed values: `work | home | shared`.
Default existing personal memories to `home` unless their subject is clearly work (ServiceNow /
ADT / capacity) → `work`, or cross-cutting (e.g. the unification initiative, pad mechanics) →
`shared`.

**Before / after example** — `memory/coworkos-unification.md` (the unification initiative entry):

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

**Before / after example** — a work memory:

Before:
```markdown
---
type: reference
title: ADT capacity management — SPM table map
---
```

After:
```markdown
---
type: reference
lane: work
title: ADT capacity management — SPM table map
---
```

### Lane assignment for current memory files

| Memory file | type (unchanged) | lane |
|---|---|---|
| pad-item-custom-fields.md | reference | shared |
| pad-task-sweep-cadence.md | reference | shared |
| coworkos-unification.md | project | shared |
| (user/feedback prefs about voice, tone, comms) | user / feedback | home |
| (any ServiceNow/ADT/capacity facts) | reference / project | work |

### MEMORY.md surfacing

`MEMORY.md` keeps its **type-first** organization (the index). Surface lane per entry by appending
a tag to each index line, and optionally sub-group Work / Home / Shared within a type. Example
index line:

```markdown
- [coworkos-unification](coworkos-unification.md) `[shared]` — merging work+home into one
  lane-segregated root (Approach B); design signed off, tracked in pad PLAN-137.
```

If sub-grouping, use small sub-headings under a type section: `### Shared`, `### Work`, `### Home`.

### Recall rule

Add to `_universal/CLAUDE.md` memory section (and reflect in root CLAUDE.md): already drafted in
TASK-140's `_universal/CLAUDE.md` content —

> Each memory file carries both a `type` and a `lane`. Recall loads shared + the active lane and
> de-prioritizes the other lane. Hard isolation remains automatic for Code projects (separate
> folder paths → separate auto-memory).

### Encoding fix

While editing, fix any encoding warnings on the memory files (the known issue: smart quotes /
em-dashes saved as mojibake). Save all memory files as UTF-8 (no BOM). When writing from PowerShell
use `-Encoding utf8`.

**Acceptance:** every memory file has a valid `lane:`; types untouched; MEMORY.md shows lane per
entry; recall rule present; no encoding warnings remain.

---

## TASK-144 — Create Work pad workspace + wire pad-workspace routing

*(This task has its own primary owner; this section is the cross-referenced spec it builds to.)*

**Goal:** A `work` pad workspace exists, and the `/pad` skill + routines target the workspace named
in each project's `pad-workspace:` field before creating any item. `pad-snapshot` becomes
lane-aware.

### Create the workspace

Create a pad workspace with slug **`work`** (display name "Work"). It mirrors the `command-center`
collection lifecycle (`tasks` collection; statuses `backlog → ready → in-progress → review → done`
+ `blocked`/`cancelled`; same custom fields: `project`, `priority`, `complexity`, `kind`,
`impact`). Personal/home/shared work stays on `command-center`; work-lane work goes to `work`.

### Wire `pad-workspace:` routing

The `/pad` skill and every routine that creates pad items must resolve the target workspace from
the active project's `pad-workspace:` header and call `pad_set_workspace` **before** any
create/update. Logic snippet to embed in the `/pad` skill:

```text
1. Determine active project (folder in scope, or the project named in the request).
2. Read its CLAUDE.md lane-declaration block -> pad-workspace value.
   - if pad-workspace == "work"            -> target = "work"
   - if pad-workspace == "command-center"  -> target = "command-center"
   - if no project in scope / no header    -> target = "command-center" (home default)
3. Call pad_set_workspace(workspace=target) BEFORE pad_item(action="create", ...).
4. Create/update the item. Never create on the session-default board without this resolve step.
```

Apply the same resolve-then-`pad_set_workspace` step at the top of the overnight/sweep routine
(`pad-ai-task-sweep` and `pad-idea-triage`) so an overnight work task never lands on the personal
board.

### Lane-aware `pad-snapshot`

Per the resolved decision, produce **two** snapshot files (not one combined):
- `./pad-snapshot.md` — mirror of the `command-center` (home/shared) board.
- `./pad-snapshot-work.md` — mirror of the `work` board.

The `pad-idea-triage` routine regenerates both nightly: set workspace to `command-center`, dump
to `pad-snapshot.md`; set workspace to `work`, dump to `pad-snapshot-work.md`. Each file keeps the
existing snapshot format (board columns → cards). Both remain read-caches; pad is source of truth.

**Acceptance:** `work` workspace exists with matching lifecycle/fields; `/pad` skill and routines
resolve `pad-workspace:` and call `pad_set_workspace` before creating; both snapshot files
generated nightly.

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
lane: home                      # work | home | shared  — set per project
voice: home                     # home -> voice-principles.md, work -> voice-work.md
pad-workspace: command-center   # command-center | work
skills: []                      # persona skills, e.g. - sn-spm-architect
attach:
  - shared-context/_universal   # add domain folders this project needs
outputs: outputs/home/<project-slug>
---

# <Project Name>

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
4. Update root memory (`memory/`) only for facts that outlive this project.
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

**Acceptance:** template exists at the specified path with all spine files; active projects have
the spine; top-level `architecture/` folders consolidated under `docs/architecture/`; per-project
wrap-up skills replaced by `wrap-up.md`.

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
**142** (root config + outputs + voice; references 141's standing instruction) → **143** (memory
lane axis) → **144** (pad workspace + routing; `/pad` references 141 headers) → **148**
(retire workstations; depends on 140's `shared-context/home/` being ready). 143 and 144 can run
in parallel once 142 lands.

*End of spec.*
