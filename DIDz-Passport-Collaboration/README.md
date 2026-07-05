# DIDz ↔ Passport Collaboration

This folder is the working bridge between **John M.P. Santi's DIDz / DIDzMonolith
(DIDzM) ecosystem** and **Midnight Passport** (IOG / ARC's user-facing identity
and wallet layer for Midnight).

It lives inside John's fork (`bytewizard42i/passport-johns-copy`, vendored into
DIDzMonolith as `midnight-Passport-johns_copy`). Its purpose is to cross-pollinate
ideas in both directions and to prepare a first, high-value contribution back to
`midnightntwrk/passport` and the Midnight Improvement Proposals (MIP) process.

## Golden rules for this folder

1. **Never lose information.** We only add. Older thinking is kept, dated, and
   superseded-in-place with a note, never deleted.
2. **Namespaced, never mixed into upstream.** Everything ours lives under this
   `DIDz-Passport-Collaboration/` directory so that `git pull upstream main`
   never conflicts with IOG's files. Our internal ideas are **not** the PR
   content; the PR is a separate, upstream-shaped artefact (see file `04`).
3. **Verbose, intuitive filenames.** A future reader (human or Ai) should know a
   file's contents from its name alone.
4. **Map to their model.** Where possible, tie our ideas to Passport's ten
   promises (P1–P10), twenty-five components (C1–C25), and the MIP pipeline, so
   our contributions speak the team's language.

## Contents

| File | What it holds |
|---|---|
| [`01_John-Santi-Recovery-Vision-Soulbound-Social-and-Ai-Vouching.md`](01_John-Santi-Recovery-Vision-Soulbound-Social-and-Ai-Vouching.md) | John's recovery vision, preserved verbatim, then expanded and mapped to P5 / C14 / C15 / MIP-4. The seed of our recovery contribution. |
| [`02_DIDzM-Ecosystem-Overview-for-the-Passport-Team.md`](02_DIDzM-Ecosystem-Overview-for-the-Passport-Team.md) | A concise tour of the DIDz product family for someone on the Passport team, with the one-line "why this matters to Passport" for each. |
| [`03_DIDz-Product-to-Passport-Component-Crosswalk.md`](03_DIDz-Product-to-Passport-Component-Crosswalk.md) | The bidirectional map: our products ↔ their promises/components. The heart of the cross-pollination. |
| [`04_First-PR-to-Passport-Origin-Strategy.md`](04_First-PR-to-Passport-Origin-Strategy.md) | How we make our first PR to origin: what, where, with whom, and in what order. |
| [`05_Passport-Whiteboard-Session-Key-Takeaways.md`](05_Passport-Whiteboard-Session-Key-Takeaways.md) | Distilled facts + cross-pollination map from the Charles/Karmel/Hector whiteboard session. |
| [`06_Why-John-Author-Background.md`](06_Why-John-Author-Background.md) | John's origin story in his own words: EncryptVault, day-one Midnight, the bartender scenario, Night Paper. Context and credibility for the recovery (MIP-4) and credentials (MIP-6) proposals. |
| [`references/John-Santi-DID-Videos-and-SentinelDID-Disaster-Relief.md`](references/John-Santi-DID-Videos-and-SentinelDID-Disaster-Relief.md) | Source material: John's DID videos and the SentinelDID disaster-relief concept (Venezuela / World Mobile / Starlink / Ai). |
| [`references/Passport-Product-Presentation-Whiteboard-Transcript-2026.md`](references/Passport-Product-Presentation-Whiteboard-Transcript-2026.md) | Full verbatim transcript (EN + RU) of the Passport product presentation / whiteboard session. |

## Who

- **John M.P. Santi** — EnterpriseZK Labs LLC; Midnight NightForce Bravo; Midnight
  Ambassador; Midnight Aliit cohort 0 (inactive); Cardano Certified Blockchain
  Associate; Emurgo Certified Blockchain Business Consultant; Midnight Academy
  triple-certified.
- **Ecosystem** — the DIDzMonolith superrepo of privacy-first products built on
  Midnight, with identity (DIDz.io) and identityless KYC (KYCz) at the foundation.

## Passport team contacts (for warm collaboration)

- **Karmel ("Carmel")** — **Passport product lead** (confirmed by Charles Hoskinson in the
  whiteboard session), backed by ARC. GitHub `Karmoola` (X likely `@karmoola`, verify).
- **Hector Bulgarini** — GitHub `hbulgarini`, X `@hectorest06`. Runs the technical demo;
  authored the `demo/mn-passport-foundations` end-to-end demo. Best first technical contact.
- General: the official Midnight Discord and the
  [`midnight-improvement-proposals`](https://github.com/midnightntwrk/midnight-improvement-proposals)
  repo (discussions + MIP PRs).

_Last updated: 2026-07-04._
