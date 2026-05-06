---
description: Finalise a component — write its ADR, close the canvas, update arc42 and C26, run the verification checklist.
argument-hint: <Cn>
---

You are running the component-finalize phase of the SOP for component
**$1**.

## Conventions

- `.claude/CLAUDE.md` for project conventions.
- `.claude/rules/spelling.md` — read **only if present**; defaults
  otherwise are British English, Oxford comma, dates `YYYY/MM/DD`.
- No `Co-Authored-By` trailer in any commit.
- No "(by X, YYYY/MM/DD)" attribution parentheticals in committed
  prose. Use "we now know …" framing instead.

## Working directory

`.arcsop/` (untracked, project-root):

- `.arcsop/preferences.md` — load if present.
- `.arcsop/progress/component-$1-start-*.md` — load any earlier
  start-phase checkpoint to recover the alternative chosen and the
  "why" the user committed to. If no start-phase checkpoint exists,
  ask the user whether they want to run `/arcsop-component-start`
  first or proceed regardless.
- `.arcsop/progress/component-$1-finalize-<YYYYMMDD>.md` — checkpoint
  as you go.

## Pre-flight

1. Read the canvas at `docs/plans/components/$1-*.md`.
2. Locate the matching experiment in `experiments/`. Read its
   README and any results file. **If results aren't yet recorded, stop
   — the SOP requires a demonstrable experiment outcome before
   finalising.**
3. Read `docs/arc42.md`. If absent, suggest `/arcsop-init` and stop.
4. Read `docs/plans/components/C26-ai-agent-skills.md`. If absent,
   note that the C26 touch will be skipped this run.
5. List existing ADRs in `docs/adrs/` to find the next free number
   (NNNN, zero-padded). If `docs/adrs/0000-template.md` is missing,
   stub it from the standard ADR template before continuing.

If any prerequisite fails, stop and tell the user.

## Draft the ADR

Path: `docs/adrs/<NNNN>-<slug>.md`. Pull the slug from the component
name (e.g. `0001-signing-primitive-schnorr-jubjub.md`).

Sections:

- **Status** — `Accepted` with date `YYYY/MM/DD`.
- **Context** — one paragraph: what surface, what was open, what the
  canvas debated.
- **Decision** — the chosen alternative quoted verbatim from the
  canvas, plus the "why" captured at component-start.
- **Consequences** — positive and negative, including any new risks
  introduced.
- **References** — canvas link, experiment link, related arc42
  sections.

1–2 pages. **Show before writing**; invite edits.

## Close the canvas

Edit `docs/plans/components/$1-*.md`:

- Move the chosen alternative into the Readings section under
  "**v1.0 delivered**" with a link to the new ADR.
- Mark resolved open questions as resolved (strike them or move them
  to a "Resolved" sub-section).
- Move residual open questions to a "Residual" sub-section.
- Update External dependencies if the experiment surfaced new ones.

## Update arc42

In `docs/arc42.md`:

- **§9 Architecture Decisions** — append `- [<NNNN>](adrs/<NNNN>-<slug>.md) — <one-line summary>`.
- **§11 Risks & Tech Debt** — if the chosen alternative carries a
  known residual risk, append a one-liner with a link back to the
  canvas's failure modes.
- **§12 Glossary** — if the component introduced new vocabulary (a
  primitive name, a protocol term), add it.

## Update C26

In `docs/plans/components/C26-ai-agent-skills.md`:

- Move the "(in progress)" entry from "Surfaces in motion" to a
  "Covered surfaces" register. Create the register section if it's
  the first run.
- Entry format:
  `- **$1** — <component name> · ADR <NNNN> · Canvas link · audiences eligible: <end-user / dev / PM>`.

## Verification checklist

Before declaring done, walk through with the user:

- [ ] Experiment exists under `experiments/<slug>/` and produces a
      demonstrable result documented in its README.
- [ ] Canvas reflects v1.0 delivery and cross-links the ADR.
- [ ] ADR committed under `docs/adrs/`.
- [ ] arc42 §9 has the ADR entry.
- [ ] C26 register has the surface entry (or note skipped if C26
      absent).

If any item fails, stop. The SOP requires all five (the C26 item is
waivable only if the C26 canvas itself is absent from the project).

## Checkpoint

Write `.arcsop/progress/component-$1-finalize-<date>.md` capturing:

- ADR number and slug.
- Summary of canvas changes.
- Whether the verification checklist passed cleanly.
- Any items queued for `/arcsop-component-review`.

Suggest `/clear` once the verification checklist is green.

## Style and behaviour

- Conversational on the ADR draft.
- Show before writing. Never commit a file the user hasn't seen.
- British English / Oxford comma / `YYYY/MM/DD` defaults.
- No `Co-Authored-By` trailer.
- No attribution parentheticals in committed prose.
