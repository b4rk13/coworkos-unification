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
- **Cowork** (sandboxed): document creation, general work + personal projects. Cannot run
  git/PowerShell. Works best navigating a preset root folder structure with routing.
- **Claude Code:** code projects (e.g. treatment-collab-suite, work ServiceNow) needing
  git/PowerShell — context folders are attached per session, John-style. Code projects
  also get **automatic memory isolation** because each lives at its own folder path.

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
lane: work                      # work | home | shared
voice: work                     # which 00-resources voice file to load
pad-workspace: work             # where tasks/ideas/plans get created (Work board)
skills:                         # personas/skills to adopt for this project
  - sn-spm-architect
attach:                         # shared-context folders this project pulls
  - shared-context/_universal
  - shared-context/work/servicenow
outputs: outputs/work/servicenow-spm
---
```

**Field semantics**
- `lane` — the hygiene boundary. Sets the default register and which identity context applies.
- `voice` — which `00-resources` voice file to load (`home` → voice-principles.md, `work` → voice-work.md).
- `pad-workspace` — authoritative target board for ideas/plans/tasks (`command-center` or `work`).
- `skills` — persona/expertise skills to invoke at session start (e.g. `sn-spm-architect`
  on ServiceNow SPM projects). Sets the *expertise persona*, composing with `lane`'s register.
- `attach` — `shared-context/...` folders this project pulls.
- `outputs` — deliverable path for this project.

**Consumption per surface**
- **Cowork (root sessions):** root `CLAUDE.md` rule — *"before acting in a project, read its
  lane header; load the matching voice + pad workspace + skills; treat `attach:` paths as the
  project's context."* One synced tree, so attach paths are already readable.
- **Claude Code (code projects):** the project's own `CLAUDE.md` loads automatically; the
  `attach:` list names the `shared-context/...` folders to add as additional working dirs that
  session; the `skills:` list names personas to invoke at start.

---

## 5. Operational layer

**pad workspaces**
- Personal → existing `command-center` workspace.
- Work → new **Work** workspace (slug `work`).
- `pad-workspace:` is authoritative. The `/pad` skill and overnight routine call
  `pad_set_workspace` to that value *before* creating any item, so a work task never lands
  on the personal board.
- `pad-snapshot.md` becomes lane-aware (two files, or one with Work/Home sections).

**memory (keep the 4-tier types; add lane as a second axis — enhancement, not a merge)**
- The existing typed memory (user / feedback / project / reference) is **unchanged** — types stay
  the primary structure. We are NOT reverting to one tagged file.
- Add an orthogonal `lane: work | home | shared` to each memory's frontmatter, so every fact now
  carries **both** a `type` and a `lane` (a 2-D classification).
- `MEMORY.md` keeps its type organization and gains a lane marker per entry (optionally
  sub-grouping Work / Home / Shared within a type). Recall loads shared + the active lane and
  de-prioritizes the other.
- Hard isolation is still automatic for Code projects (separate folder paths → separate auto-memory).

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
- **Lane classification locked (2026-06-16):** see §7 table. `Jira-ALM Data Sync` archived.
- **pad-snapshot — two files (2026-06-16):** `pad-snapshot.md` (home/command-center) +
  `pad-snapshot-work.md` (Work board).
- **`shared-context/` name kept (2026-06-16).**
