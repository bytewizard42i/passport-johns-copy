# C14 Alternative E — Proposed Patch + Rationale

_The substantive debut contribution (file 04, Rung 2): adding **Alternative
E — m-of-n soulbound-attribute recovery, with an Ai-vouch factor** to the
Passport C14 total-loss-recovery canvas. Distilled from file 01 (John Santi's
recovery vision), tightened to the canvas's terse house style, framed as
input that defers to the DeRec direction rather than replacing it._

**Author:** John Santi (johnny5i) — NightForce Bravo,
Midnight Aliit cohort 0 (inactive)
**Status:** Draft, not yet opened upstream · **Date:** 2026/07/05
**Target file:** `docs/plans/components/C14-total-loss-recovery-flow.md`
**Spelling:** British, to match the repo.

---

## Part 1 — The exact patch (paste-ready)

Append after the existing **Alternative D** at the end of C14. This is the
only change; it matches the A–D format exactly.

```markdown
**E — m-of-n soulbound-attribute recovery** (varied factor sets; strongest
anti-collusion). The user registers *n* soulbound factors spanning distinct
categories — inherent biometrics (face, fingerprint, voice, wearable bio
signal), issued credentials (driver's licence, SSN-proof, other KYC-grade
attestations), paired custodial/OAuth (Google/Apple, never sole), trusted
people (DeRec helpers, per C15), and a novel **Ai-vouch factor** — and
recovers by proving any *m of n* as selective-disclosure proofs (P9 / C20),
never revealing the underlying attributes. Because a quorum must span
independent categories, no single compromised category (a leaked biometric,
a coerced helper set, a phished OAuth) can forge recovery — directly
strengthening this canvas's "compromised helpers collude" failure mode.
Extends Alternative D from a single KYC proof to a user-chosen threshold over
a heterogeneous soulbound set, and enriches C15 by widening what counts as a
"factor". *Open sub-question: Ai-vouch soundness (see below).*
```

And append these lines to the C14 **Open questions** section:

```markdown
**Factor-set registration.** How does an account register its *n* factors and
its *m* threshold on C1 without leaking the factor set itself?

**Ai-vouch soundness.** Can an Ai that holds persistent memory of a user's
behaviour vouch verifiably (challenge/response bound to that memory) without
itself becoming a single point of failure or a coercion target?
```

---

## Part 2 — Rationale (for the review conversation, not the patch)

This is the depth to draw on when the Passport team asks "how does this
actually work?" — so the patch can stay terse while we stay ready.

### The thesis, in one line

Never let a person be locked out of their soulbound Passport object, while
keeping that object very hard to fake ownership of. Recovery should be a
**menu of choices**, not a single brittle path.

### Why m-of-n over a *heterogeneous* set is the key idea

Existing alternatives lean on one mechanism each: A/C on social shares, B on a
backup blob, D on a single KYC re-proof. Each has one dominant failure mode
(lose the friends, lose the blob, the issuer is down or coerced). Alternative
E's strength is **category diversity**: the *n* factors deliberately span

- **inherent biometrics** — face, fingerprint, voice, DNA, wearable bio
  fingerprint (heart-rate variability, gait);
- **issued credentials** — licence, SSN-proof, KYC-grade attestations (the
  DIDz/KYCz wheelhouse), bound to trusted issuers;
- **custodial/OAuth** — Google/Apple, admitted only as a *convenience* factor
  that is never sufficient alone;
- **people** — DeRec-style helpers (so E composes with A/C, not against them);
- **Ai-vouch** — see below.

An attacker must now fake several *independent, soulbound* signals at once.
That is a categorically harder problem than compromising any single channel,
and it is what turns "frictionless" and "strong" from a trade-off into a
both-at-once — the recovery holy grail.

### The Ai-vouch factor (the novel part)

The insight, in John's words: we interact with an Ai every day, and a
long-lived human↔Ai relationship has a **measure of predictability**. An Ai
holding persistent memory of a person's past conversations, preferences, and
behaviour can *challenge* that person and *vouch* for the match.

The intuition pump is the **distinctive-art analogy**: John was once
identified across an entire school as the artist behind a picture, purely
because his impressionist style is distinctive. Style, behaviour and
expression are themselves hard-to-fake soulbound traits. An Ai proctor can
recognise a person the way that art teacher did — by their persistent,
distinctive signal — and contribute that recognition as *one factor in the
quorum*, never as a sole authority.

### Why this is Midnight-shaped (the privacy filter)

Every factor is a **ZK proof of a soulbound attribute, not a disclosure**.
Midnight can therefore offer recovery *without* building a honeypot of
biometric or KYC data — the exact "remove the privacy layer and it collapses"
test the Foundation judges by. Recovery here is selective disclosure (P9 /
C20) pointed at re-attaching a device to the pseudonymous account object that
"lives immutably out in space" (I-5.3: same name, same balances, same
attestations).

### How it relates to the existing alternatives

Alternative E does not replace DeRec — it **contains** it (people are one of
the five factor categories) and generalises Alternative D (one KYC proof
becomes a user-chosen threshold over a heterogeneous set). It is deliberately
additive and deferential: DeRec remains the default; E is the richer policy
surface for users who want it.

### The strategic upside to mention lightly (KYCz)

The same soulbound-credential engine that powers recovery also powers
**self-custodied verifiable KYC** ("KYCz"): once Passport gives the world a
named, recoverable, key-bound account, the same selective-disclosure proofs
unlock lower-collateral lending, instant RWA qualification, user-held credit
scores, and portable proof of reputation/authority. Recovery and KYCz are
**two faces of one engine** — worth a sentence in discussion, not in the
patch (which stays strictly on-topic for C14).

---

## Part 3 — Do-not-forget checklist before opening upstream

- [ ] John's explicit go-ahead to open against `midnightntwrk`.
- [ ] Warm contact first (Hector Bulgarini, `@hectorest06` / `hbulgarini`).
- [ ] DCO sign-off (`git commit -s`) / CLA check on the target repo.
- [ ] British spelling + YYYY/MM/DD dates (done above) so their lint CI passes.
- [ ] Single-purpose PR: **only** the C14 Alternative E + open-questions
      lines. No other edits to their tree.
- [ ] Attach nothing from `DIDz-Passport-Collaboration/` — this folder is our
      reference, not their content.
