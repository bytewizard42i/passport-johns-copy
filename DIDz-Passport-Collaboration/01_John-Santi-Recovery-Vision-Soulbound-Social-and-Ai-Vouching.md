# John Santi's Recovery Vision — Soulbound Attributes, Social Recovery, and Ai Vouching

**Author:** John M.P. Santi (EnterpriseZK Labs; Midnight NightForce Bravo; Midnight Ambassador; Midnight Aliit cohort 0, inactive)
**Date captured:** 2026-07-04
**Maps to Passport:** Promise **P5** (recover-from-zero), Promise **P9** (selective
disclosure), Components **C14** (total-loss recovery flow), **C15** (helper protocol),
**C18/C20** (credentials / selective-disclosure proof), and **MIP-4 · STD-05 (Recovery paths)**.
**Status:** Living vision doc. Seed of our first substantive recovery contribution.

---

## 1. The message, verbatim (preserved, do not edit)

> Addressed to **@Hector (Midnight Foundation)** and **@Karmel**.

> You know, I have lots of ideas for Midnight Passport recovery. You are definitely on the right track. I have thought about this extensively.
>
> Choices are a great part of any UI. Having many 'soulbound' attributes is a super strong basis for the recovery, and I also love the social recovery. Facial recogition, fingerprint, voice, DNA, social security numbers, drivers license, FitBit bio fingerprint. Proving a m of n set of soulbound attributes that do not change are a great way to recover that psuedonomous passport object that lives immutably out in space. Having the ability to recover your soul bound object is one of the most powerful functions for Midnight. Being able to recover with your google or apple account should be an option as well, perhaps with some secondary method. Soulbound attributes in varied sets are super powerful, intuitive, and frictionless.
>
> The bottom line is to never being locked out of your soulbound passport object that is very hard to fake ownership of. I had this idea for Ai proctored soulbound 'traits'. I once got caught cheating in school because I drew a picture for a friend's art project. My art is distinctive and impressionist in nature. The art teacher was able to identify me in the whole school as the artist who made the picture. We interact with Ai every day and there is a measure of predictability where the Ai can challenge an individual having all the persistant memory of their past conversations and preferences. another powerful angle where you Ai could 'vouch' for you socially!
>
> This is so great. I talk about this in my DID video: (see `references/`).
>
> I had a project that was for Disaster relief. This would have helped with Venezuela. A combination of World Mobile and Starlink and Ai (see `references/`).

### Follow-up message (verbatim, 2026-07-04)

> So once you guys make passport, you will now have the infrastructure for self custodied, verifiable KYC I call this KYCz. It then allows a myriad of functionality such as lowered over collateralized loans and micro loans, instant real estate and other rwa qualifications. Super excitng stuff. Accurate and up to date credit scores and proof of reputation, participation, authority, and many other things.
>
> And this if you didnt get it: The bottom line is to never being locked out of your soulbound passport object that is very hard to fake ownership of. I had this idea for Ai proctored soulbound 'traits'. I once got caught cheating in school because I drew a picture for a friend's art project. My art is distinctive and impressionist in nature. The art teacher was able to identify me in the whole school as the artist who made the picture. We interact with Ai every day and there is a measure of predictability where the Ai can challenge an individual having all the persistant memory of their past conversations and preferences. another powerful angle where you Ai could 'vouch' for you socially!

_Note: the second paragraph reiterates the Ai-proctored soulbound-traits / Ai-vouching
vision captured in §2 and §3e above. The first paragraph adds a new pillar — the **KYCz
value narrative** — expanded in §8 below and in
`02_DIDzM-Ecosystem-Overview-for-the-Passport-Team.md`._

---

## 2. The core thesis

**Never let a person be locked out of their soulbound Passport object, while keeping
that object very hard to fake ownership of.** Recovery should be a *menu of choices*,
not a single brittle path. Strength comes from proving an **m-of-n set of soulbound
attributes** that do not change, in **varied, user-chosen combinations**, so the flow
is simultaneously strong, intuitive, and frictionless.

This directly extends Passport's C14 open question "**Recovery share scheme**" and
Alternative **D — Identity-proof-based recovery**, and it enriches C15's helper model
by widening what a "helper" or "factor" can be.

## 3. The factor taxonomy (recovery inputs)

John's list, organised into a taxonomy Passport can reason about. Each factor is a
*proof of a soulbound attribute*, disclosed selectively (P9) — the raw attribute never
needs to leave the user's device or be revealed on chain.

### 3a. Biometric soulbound factors (inherent, hard to change)
- Facial recognition
- Fingerprint
- Voice
- DNA
- FitBit / wearable **bio fingerprint** (heart-rate variability, gait, etc.)

### 3b. Credential soulbound factors (issued, verifiable)
- Social security number (proof-of, never the number itself)
- Driver's license
- Other KYC-grade attestations (the DIDz.io / KYCz wheelhouse)

### 3c. Custodial / OAuth factors (convenience, always paired)
- Google account
- Apple account
- Always combined with a secondary method — never sole custody.

