# Experiment Brief — DUST Sponsorship Feasibility on Midnight v1

**Date scoped:** 2026/04/30
**Owner:** _to be assigned_
**Target location:** `experiments/dust-sponsorship-feasibility/`

---

## Goal

Empirically determine, on the latest Midnight v1 SDK and devnet node,
whether the wallet-level DUST fee sponsorship pattern — where a sponsor
wallet pays the DUST fees of a user's transaction via
`tokenKindsToBalance` splitting — lands successfully on
`midnight-node:0.22.5`.

The deliverable is a strict, reproducible statement of what works, what
fails, and what only partially works on v1 today. Every finding must be
backed by a transaction hash or a specific node error code.

## Why this matters

The Passport v1.0 fee model
([`.planning/concrete-plan.md` § C24](../../.planning/concrete-plan.md))
hinges on whether a fresh-account user with zero NIGHT and zero DUST can
transact. The neighbouring experiment
[`../contract-custody-feasibility/`](../contract-custody-feasibility/)
confirmed (D1, D2 FAIL) that **contract-paymaster** — a Passport
contract paying its own or a user's fee branch — is not implementable
on v1. A third-party tutorial (see References) describes a
**wallet-level** sponsorship flow using existing SDK surfaces with no
contract-paymaster involvement.

The pattern has been verified at the type level: `TokenKindsToBalance`,
`balanceUnboundTransaction`, and `balanceFinalizedTransaction` are
present in `@midnight-ntwrk/wallet-api: ^5.0.0` and
`@midnight-ntwrk/wallet-sdk-facade` (see References for exact file
paths). What is **not** verified is whether the resulting two-balanced
transaction is accepted by the node. This experiment closes that gap.

The result determines whether **alternative A** in C24 (wallet-level
fee splitting) is the v1.0 path forward, or whether we fall back to
**B** (NIGHT airdrop, slower bootstrap), **C** (hybrid), or **D**
(user pre-funds NIGHT externally).

## Pattern summary

Per the third-party tutorial, the sponsorship flow is:

1. **User phase.** User wallet calls
   `balanceUnboundTransaction(tx, secretKeys, { ttl, tokenKindsToBalance: ['shielded', 'unshielded'] })`,
   then `signRecipe()`, then `finalizeRecipe()`. The user balances
   their own shielded and unshielded tokens but **excludes DUST**.

2. **Sponsor phase.** Sponsor wallet receives the partially-balanced
   transaction, calls
   `balanceFinalizedTransaction(tx, secretKeys, { ttl, tokenKindsToBalance: ['dust'] })`,
   then `signRecipe()`, `finalizeRecipe()`, and `submitTransaction()`.
   The sponsor adds DUST balancing from its own DUST capacity, signs,
   and submits.

The result is a single fully-balanced transaction with both parties'
contributions baked in. No contract-paymaster fee branch is involved.

## In scope — test cases

Each test must produce either a successful transaction hash plus
on-chain state delta, or a specific node error code plus the captured
response.

### F1 — Happy path

User wallet (holds NIGHT, has zero or near-zero DUST) initiates a
trivial Night transfer. User calls
`balanceUnboundTransaction(..., { tokenKindsToBalance: ['shielded', 'unshielded'] })`
and finalises. Sponsor wallet (separate seed, holds NIGHT-derived DUST
capacity) calls
`balanceFinalizedTransaction(..., { tokenKindsToBalance: ['dust'] })`,
signs, and submits.

**Pass criterion.** Transaction hash returned; indexer confirms
inclusion; user's Night balance reflects the transfer; sponsor's DUST
capacity reflects the fee deduction.

### F2 — True zero-NIGHT, zero-DUST onboarding

Same as F1 but the user wallet has **zero NIGHT** *and* **zero DUST**
at start. The user's only on-chain action is a name registration or a
trivial circuit call that does not require a Night spend — i.e., the
fee is the only economic component of the transaction.

**Pass criterion.** Transaction lands successfully despite the user
holding no fee-paying capacity. If F1 passes but F2 fails, the
implication is that the user must hold *some* NIGHT for the
sponsorship to work — material for the bootstrap UX, since the sponsor
would need to airdrop NIGHT separately and then wallet-level-sponsor
the user's first NIGHT-spending transaction.

### F3 — Re-balance corruption (negative)

Sponsor incorrectly calls `balanceFinalizedTransaction` with
`tokenKindsToBalance: 'all'` instead of `['dust']`, attempting to
re-balance the user's already-balanced shielded/unshielded portion.

**Pass criterion.** Failure observed and characterised. Confirms (or
refutes) the tutorial's "double-spending errors" warning. The error
shape — local exception or post-submission rejection, error code,
recovery path — is itself the deliverable.

### F4 — TTL expiry across the round-trip

User signs and finalises with a short TTL (e.g., 30 seconds). Sponsor
deliberately delays processing past TTL, then attempts submission.

**Pass criterion.** Failure observed; node returns a specific
TTL-related error code. Establishes the latency budget the sponsor
service has between receiving a user's finalised transaction and
submitting the dual-balanced result.

### F5 — Sponsor with insufficient DUST (negative)

Sponsor wallet has DUST capacity below the fee required for the user's
transaction.

**Pass criterion.** Sponsor's `balanceFinalizedTransaction` call fails
locally, before submission, with a clear error indicating insufficient
DUST. Confirms the failure mode is detectable client-side, not silent
or post-submission.

### F6 — Sponsored contract deployment

Same two-phase flow as F2, but the user's transaction is a **contract
deployment** rather than a circuit call. The user wallet has zero NIGHT
and zero DUST. A minimal contract (the same counter contract F2 uses)
is deployed via `midnight-js` `deployContract`, with the deploy
transaction balanced in two phases: the user balances
`['shielded', 'unshielded']` (a no-op for a fresh wallet) and signs;
the sponsor balances `['dust']`, signs, and submits.

