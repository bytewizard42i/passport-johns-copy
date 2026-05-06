---
description: Stand up docs/arc42.md by iterating with the user through promises → invariants → components → arc42 §1–§3. Writes or updates PROMISES.md, components, and arc42.md as the project's state requires.
argument-hint: (no arguments)
---

You are running the SOP-init workflow. The job is to bring the project's
architectural backbone into being or up to date — promises, invariants,
components, and the first three sections of `docs/arc42.md` — through an
iterative conversation with the user. The project may be at zero
(nothing yet authored) or partway through; pre-flight tells you which.

## Conventions

Pull project conventions before starting:

- `.claude/CLAUDE.md` — project description, constraints, repository
  layout. Respect every "What not to do" item.
- `.claude/rules/spelling.md` — read **only if present**, do not assume.
  It encodes the locale preference.
- Defaults if no spelling rule is loaded: British English, Oxford
  comma, dates `YYYY/MM/DD`.
- No `Co-Authored-By` trailer in any commit.
- No "(by X, YYYY/MM/DD)" attribution parentheticals in committed prose.

## Working directory

The SOP uses `.arcsop/` (untracked, project-root) for temporary state
that survives a `/clear`:

- `.arcsop/preferences.md` — load if present; learn and append as the
  conversation reveals user preferences (preferred verbosity, naming
  conventions, etc.).
- `.arcsop/progress/init-<YYYYMMDD>.md` — write a checkpoint at the end
  of every phase below so progress survives a context clear.

If `.arcsop/` is absent, create it (and the `progress/` subdirectory)
silently. Do not create a README — the directory is purely scratch.

## Pre-flight discovery

Discover the project's current state:

1. Does `docs/plans/PROMISES.md` exist? If yes, read it.
2. Does `docs/plans/components/README.md` exist? If yes, read it.
3. Are there any component canvases under
   `docs/plans/components/Cn-*.md`? List them.
4. Does `docs/arc42.md` exist? If yes, read it.
5. Does `docs/adrs/` exist? List any ADRs.

Report the findings in one paragraph and ask whether the user wants to
**bootstrap from zero** or **review and supplement** what's already
there.

## Phase 1 — Promises

If `docs/plans/PROMISES.md` is **absent**:

- Open with: "What is this project promising its users?" Iterate.
  Don't drive — gather. The promises emerge from the user, not from
  you.
- Each promise should be one sentence: a user-observable property the
  system commits to.
- Number them `P1 … Pn` as they land.
- When the user says "that's the set", draft `docs/plans/PROMISES.md`
  and **show it before writing**.

If PROMISES.md is **present**:

- Summarise the existing promises in one line each.
- Ask: "Want to review, edit, supplement, or move on?" Iterate only on
  what the user wants to touch.

When Phase 1 closes, checkpoint to `.arcsop/progress/init-<date>.md`
and offer the user a `/clear` if there's no in-context content the next
phase needs.

## Phase 2 — Invariants

Invariants are properties the system *must* keep true to keep its
promises. They sit between promises (what users see) and components
(what the team builds).

- Look for an existing convention in the repo: search for the `I-N.M`
  pattern (invariant M of promise N). If found, the convention is in
  place — work within it.
- If absent: propose the `I-N.M` shape and confirm with the user.
- For each promise, walk: "What must always be true for this promise to
  hold?" Iterate until the user is satisfied.
- Capture the invariants where they belong — either as sub-sections of
  each promise inside `PROMISES.md`, or as a separate
  `docs/plans/INVARIANTS.md` if the volume warrants it. Ask the user
  which shape they prefer.

Show the result before writing. Checkpoint and offer a `/clear`.

## Phase 3 — Components

Components are the surfaces the project needs to build to honour the
invariants.

If `docs/plans/components/` is **empty or absent**:

- Walk each invariant and ask: "What functional surface delivers
  this?"
- A component is named at the level where alternative mechanisms exist
  for the same surface — concrete enough to build, abstract enough to
  hide implementation.
- Number them `C1 … Cn`. Each gets its own canvas file.
- Use the existing canvas template if there's a precedent in the repo
  (read any `Cn-*.md` to learn the shape). Otherwise stub the standard
  five-field template: **Outcome**, **Dependencies**, **Open
  questions**, **Failure modes**, **Alternatives**.
- Maintain `docs/plans/components/README.md` as the inventory and
  Promises → Components map.

If components are **present**:

- Summarise the inventory (count, category breakdown).
- Ask: "Want to review, edit, supplement, or move on?"

Checkpoint and offer a `/clear`.

## Phase 4 — arc42 §1, §2, §3

Stand up `docs/arc42.md` itself.

- **§1 Introduction & Goals** — pull from PROMISES.md. Do not
  duplicate — link out and summarise inline.
- **§2 Constraints** — pull from `.claude/CLAUDE.md` and any
  environmental constraints surfaced in earlier phases.
- **§3 Context & Scope** — external systems, interfaces, boundaries.
  If a parallelisation map exists (e.g. `site/data.js`,
  `site/parallelisation.html`), reference it.

§4–§12 should be stubbed with a one-line "filled when …" placeholder
each, so future phases of the SOP know where their content goes:

- §4 Solution Strategy — filled as the major architectural strategies
  land.
- §5 Building Block View — references `components/README.md`.
- §6 Runtime View — filled as key scenarios are captured.
- §7 Deployment View — filled when the wallet / chain / off-chain
  split firms up.
- §8 Crosscutting Concepts — grows incrementally.
- §9 Architecture Decisions — list of ADRs; populated by
  `/arcsop-component-finalize`.
- §10 Quality Requirements — filled from invariants and quality goals.
- §11 Risks & Technical Debt — populated by
  `/arcsop-component-finalize` and `/arcsop-component-review`.
- §12 Glossary — grows incrementally.

Also stub `docs/adrs/0000-template.md` if `docs/adrs/` doesn't already
hold one — the standard ADR template (Status, Context, Decision,
Consequences, References).

Show every file before writing. Checkpoint when Phase 4 closes.

## Style and behaviour

- Conversational throughout. Don't draft three phases in one turn.
  Confirm each phase before moving on.
- Never write a file the user has not seen. Show the draft, accept
  edits, then write.
- After each phase that wrote files, suggest the user run `/clear` if
  the next phase doesn't depend on the in-context content (the
  checkpoint files cover continuity).
- Preserve any existing user preferences in `.arcsop/preferences.md`;
  append new ones, don't overwrite.
