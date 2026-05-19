---
name: midnight-identity
description: "Use this skill for arc-passport work: Midnight Passport planning, ARC research, MIP/CIP-facing documentation, cryptographic experiments, subtree hygiene, IOG style conventions, and coordination with prototype repositories."
---

# ARC Passport Midnight Identity Skill

Use this skill from `arc-passport` when working on Midnight Passport planning, research, standards, experiments, or project documentation.

## Required Context

1. Read `.claude/CLAUDE.md` and `README.md` before changing repository content.
2. Follow `.claude/rules/` conventions, especially British English, date formatting, spelling, Rust style, and IOG brand guidance.
3. Do not commit `.planning/` or `.serena/`.
4. Do not edit subtree-owned content under `docs/reference/` or `experiments/nearfall-evaluation/`; update with `git subtree pull` when needed.

## Defaults

- Target branch is `main` unless instructed otherwise.
- This repo is planning/research/specification, not the active Passport prototype implementation.
- Keep implementation-specific changes in the prototype/examples repository unless the task is explicitly about experiments.

## Read First

- Stakeholder plan: `site/`
- Developer context: `research/README.md`
- Partner proposal: `docs/plans/README.md`
- Knowledge base: `docs/KNOWLEDGE_BASE.md`
- Experiments: `experiments/redjubjub-wallet/`, `experiments/redjubjub-wallet-rs/`, `experiments/contract-custody-feasibility/`

## Style

Use concise technical writing. Preserve ARC planning constraints and ecosystem-adoption framing from `.claude/CLAUDE.md`.
