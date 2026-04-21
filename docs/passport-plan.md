# Midnight Passport — Plan

> **Date:** 2026/04/21
> **Status:** Draft (pivoted 2026/04/21 — see `plans/` for the two paths under evaluation)
> **Audience:** Partners, collaborators, and stakeholders

---

## What Is Midnight Passport?

Midnight Passport is a user-facing identity and wallet layer for the
Midnight network. The goal: a user scans a QR code and lands on a
fully functional account — named, authenticated, ready to transact —
without ever seeing a seed phrase, a cryptographic address, or a
gas-token purchase screen.

Behind that experience, the system manages key custody, zero-knowledge
proof generation, privacy-preserving credentials, and multi-device
access. The user sees none of it.

## Why This Matters

Midnight's privacy technology is powerful but hard to access directly.
Today, interacting with the network requires managing cryptographic
keys, understanding multiple address types, and navigating proof
generation. No standard exists for how wallets connect to dApps, how
users prove identity attributes without revealing personal data, or
how accounts span multiple devices. Each implementor solves these
problems independently and incompatibly.

Midnight Passport addresses this by defining a common architecture and
the standards needed to make it interoperable.

## Two paths under evaluation

Following the 2026/04/21 review, the MVP can land via one of two
architectural paths. Both honour the six secure-onboarding design
principles; they differ in the custody model and in the scope of
MVP 1.

**[Plan A — decentralised but limited](./plans/plan-A-decentralised-but-limited/README.md)** *(current primary, for MVP by end of June 2026)*

- The user's passkey is the signing root; all crypto runs in the
  browser.
- Decentralised from Day 1; no MPC federation to trust or operate.
- Supported on a limited browser / OS matrix at MVP — Browser A on
  OS-1 and OS-2. **Status: product-owner-deferred decision** — a
  working recommendation exists; the final matrix is not locked.
- MVP 1 is strictly one-device-one-account. Genuine multi-device
  support (two or more physical devices under one account) is a
  near-term post-MVP priority, ahead of the original Milestone 2
  slot, because it gates recovery. Exact timing is to be refined in
  the next planning pass.
- Account recovery is not in MVP 1; recovery cannot be built until
  multi-device exists (multi-device first, recovery second).
- Where the user has enabled a platform passkey synchronisation
  service (Apple iCloud Keychain, Google Password Manager), the
  passkey may replicate across that user's own devices. This is
  convenient for the user who has opted in; it is **not** Passport
  multi-device and the product design does not rely on it.

**[Plan B — slow but universal](./plans/plan-B-slow-but-universal/README.md)** *(parked; foundation for Milestone 2 cross-chain)*

- FROST threshold-signing committee (n=5, t=4) holding the user's key
  via distributed key generation, operated by a single trust party at
  MVP.
- Universal browser / OS support; recoverable accounts by design.
- Depends on MPC infrastructure that does not exist yet and must be
  built from scratch.

### The trade-off

The pivot is a **custody-vs-recoverability** trade-off, not a
complexity-vs-simplicity one. Plan A delivers stronger
self-sovereignty on Day 1 at the cost of a narrower support matrix
and no account recovery at MVP. Plan B is universal and recoverable
at the cost of a temporary trust dependency on the MPC federation
and on infrastructure that must be built first.

The principles that survive unchanged in both plans are: single seed
→ three wallets, no seed phrase, privacy-preserving credentials, and
passkey onboarding. The principles that shift meaning across the two
plans are multi-device (absent at MVP 1 under Plan A — strictly
one-device-one-account — and a near-term priority thereafter),
recovery (absent at MVP 1 under Plan A, and gated on multi-device
landing first), and self-sovereignty (stronger in Plan A).

The detailed comparison lives in
`.planning/research/PLAN-A-vs-PLAN-B-analysis.md` (inside the
gitignored internal planning workspace).

## Status after 2026/04/21

- Plan A is being scoped; its architecture document is at
  [`plans/plan-A-decentralised-but-limited/architecture.md`](./plans/plan-A-decentralised-but-limited/architecture.md).
- Plan B is documented in full at
  [`plans/plan-B-slow-but-universal/`](./plans/plan-B-slow-but-universal/).
- The site (`site/the-plan.html`, `site/delivery-plan.html`) has **not
  yet** been updated to reflect this pivot and is stale until the next
  HTML revision lands.
- The internal roadmap (`.planning/ROADMAP.md`) and requirements
  register (`.planning/REQUIREMENTS.md`) have been updated against
  Plan A; the FROST work (MVP-01) is retained as Milestone 2 input.

## The delivery arc

The path from today to the full feature set is staged across named
milestones on a weekly-demo cadence. **MVP 1** is the June 2026
target; after June the plan continues on a 90-day cadence through
Milestone 2 (cross-chain and recovery), Milestone 3+ (credentials,
chain abstraction, SDK). Each milestone is an independently demoable
artefact; the user experience is intended to be stable across them
even as the trust model underneath evolves. The current week-by-week
schedule is still expressed in
[`site/delivery-plan.html`](../site/delivery-plan.html) against the
old Plan B assumptions and will be revised in the next HTML pass.

---

*ARC — Input Output Global, 2026/04/21*