**Why this is in scope.** A Passport onboarding's *first* transaction
is the per-account contract deployment
(see [`../account-custody-prototype/`](../account-custody-prototype/)).
F1–F5 cover transfers and circuit calls only; if sponsorship does not
extend to deployment transactions, a fresh user cannot create their
account contract without pre-funding, and alternative A fails for the
onboarding flow specifically — the single most important transaction
in the Passport lifecycle.

**Pass criterion.** Deployment lands; the contract address is
queryable on the indexer; the user wallet spent nothing and holds
nothing; the sponsor's DUST capacity reflects the fee deduction.

## Out of scope

- Contract-paymaster patterns. Already covered (negatively) by D1, D2
  in `contract-custody-feasibility/`.
- Multi-sponsor fallback or sponsor directory behaviour. The experiment
  uses a single sponsor wallet; directory behaviour is a sponsor-service
  architecture concern, not a node-acceptance concern.
- Sponsor-service abuse mitigation (rate limits, proof-of-personhood) —
  out of node-acceptance scope.
- Performance benchmarking, except where an operation is so slow it is
  effectively unusable.

## Setup

- **Language**: TypeScript only. The pattern lives in
  `@midnight-ntwrk/wallet-api`, exercised via
  `@midnight-ntwrk/wallet-sdk-facade`.
- **Reference TS infrastructure**: mirror the harness from
  [`../contract-custody-feasibility/`](../contract-custody-feasibility/).
  Reuse the devnet docker config, the TypeScript package layout, and the
  build/run scripts. Replace the test contracts with whatever minimal
  Compact contract is needed for F2 (a trivial counter or
  name-registration circuit). F1 needs no contract — a plain Night
  transfer is enough.
- **SDK**: pin to the same `@midnight-ntwrk/wallet-api: ^5.0.0` and
  `@midnight-ntwrk/wallet-sdk-facade` versions as
  `contract-custody-feasibility/`. Pin exact published versions in
  `FINDINGS.md` at run time.
- **Node**: `midnightntwrk/midnight-node:0.22.5` (same as
  `contract-custody-feasibility/`). Pin in `FINDINGS.md`.
- **Wallets**: two separate seed phrases, two separate wallet
  instances. Sponsor wallet must be funded with sufficient NIGHT to
  generate the DUST capacity required by the test plan.

## Deliverables

1. **`experiments/dust-sponsorship-feasibility/`** — the experiment
   directory with the devnet harness, any minimal contracts, and the
   TypeScript test runner.
2. **`experiments/dust-sponsorship-feasibility/FINDINGS.md`** with:
   - **Header**: SDK package versions, node version, date the experiment
     was run, devnet commit/tag.
   - **Per-test-case results table**:
     `test name | status (PASS / FAIL / PARTIAL) | tx hash or error code | one-line note`.
   - **Verdict** — exactly one of:
     - *Wallet-level DUST sponsorship is feasible on v1; alternative A
       in C24 is the path forward.*
     - *Wallet-level DUST sponsorship is partially feasible; specific
       conditions {list}.*
     - *Wallet-level DUST sponsorship is not feasible on v1; fall back
       to alternative B, C, or D in C24.*
   - **Implications for the Passport fee model (C24)** — one paragraph
     stating which alternative path is on the table given the result,
     feeding back into
     [`.planning/concrete-plan.md` § C24](../../.planning/concrete-plan.md).
3. **`experiments/dust-sponsorship-feasibility/evidence/`** — per-test
   JSON files capturing request, response, transaction hash (or error
   code + node response), and relevant node logs.
4. **Reproducibility**: a single command (e.g., `./run-all.sh`) that
   brings up the local devnet, runs every test, and writes the evidence
   files. Anyone with the pinned SDK installed must be able to reproduce
   the findings end-to-end on a clean checkout.

## Acceptance criteria

- Every test case in the In Scope list has a definitive result backed
  by an evidence file.
- The verdict in `FINDINGS.md` is one of the three above, justified by
  the per-test results.
- The reproducibility command runs end-to-end on a fresh checkout.
- SDK and node versions are pinned and documented.

## References

- **Tutorial (third-party):**
  https://gist.githubusercontent.com/wilsonhoe/df6e272e892b19404b93d564796feff6/raw/06c9d91ade4d4d2c33733fa791a7b80cc3869e30/TUTORIAL.md
- **API verification (local SDK source):**
  - `@midnight-ntwrk/wallet-sdk-facade/dist/index.d.ts:13–14` —
    `TokenKindsToBalance` type definition.
  - `@midnight-ntwrk/wallet-sdk-facade/dist/index.d.ts:144–149` —
    `balanceFinalizedTransaction(..., { tokenKindsToBalance })` signature.
  - `@midnight-ntwrk/wallet-sdk-facade/dist/index.d.ts:151–156` —
    `balanceUnboundTransaction(..., { tokenKindsToBalance })` signature.
  - `@midnight-ntwrk/wallet-sdk-facade/README.md` lines 72–125 — usage
    example with `tokenKindsToBalance: ['shielded', 'dust']`.
- **Plan tracking:**
  [`.planning/concrete-plan.md` § C24](../../.planning/concrete-plan.md)
  (Fee model).
- **Related experiment:**
  [`../contract-custody-feasibility/`](../contract-custody-feasibility/)
  — established that contract-paymaster (D1, D2) is not feasible on v1;
  this experiment tests the alternative wallet-level path.
- **Design doc context:**
  [`docs/reference/.../secure-onboarding-design.md` § 5.6](../../docs/reference/machine-investigation/key-flows/secure-onboarding-design.md)
  — DUST Fee Model.