### 3d. Social recovery factors (people)
- Trusted helpers holding shares (aligns with Passport's DeRec direction, C15).

### 3e. Ai-vouching factors (novel)
- An Ai that holds persistent memory of the user's past conversations, preferences,
  and behaviour can **challenge and vouch** for the individual. The predictability of
  a long-lived human↔Ai relationship becomes a recovery signal.
- **The distinctive-art analogy:** John was once identified across an entire school as
  the artist of a picture because his impressionist style is distinctive. Style,
  behaviour, and expression are themselves hard-to-fake soulbound traits. An Ai
  proctor can recognise a person the way that art teacher did — by their persistent,
  distinctive signal.

## 4. The mechanism: m-of-n over a soulbound attribute set

- The user registers a **set of n soulbound factors** across the categories above.
- Recovery requires proving any **m of n** (threshold), where m and n are user-chosen
  policy, surfaced as a clear UI choice ("choices are a great part of any UI").
- Each factor is proven as a **selective-disclosure proof** (P9 / C20): "I possess and
  control attribute X" without revealing X.
- The pseudonymous Passport object "lives immutably out in space" (on chain); the
  soulbound proofs re-attach a fresh device to that same object (I-5.3: same name,
  same balances, same attestations).
- **Non-collusion / anti-fake:** because factors span inherent biometrics, issued
  credentials, people, and Ai behaviour, no single compromised category can forge a
  quorum. This strengthens C14's "compromised helpers collude" failure mode.

## 5. Why this is powerful for Midnight specifically

- **Privacy-native fit.** Every factor is a ZK proof of a soulbound attribute, not a
  disclosure. Midnight is uniquely positioned to do recovery *without* building a
  honeypot of biometric or KYC data. Remove the privacy layer and the idea collapses,
  which is exactly the "privacy filter" test the Foundation judges by.
- **Frictionless + strong is the holy grail.** Varied m-of-n sets let a user recover
  with whatever they have on hand today, while an attacker must fake several
  independent, soulbound signals at once.
- **Recovering the soulbound object is, in John's words, "one of the most powerful
  functions for Midnight."** It is the difference between an account you can lose and a
  digital self you cannot be exiled from.

## 6. Open questions we should bring to the Passport team (extends C14/C15)

1. **Factor registry shape.** How does an account register its n factors and its m
   threshold on the account-custody contract (C1) without leaking the factor set?
2. **Issuer trust for credential factors.** How do SSN / license proofs bind to trusted
   issuers (DIDz.io / KYCz pattern) inside Passport's model?
3. **Ai-vouch soundness.** How do we make an Ai vouch verifiable and non-spoofable
   (e.g., Ai attests to a challenge/response bound to persistent memory), and how do we
   prevent the Ai itself from becoming a single point of failure or coercion?
4. **OAuth-as-factor safety.** Google/Apple as a *convenience* factor that is never
   sufficient alone — what is the minimum mandatory pairing?
5. **Quorum policy UX.** How do we present m-of-n choice so it is intuitive to
   non-experts while defaulting to a safe configuration?

## 7. Where this goes next

- Feed §3–§6 into `04_First-PR-to-Passport-Origin-Strategy.md` as the substance of a
  discussion post / MIP-4 contribution.
- Cross-referenced products that already build these primitives are catalogued in
  `02_DIDzM-Ecosystem-Overview-for-the-Passport-Team.md` and mapped in
  `03_DIDz-Product-to-Passport-Component-Crosswalk.md`.

## 8. The KYCz value narrative — what Passport unlocks

John's key strategic point: **the moment Passport ships, it becomes the infrastructure
for self-custodied, verifiable KYC** — what John calls **KYCz**. Passport gives the
world a named, recoverable, key-bound account; KYCz gives that account **portable,
privacy-preserving, self-custodied proofs of who you are and how you behave**. Together
they unlock a myriad of high-value functionality:

- **Lower over-collateralised loans and micro-loans.** Verifiable, self-custodied
  reputation and credit lets lenders reduce collateral requirements — the single biggest
  friction in DeFi lending — without a custodial data broker.
- **Instant real estate and other RWA qualifications.** Prove you qualify (income,
  residency, accreditation, jurisdiction) in one selective-disclosure proof, so
  real-world-asset onboarding becomes instant instead of a paperwork marathon.
- **Accurate, up-to-date credit scores.** A score derived from verifiable on- and
  off-chain history, held by the user, proven selectively — not siloed in a bureau.
- **Proof of reputation, participation, and authority.** Soulbound, hard-to-fake
  attestations of standing, contribution, and role — reusable across the ecosystem.

**Why this is Midnight-shaped:** every one of these is a *proof about the user*, never a
disclosure of the underlying data. It is the same privacy primitive as recovery
(selective disclosure of soulbound attributes, P9 / C20), pointed at economic
qualification instead of account recovery. Recovery and KYCz are **two faces of one
soulbound-credential engine.** This is the "super exciting" upside: Passport is not just
a wallet, it is the substrate for a verifiable, self-owned economic identity.

**Where it maps in Passport:** MIP-6 (ECO-02, privacy-preserving credentials) / C18 /
C20, with trusted-issuer binding from the KYCz / DIDz.io model. See
`02_...` (KYCz section) and `03_...` (crosswalk).

_Last updated: 2026-07-04._
