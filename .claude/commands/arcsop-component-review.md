---
description: Reviewer's assistant — read a component's canvas, ADR, and the canvases of every dependency and dependent, then surface inconsistencies in an uncommitted review report under .arcsop/reviews/.
argument-hint: <Cn>
---

You are running the component-review phase of the SOP for component
**$1**, acting as a reviewer's assistant. Your job is to surface
inconsistencies between $1 and its neighbours, **not to fix them**.
The reviewer decides.

## Conventions

- `.claude/CLAUDE.md` for project conventions.
- `.claude/rules/spelling.md` — read **only if present**; defaults
  otherwise are British English, Oxford comma, dates `YYYY/MM/DD`.
- No `Co-Authored-By` trailer in any commit (though this command
  doesn't commit anything — see Output below).

## Working directory

`.arcsop/` (untracked, project-root):

- `.arcsop/preferences.md` — load if present.
- `.arcsop/reviews/$1-review-<YYYYMMDD>.md` — the review report goes
  here. **The review is not committed**; it lives in the untracked
  `.arcsop/` tree.

Create `.arcsop/reviews/` silently if absent.

## Pre-flight

1. Read the canvas at `docs/plans/components/$1-*.md`.
2. Read any ADR(s) under `docs/adrs/` — search filenames and content
   for `$1`.
3. Read each **dependency** of $1 — components that $1 hard-depends on
   (Dependencies section + `site/data.js` `hard_deps`).
4. Read each **dependent** — components whose `hard_deps` include $1
   (search `site/data.js`).
5. Note relevant `docs/arc42.md` entries — §9 ADR entry for $1, §11
   risks if listed, §12 glossary if a term is owned by $1.

If $1 has no ADR, stop and tell the user — review applies to
finalised components only.

## Cross-check matrix

For each **dependency** of $1:

- Does $1's chosen alternative align with what its dependency assumes?
  E.g., if $1 picked Schnorr-on-Jubjub but a dep's canvas assumes
  ECDSA, FAIL.
- Has the dependency itself been finalised? If not, FLAG — $1's
  finalisation may be premature.
- Are the dependency's open questions still well-posed given $1's
  resolution?

For each **dependent** of $1:

- Does the dependent's canvas reference the alternative $1 actually
  picked, or does it still assume an older candidate? FAIL if
  mismatched.
- Are the dependent's open questions still well-posed given $1's
  resolution? FLAG if any were closed-by-assumption.
- Has the dependent been started or finalised? Note state.

## Workstream coupling

If $1 is in a workstream (check the canvas's `> **Workstream.**`
blockquote and `data.js` `workstreams`), or if any dep / dependent
is, surface the gating question. A finalised $1 cannot be more
committed than the gating workstream it sits inside.

## Output

Write `.arcsop/reviews/$1-review-<YYYYMMDD>.md` with three sections:

- **Passed.** Consistency checks that hold. One line each.
- **Flags.** Items the reviewer should look at — not blockers but
  worth attention. One paragraph each, with file references
  (`path:line` where applicable).
- **Failures.** Concrete inconsistencies that block the component
  from being treated as solid. One paragraph each, with proposed
  remediation written as **questions for the reviewer to answer**, not
  as auto-fixes.

End with a one-line summary: "Review verdict: PASS / FLAG / FAIL",
chosen by the most severe class present.

**Show the report to the user before writing it** — let them edit if
they spot something off.

## Style and behaviour

- Tight, factual. No editorial framing.
- Don't auto-fix anything.
- British English / Oxford comma / `YYYY/MM/DD` defaults.
- The review file is **not committed** (lives in `.arcsop/`).
