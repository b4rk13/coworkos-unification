# CoworkOS Unification — Architecture & Design

*Status: design — signed off (2026-06-16) · Owner: David · Created: 2026-06-16*
*Tracking: pad PLAN-137 (command-center, project: general)*

---

## 1. Problem

The original setup ("Cowork Setup Playbook v2") used **two roots, no bleed** — a
separate `CoworkOS-Work/` and `CoworkOS-Home/` on two physically separate machines.
The physical wall enforced the work/home separation for free.

With Bridget's cancer diagnosis, David now works mostly from home on a **single PC**,
so the two environments are collapsing onto one machine. The physical wall is gone and
needs to be replaced with a **logical** one — without losing the ability to bridge
context between work and home or to switch between them quickly.

**Driver for separation:** context hygiene (not compliance). Work and home may co-exist
in one OneDrive tree, as long as each session reliably loads the right lane. This means
**logical** separation (folders + per-project routing) is sufficient; no separate drive
or root is required.

**Reference model — John Wishon's setup:** context lives in *attachable* folders, not
domain "workstations." A `Shared Context/` area holds domain subfolders (`ADT/`,
`_Universal/`, `_lab/`); each project attaches the folders it needs via Cowork's
"Context → On your computer" panel. `_Universal/` holds a `CLAUDE.md` that every
connected project loads on top of its own. Behavior lives in skills.

**Two surfaces, different constraints:**
- **Cowork** (sandboxed, the **primary** working front): document creation, general work +
  personal projects. Cannot run git/PowerShell. Works best navigating a preset root folder
  structure with routing. Keeps its own **space-scoped** auto-memory store (not isolated per
  project).
- **Claude Code** (deep coding sessions): code projects (e.g. treatment-collab-suite, work
  ServiceNow) needing git/PowerShell — context folders are attached per session, John-style.
  Keeps its own **per-folder** auto-memory store, hard-isolated by project path.

Both surfaces read the same shared brain — the typed curated `memory/` files — via a root
`CLAUDE.md` instruction. Lane hygiene therefore lives **there** (surface-neutral), not in either
surface's private auto-memory; each private store then enforces the same lane tag on its own side
(see §5). The Claude Code folder-path isolation is a bonus, not the hygiene mechanism — Cowork,
the primary surface, has no such automatic wall.

---

## 2. Decision — Approach B: shared tree, lane-as-tag

