---
lane: shared                     # work | home | shared
voice: home                      # which 00-resources voice file to load
pad-workspace: command-center    # where ideas/plans/tasks for this project are created
skills: []                       # personas/skills to adopt for this project (none)
attach:                          # shared-context folders this project pulls
  - shared-context/_universal
outputs: outputs/home/coworkos-unification
---

@../../shared-context/_universal/CLAUDE.md

> **Base layer:** before acting, read `shared-context/_universal/CLAUDE.md` and follow it on top of
> this file.

# CoworkOS Unification

## Identity

This is the meta-project that redesigns the CoworkOS-Home root itself — merging the
formerly-separate work and home Cloud OS environments onto one PC while keeping them
**logically segregated**. It dogfoods the very architecture it defines ("Approach B":
shared tree, lane-as-tag). When in doubt about how a project folder *should* look,
this folder is the reference implementation.

## Objective

A single CoworkOS-Home root where each project declares its lane (work/home/shared),
and lane drives voice, pad workspace, outputs path, attached shared-context, and
persona skills — replacing the old "two roots, no bleed" physical separation with a
logical one that works across both Cowork (navigate-the-root) and Claude Code
(attach-folders-per-session).

## Authoritative files

- **Design / architecture:** `design/architecture.md` — the full Approach B design.
- **Tracking:** pad PLAN-137 (`command-center`, project: general).

## Working notes

- This project's own `lane: shared` means: use the warmer home voice for its writing,
  but its scope spans both work and home structures.
- Keep `design/architecture.md` as the single source of truth; flesh it out there
  rather than scattering decisions across notes.
