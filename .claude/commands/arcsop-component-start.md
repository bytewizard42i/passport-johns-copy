---
description: Begin the component-completion SOP for a component — read its canvas, walk the alternatives with the user, propose and (with consent) scaffold an experiment.
argument-hint: <Cn> (component ID, e.g. C5)
---

You are running the component-start phase of the SOP for component
**$1**.

## Conventions

- `.claude/CLAUDE.md` for project conventions.
- `.claude/rules/spelling.md` — read **only if present**; defaults
  otherwise are British English, Oxford comma, dates `YYYY/MM/DD`.
- No `Co-Authored-By` trailer in any commit.
- No "(by X, YYYY/MM/DD)" attribution parentheticals in committed
  prose.

## Working directory

`.arcsop/` (untracked, project-root) for state that survives a
`/clear`:

- `.arcsop/preferences.md` — load if present.
- `.arcsop/progress/component-$1-start-<YYYYMMDD>.md` — checkpoint at
  the end of this phase.

Create `.arcsop/progress/` silently if absent.

## Pre-flight

1. Locate the canvas at `docs/plans/components/$1-*.md`. If absent,
   stop and tell the user — `/arcsop-init` should have stubbed it.
2. Read the canvas in full.
3. Read this component's entry in `site/data.js` for `hard_deps` and
   `associations`.
4. Check `experiments/` for any topic-named directory that already
   validates this surface — match by canvas keywords, not by `Cn`
   prefix (the convention here is topic slugs).
5. Check whether $1 sits in a workstream (look for the
   `> **Workstream.**` blockquote at the top of the canvas, or the
   `workstreams` list in `data.js`).

Report findings in one paragraph. If $1 is in an unresolved workstream
or depends on one, explicitly flag that the workstream may need to
land first; ask whether to proceed regardless.

## Walk the alternatives

- Quote each alternative from the canvas verbatim — don't paraphrase.
- For each, restate what it commits to and what it costs in one line.
- If the canvas already names an MVP pick or v1.0 reading, surface
  that.
- Ask: which alternative do you want to pursue, and **why**?

The "why" is the seed of the future ADR. Capture it verbatim — it gets
re-used at `/arcsop-component-finalize` time.

## Propose an experiment

Once the alternative is picked:

- Suggest the smallest validating experiment — the concrete question
  it answers, what success looks like, what falsifies it.
- Propose a directory name following the existing pattern
  (`experiments/<topic-slug>/` rather than `experiments/Cn-*/`).
- Propose a README skeleton: goal, hypothesis, method, expected
  output.
- Ask: scaffold now, or wait?

If scaffolding: create the directory, write the README, add a stub
`Cargo.toml` / `package.json` if obvious from neighbouring
experiments. **Show before writing.**

## Annotate the canvas

Add a one-line note to the canvas's Readings section (or create the
section if absent): "**In progress** — pursuing alternative {X},
validating via `experiments/{slug}/`. Started YYYY/MM/DD."

Don't yet declare it the v1.0 deliverable — that's
`/arcsop-component-finalize`'s job.

## C26 touch

Append a "(in progress)" entry to
`docs/plans/components/C26-ai-agent-skills.md` under a "Surfaces in
motion" section so the AI-skills work knows what's being built. Create
the section if absent.

## Checkpoint

Write `.arcsop/progress/component-$1-start-<date>.md` capturing:

- Chosen alternative.
- The "why" verbatim (ADR seed).
- Experiment directory and link.
- Anything the user flagged for follow-up.

Suggest `/clear` if no further work in this turn depends on the
current in-context content.

## Style and behaviour

- One step at a time. Show before writing.
- British English / Oxford comma / `YYYY/MM/DD` (or local override
  from `spelling.md` if present).
- No `Co-Authored-By` trailer in any commit.
