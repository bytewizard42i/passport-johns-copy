# First PR to Passport Origin — Strategy

How we make a first contribution to `midnightntwrk/passport` (and the Midnight
Improvement Proposals repo) that is small, genuinely useful, and lands us on the team's
radar on merit. "This is our chance to shine" — so the bar is: **useful to them, in their
format, low-risk, easy to say yes to.**

---

## What the repo tells us about how to contribute

- **The MIP process is the front door.** From `docs/plans/MIPS.md`: MIPs open as **pull
  requests against `midnightntwrk/midnight-improvement-proposals`**, Midnight has **no
  formal improvement-proposal process yet**, and **every MIP ships with a named external
  co-author** ("unilateral drafts become shelfware"). They are actively looking for
  external co-authors. That is our opening.
- **Recovery is an open, post-MVP MIP.** **MIP-4 · STD-05 (Recovery paths)** maps to
  **C14**, whose canvas lists open questions (share scheme, helper auth, quorum policy)
  and alternatives A–D. John's soulbound m-of-n vision is a natural **Alternative E** and
  a substantive MIP-4 input.
- **Credentials is another open MIP.** **MIP-6 · ECO-02 (Privacy-preserving credentials)**
  maps to C20 — KYCz / SCIFz territory.
- **There is a discussions surface.** MIP-0003 was strengthened via
  [discussion #129](https://github.com/midnightntwrk/midnight-improvement-proposals/discussions/129).
  Discussions are the low-friction way to float an idea before a PR.

## House style we must match in any upstream PR

The repo enforces its own conventions (see `.claude/rules/`):
- **British spelling** (authorise, organisation, licence, behaviour). Our internal
  `DIDz-Passport-Collaboration/` folder can use our own voice, but **PR content must match
  their spelling.**
- **Their date format** (YYYY/MM/DD in docs).
- **Apache-2.0**, IOG brand guidelines, and a spelling/lint CI on `.github/workflows`.
- Check for **DCO sign-off / CLA** before opening the PR (`git commit -s`).

## The ladder (smallest → boldest)

### Rung 0 — Warm contact + presence (no PR yet)
- Reach **Hector Bulgarini** (X `@hectorest06`, GitHub `hbulgarini`) — he authored the
  foundations demo and contributes to the MIP repo, so he is the right first human.
- Join the **Midnight Discord**; watch the passport / dev channels.
- Lead with John's credentials (NightForce Bravo, Ambassador) and a one-line offer:
  "I have extensive recovery design work I'd like to contribute to MIP-4."

### Rung 1 — Ice-breaker PR (trivial, real, low-risk)
- Find one genuine, tiny improvement in `midnightntwrk/passport`: a broken link, a
  typo caught by their own spelling rule, a docs clarity fix. Open it clean, DCO-signed,
  matching house style. Goal: become a known, merged contributor with zero controversy.

### Rung 2 — Substantive doc PR: C14 "Alternative E" (our real debut)
- Propose adding **Alternative E — m-of-n soulbound-attribute recovery (with Ai-vouch
  factor)** to the C14 canvas, plus a short entry in the C14 open-questions section.
- Content is a tightened, British-spelled, Passport-formatted distillation of file `01`
  (§3 taxonomy, §4 mechanism, §6 open questions). Framed as *input*, deferring to their
  DeRec direction rather than replacing it.
- This is the PR that shows we speak their model (P5 / C14 / C15) fluently.

### Rung 3 — Offer to co-author MIP-4 (Recovery paths)
- With Rung 2 merged and a warm relationship, offer John as the **named external
  co-author** MIP-4 explicitly needs. This is the "shine" outcome: John's name on a
  Midnight recovery standard.

## Draft artefacts to prepare (not yet opened)

1. **Discussion post** (midnight-improvement-proposals): "Soulbound m-of-n recovery + Ai
   vouching as input to MIP-4" — 3–5 paragraphs from file `01`.
2. **C14 Alternative E patch** — the exact markdown to add to
   `docs/plans/components/C14-total-loss-recovery-flow.md`, British-spelled.
3. **Outreach message to Hector** — short, humbly-confident, links to John's DID videos.

## Guardrails

- **Never** put our internal `DIDz-Passport-Collaboration/` folder into an upstream PR —
  it is our reference, not their content.
- Keep each PR **single-purpose and small**. No sweeping edits to their tree.
- Match spelling/date/lint or CI will bounce it.
- Get John's explicit go-ahead before anything is opened against origin.

## Status / next action

- [ ] John reviews and picks the target rung to start (recommend Rung 0 + prepare Rung 2 draft).
- [ ] Penny drafts the three artefacts above on request.
- [ ] Confirm DCO/CLA requirement on the target repos.

_Last updated: 2026-07-04._