One root (`CoworkOS-Home/`, name kept). One `projects/` and one `shared-context/` tree
(with `work/` and `home/` subfolders — John's attachable model). Hygiene comes from two
cheap mechanisms:

1. Each project's `CLAUDE.md` declares its **lane**, which sets voice, pad workspace,
   outputs path, attached context, and persona skills.
2. The things that actually carry identity — **`outputs/` and `memory/`** — are split /
   tagged by lane.

Rejected alternatives:
- **A — top-level `work/` vs `home/` branches.** Cleanest wall, but fights Cowork's
  single-root model, duplicates the skeleton, biggest migration. Overkill for a hygiene
  (not compliance) driver.
- **C — keep current tree, just add tags + routing.** Least work, but keeps the
  monolithic-`resources` workstation model (future token bloat, per John's review) and
  the softest wall.

---

## 3. Target folder structure

```
CoworkOS-Home/                      # root (name kept)
├── CLAUDE.md                       # root routing table + lane rules
├── 00-resources/
│   ├── voice-principles.md         # home/personal voice (default, warmer)
│   ├── voice-work.md               # NEW: work voice (professional ADT register)
│   └── context-map.md              # systems map (exists)
├── shared-context/                 # attachable reference (John's model)
│   ├── _universal/
│   │   └── CLAUDE.md               # base layer every project loads
│   ├── work/
│   │   ├── adt/                    # atomic knowledge files + index.md
│   │   └── servicenow/
│   └── home/
│       ├── family/                 # family-context.md moves here
│       ├── medical/                # Bridget care reference
│       └── travel/
├── projects/                       # all projects; each CLAUDE.md declares its lane
│   ├── coworkos-unification/       # THIS project (reference implementation)
│   └── _archive/
├── outputs/
│   ├── work/<project>/
│   └── home/<project>/
├── memory/                         # typed auto-memory; lane-tagged + sectioned index
├── Skills/                         # behavior layer (canonical source)
└── Scheduled/
```

`shared-context/` is the existing folder evolved in place (keeps the name to minimize
breakage); `family-context.md` moves into `shared-context/home/family/`.

`workstations/` is **retired** — folded into `projects/` (everything is a project or it
isn't). Always-on, non-project domains become **skills** instead (see §5 and §10).

---

## 4. The lane-declaration engine

Every project `CLAUDE.md` opens with a declaration block. This replaces the old physical
wall — the project announces its lane and everything downstream follows.

```yaml
---
lane: work                      # work | home | shared  — the one declared hygiene field
skills:                         # personas to adopt (project-specific; not derivable)
  - sn-spm-architect
attach:                         # shared-context folders this project pulls (project-specific)
  - shared-context/_universal
  - shared-context/work/servicenow
---
```

**Declared fields** (all a header carries by default):
- `lane` — the hygiene boundary, and the single source from which voice / board / outputs derive.
- `skills` — persona/expertise skills to invoke at session start (project-specific; e.g.
  `sn-spm-architect`), composing with `lane`'s register. `skills: []` if none.
- `attach` — the `shared-context/...` folders this project pulls (project-specific).

**Derived from `lane` by rule** (defined once in `_universal/CLAUDE.md`; do **not** hand-declare
unless overriding):

| lane | voice | pad-workspace | outputs |
|---|---|---|---|
| work | work (voice-work.md) | work | outputs/work/&lt;slug&gt; |
| home | home (voice-principles.md) | command-center | outputs/home/&lt;slug&gt; |
| shared | home (voice-principles.md) | command-center | outputs/home/&lt;slug&gt; |

`<slug>` = the project folder name, lowercased, spaces/underscores → hyphens. Declaring `voice:`,
`pad-workspace:`, or `outputs:` in a header is an **override** — include one only to deviate from the
rule (e.g. a folder whose desired output slug differs from its name). Normalizing this way sets lane
once, so the three derived fields can't drift across 14 hand-maintained files.

**Consumption per surface**
- **Cowork (root sessions):** root `CLAUDE.md` rule — *"before acting in a project, read its
  lane header; load the matching voice + pad workspace + skills; treat `attach:` paths as the
  project's context."* One synced tree, so attach paths are already readable.
- **Claude Code (code projects):** the project's own `CLAUDE.md` loads automatically; the
  `attach:` list names the `shared-context/...` folders the session pulls; the `skills:` list names
  personas to invoke at start.

**Loading the universal base layer.** `attach:` makes a folder *readable*, but neither surface loads
`_universal/CLAUDE.md` *as instructions* from that alone — so every project `CLAUDE.md` carries an
explicit base-layer load right after its lane header: a prose *"read `shared-context/_universal/CLAUDE.md`
and follow it on top of this file"* line plus a Claude Code `@../../shared-context/_universal/CLAUDE.md`
import. The **prose line is load-bearing and surface-neutral** (Cowork does not honor `@import`); the
import is a Code convenience that makes inclusion eager and deterministic (Code's parent-directory
discovery reaches the root `CLAUDE.md` but never a sibling subtree like `shared-context/`). The spec
(TASK-141 / TASK-147) is the source for the exact lines and caveats.

---

## 5. Operational layer

**pad workspaces**
- Personal → existing `command-center` workspace.
- Work → new **Work** workspace (slug `work`).
- `pad-workspace:` is authoritative. The `/pad` skill and overnight routine call
  `pad_set_workspace` to that value *before* creating any item, so a work task never lands
  on the personal board.
- `pad-snapshot.md` becomes lane-aware (two files, or one with Work/Home sections).

**memory (keep the 4-tier types; add lane as a second axis across all three stores — enhancement, not a merge)**

The 4-tier types (user / feedback / project / reference) are **unchanged** — types stay the
primary structure. We are NOT reverting to one tagged file. Lane is an orthogonal second axis, so
every fact carries **both** a `type` and a `lane`. There are **three** memory stores in play, and
lane is applied to all three — but they are not equal:

1. **Typed curated `memory/` — first-class, surface-neutral lane carrier (TASK-167, primary).**
   `memory/{user,feedback,projects,reference}.md` — type-aggregated prose, curated nightly by
   `memory-sync`, and read at session start by **both** surfaces via root `CLAUDE.md`. This is the
   shared brain and the authoritative place lane lives. Because these are prose (no per-fact
   frontmatter), lane is an inline `[work]` / `[home]` / `[shared]` tag per entry. Recall (read):
   load shared + the active lane, de-prioritize the other. Write: when "remember this" writes a
   typed entry, stamp its lane.
2. **Claude Code session auto-memory (TASK-143, Code child).** The per-topic files with YAML
   frontmatter under `~/.claude/projects/<encoded-path>/memory/` (+ its `MEMORY.md` index) that
   Claude Code maintains itself. Already hard-isolated per folder path; add `lane:` to frontmatter
   and a lane marker in its `MEMORY.md` so a multi-lane Code session can't bleed.
3. **Cowork space auto-memory (TASK-169, Cowork child).** The per-fact files (`metadata.type`
   frontmatter) + `MEMORY.md` index Cowork maintains in its space-scoped store. Cowork is the
   primary surface but this store is space-scoped, **not** project-isolated — so it has no
   automatic lane wall and enforcement matters most here. Add `lane` under each file's `metadata`
   and a `[lane]` marker per `MEMORY.md` entry; recall honors the active lane.

The two per-surface auto-memory stores are private scratch each tool generates; they enforce the
same lane tag on their own side, but the typed curated layer (1) is the hygiene boundary. `MEMORY.md`
indexes keep their type organization and surface lane per entry. Hard path isolation in Claude Code
is a bonus, not the mechanism.

**behavior layer (skills replace workstations)**
- `workstations/` is folded into `projects/`. Always-on, non-project domains become **skills**
  that trigger on phrasing and load the active lane's voice + the right channel — e.g. an `email`
  skill using the Gmail MCP for personal mail and Playwright/Outlook for work mail.

**outputs & voice**
- `outputs/work/<project>` and `outputs/home/<project>`, driven by the `outputs:` field.
- `voice-principles.md` stays the default (home, warmer); add `voice-work.md` (professional).
- Root rule changes from "always read voice-principles" to "read the voice file named in the
  project's lane header."

**routing**
- Root `CLAUDE.md` gains a routing table (task-type/folder → lane) plus the lane-detection
  rule, so even non-project Cowork chats land in the right lane.

---

## 6. Standard project scaffold

Codifies the conventions that emerged across `treatment-collab-suite` and
`personal-knowledge-brain` so every project starts consistent and the overnight routine +
wrap-up know where things live. A template skeleton lives at
`shared-context/_universal/project-template/`.

**Required spine (every project)**
- `CLAUDE.md` — lane-declaration block + project context.
- `README.md` — human orientation: what it is, how to run/use.
- `status.md` — living current-state snapshot (done / in-progress / next / blockers); refreshed at wrap-up.
- `memory.md` — project-local working memory (decisions, gotchas).
- `wrap-up.md` — project-specific wrap-up instructions (absorbs IDEA-115; retires per-project wrap-up skills).
- `docs/` — the single home for design thinking:
  - `docs/index.md` — retrieval index (atomic-file hints).
  - `docs/requirements/` · `docs/architecture/` · `docs/plans/` (plans + specs).

**Code projects add**
- `src/` (or `app/`) — actual code; `tests/` — test suite.
- `communications/` — user-facing: release notes, guides, announcements.
- domain dirs as needed (`n8n/`, `prompts/`, `research/`, …).

**Decisions (2026-06-16)**
- **Docs consolidated:** top-level `architecture/` moves under `docs/architecture/` — one thinking home, one index.
- **Outputs — both:** final deliverables go to root `outputs/<lane>/<project>` (lane model); project-local `outputs/` is allowed for build scratch/intermediate artifacts in code projects.
- **State files — both:** `status.md` (state) and `wrap-up.md` (wrap-up instructions) are standard.

**Not every project needs every folder.** Doc/general projects (most home + automation/agent
work) use the spine + `docs/`; only true code apps add `src/` + `tests/`. Add a folder when
there is content for it — empty scaffolding is not required.

---

## 7. Migration approach + final lane classification

Existing `projects/` get declaration blocks per this **final** classification (confirmed 2026-06-16):

| Project | Lane | Persona skill |
|---|---|---|
| Capacity Managment | Work | `sn-spm-architect` |
| nowaikit | Work | `sn-spm-architect` |
| Work Email Triage | Work | — |
| Knowledge Presentation | Work | — |
| onedrive-sync | Work | — |
| cancer-treatment | Home | — |
| treatment-collab-suite | Home | — |
| estate-claudeen-barkhausen | Home | — |
| home-lab | Home | — |
| Network_Segregation | Home | — |
| personal-knowledge-brain | Home | — |
| worst-case-scenario | Home | — |
| helimath | Home | — |
| coworkos-unification | Shared | — |

- **Archived:** `Jira-ALM Data Sync` → `projects/_archive/` (no longer active).
- Retiring workstations fold in as Home (family, travel, meal-planning) or into the new `email`
  skill (email-hq); `home-lab` / `worst-case` are already projects.

Migration is mostly additive (new folders, declaration headers, moved reference files) rather
than a teardown.

---

## 8. Build sequence (kiro flow)

1. **Design / architecture** (this doc) — finalize the lane model, target tree, and project
   scaffold standard. *(Human gate.)*
2. **Spec** — detailed specs per component: shared-context tree, per-project CLAUDE.md
   template + lane schema, **standard project scaffold + template**, `adt` pad workspace setup,
   memory lane-tagging, voice-work.md, root routing table, project→lane classification.
3. **Build** — implement: create shared-context tree, **build the project-scaffold template +
   apply to active projects**, migrate + classify projects, split outputs, create `adt`
   workspace, update root CLAUDE.md routing, tag memory, add voice-work.md, update /pad skill +
   routine for workspace routing.
4. **Playbook v3** — rewrite the setup playbook as a clean single-machine, logically-segregated
   rebuild guide for any future computer.

---

## 9. Open questions

_None — all resolved (see §10). Design signed off 2026-06-16._

## 10. Resolved decisions

- **Workstations retired (2026-06-16):** the `workstations/` concept is folded into `projects/`.
  Always-on, non-project domains become **skills** (behavior layer) that load the lane's voice +
  the right channel — e.g. an `email` skill: Gmail MCP for personal, Playwright/Outlook for work.
  Resolves the old "do work lanes need a workstations folder?" question — no.
- **Memory enhanced, not merged (2026-06-16):** keep the 4-tier types; add `lane` as an
  orthogonal second axis. Each fact carries both `type` and `lane`; `MEMORY.md` keeps type
  organization and surfaces lane; recall loads shared + the active lane.
- **Memory — typed curated layer is first-class for lane; both auto-memory stores enforce it
  (updated 2026-06-17):** lane applies to **three** stores, not one. The typed curated `memory/`
  files are the authoritative, surface-neutral lane carrier (**TASK-167, primary**), read by both
  Cowork and Claude Code via root `CLAUDE.md`. The Claude Code session auto-memory (**TASK-143**)
  and the Cowork space auto-memory (**TASK-169**) each get the same lane tag on their own store so
  neither surface bleeds across lanes — TASK-143 and TASK-169 are children that *implement*
  TASK-167's scheme on their surface. Supersedes the earlier framing that put lane only on the
  Claude Code session auto-memory and treated the typed `memory/` folder as out of scope. Both
  surfaces must work; the surface-neutral typed layer is what guarantees that.
- **Lane block normalized — declare `lane`, derive the rest (2026-06-17):** `voice`,
  `pad-workspace`, and `outputs` are 100% derivable from `lane`, so declaring them in all 14 headers
  is denormalization that invites drift. Headers now declare only `lane`, `skills`, and `attach`;
  voice/board/outputs are **derived by rule** in `_universal/CLAUDE.md` (work → voice-work /
  `work` / `outputs/work/<slug>`; home & shared → voice-principles / `command-center` /
  `outputs/home/<slug>`). An explicit `voice:`/`pad-workspace:`/`outputs:` line is an **override**,
  used only to deviate (e.g. `Capacity Managment` overrides `outputs` to fix its misspelled folder
  slug). One source of truth per project; no cross-file drift. (Independent-review finding.)
- **Lane classification locked (2026-06-16):** see §7 table. `Jira-ALM Data Sync` archived.
- **pad-snapshot — two files (2026-06-16):** `pad-snapshot.md` (home/command-center) +
  `pad-snapshot-work.md` (Work board).
- **`shared-context/` name kept (2026-06-16).**
