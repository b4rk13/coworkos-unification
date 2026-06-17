# Status — CoworkOS Unification

_Last updated: 2026-06-17_

## Phase
**Spec — in review.** Memory section revised this session; awaiting David's sign-off on the
revised memory tasks before build.

## Done
- Architecture signed off: Approach B (shared tree, lane-as-tag); per-project lane-declaration
  block; standard project scaffold; workstations retired (folded into projects + skills); memory
  enhanced with a lane axis on the 4-tier (not merged); pad dual-workspace (`command-center` + `Work`).
- Lane classification locked (architecture.md §7); `Jira-ALM Data Sync` archived.
- Build spec written (`design/spec.md`, TASK-139, in review).
- **Memory model revised (2026-06-17):** reworked so it works on **both** Cowork (primary) and
  Claude Code. Lane now spans **three** stores — the typed curated `memory/` files are the
  first-class, surface-neutral carrier (inline `[lane]` tag, maintained by `memory-sync`), and each
  surface's private auto-memory enforces the same tag. Updated architecture §1/§5/§10 and the spec
  memory section (TASK-140 `_universal/CLAUDE.md` block, §142c, wrap-up step, build order).
- **pad restructured:** TASK-167 promoted to **primary** memory task; TASK-143 rescoped to the
  Claude Code session auto-memory (child); **TASK-169 created** for the Cowork space auto-memory
  (child). Hierarchy: PLAN-137 → TASK-167 → {143, 169}. TASK-139 spec contract + TASK-142/145
  alignment notes updated.
- Researched "Karpathy's second brain" (LLM Wiki / raw→wiki→outputs); logged **IDEA-170** to explore
  mapping it onto the personal-knowledge-brain intake/curate loop.
- **Spec refinements (2026-06-17):** (a) **pad-workspace routing** — clarified in TASK-144 *where* it
  wires: `/pad` is a bundled skill (`.claude/skills/pad/`, not forked); interactive enforcement via
  the root + `_universal` CLAUDE.md standing instruction, routines via their own prompt files, plus a
  `CONVE` backstop. `pad-workspace:` is authoritative. (b) **Base-layer load** — every project
  `CLAUDE.md` now explicitly loads `_universal/CLAUDE.md` via a prose "Base layer" line (load-bearing,
  surface-neutral) + an `@../../shared-context/_universal/CLAUDE.md` import (Code convenience).
  Confirmed via Claude Code: Cowork doesn't honor `@import`; the import resolves above cwd as
  content-inclusion. Added to TASK-141/147 with caveats + a one-time `/memory` verification note;
  aligned architecture §4. pad TASK-141/144/147 updated to match.

## Next
1. **David — sign off the revised memory section** (TASK-167 primary / TASK-143 / TASK-169 were not
   in the originally signed-off spec). Then move TASK-167/143/169 from `design` to build-ready.
2. After spec sign-off, promote build tasks (140–144, 147, 148, 167) to `ready`.
3. **TASK-144 (David)** — create the `Work` pad workspace (currently `ready`).

## Open decisions / blockers
- **Open:** the revised memory tasks (167/143/169) need David's design sign-off before build —
  they extend the previously signed-off spec.
- Note: TASK-167 (parent) won't close until its children 143/169 finish (pad open-children guard) —
  intentional, treats memory as one unit.
