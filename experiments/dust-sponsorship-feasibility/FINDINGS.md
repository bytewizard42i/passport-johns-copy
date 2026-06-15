# DUST Sponsorship Feasibility — Findings

> **Status: executed 2026/06/11 on a fresh, isolated localnet.** All six
> tests have definitive results: five PASS, one PARTIAL whose "failure"
> is the refutation of a third-party warning. The headline: wallet-level
> DUST sponsorship lands end-to-end, including for the transaction shape
> Passport onboarding needs most — a zero-token user deploying a
> contract. The results table is regenerated mechanically from
> `evidence/*.json` by `src/compose-findings.ts`.

## Header

| Field | Value |
| --- | --- |
| Run date | 2026/06/11 |
| Node | `midnightntwrk/midnight-node:1.0.0` |
| Indexer | `midnightntwrk/indexer-standalone:4.3.3` |
| Proof server | `midnightntwrk/proof-server:8.1.0` |
| Compact compiler | 0.31.0 |
| Key SDK resolutions | `wallet-sdk-facade` 4.0.1 · `wallet-api` 5.0.0 · `ledger-v8` 8.1.0 · `midnight-js-*` 4.1.1 |
| Network | fresh localnet (`CFG_PRESET: dev`), isolated compose project (macOS host ports 19944/18088/16300) |

The brief pinned `midnight-node:0.22.5` when it was scoped. Per its own
instruction to bump on the day of the run, the experiment executed on the
repository's current stable stack (the same image set as
`../account-custody-prototype/`), which also matches where the public
networks are heading (Preview runs node 1.0.0 today).

## Headline findings

1. **Wallet-level DUST sponsorship works on this stack, end-to-end.**
   The two-phase flow from the brief is exactly what the SDK supports:
   the user balances `['shielded', 'unshielded']` (or builds a transfer
   with `payFees: false`), signs, and finalises; the sponsor calls
   `balanceFinalizedTransaction(tx, keys, { ttl, tokenKindsToBalance:
   ['dust'] })`, signs, finalises, and submits. The node accepts the
   two-balanced result (F1). Balances settle exactly: the user paid
   tokens and zero fees, the sponsor received the transfer and paid the
   fee from its DUST capacity.

2. **True zero-start onboarding works — including contract deployment.**
   A user holding zero NIGHT and zero DUST landed a sponsored circuit
   call (F2) and, decisively for Passport, a sponsored **contract
   deployment** (F6): the deploy transaction of a fresh account is
   sponsorable. The brief's contingency (F1 passes but F2 fails,
   forcing a NIGHT airdrop before sponsorship) did not materialise; no
   NIGHT prerequisite exists. The sponsored-provider seam is small: a
   midnight-js `walletProvider.balanceTx` that runs the user phase then
   the sponsor phase (`src/sponsorship.ts`), which is the sponsor
   service in miniature.

3. **The failure modes are operable from the sponsor side.**
   - *Insufficient sponsor DUST (F5)*: fails locally, inside
     `balanceFinalizedTransaction`, with `Insufficient Funds: could not
     balance dust` — before anything reaches the node. A sponsor
     service can detect capacity exhaustion client-side.
   - *TTL expiry (F4)*: a user transaction finalised with a 30 s TTL
     and processed by the sponsor 90 s later is rejected by the node at
     submission (`1010: Invalid Transaction: Custom error: 182`). The
     sponsor balancing with a fresh TTL does not resurrect an expired
     base transaction: the user's TTL is the sponsor service's hard
     latency budget.

4. **The tutorial's corruption warning is refuted on this stack (F3).**
   A sponsor that wrongly balances with `tokenKindsToBalance: 'all'`
   does not corrupt the transaction: with the user's unshielded section
   already balanced, the call degrades gracefully to dust-only
   balancing, the node accepts, and the user's change output survives
   intact (post-hoc re-sync of the user wallet settled at exactly the
   F1 outcome; see `postHocCheck` in the F3 evidence). The warning
   presumably described an older SDK. Recommendation unchanged: a
   sponsor should still pass `['dust']` explicitly — it states intent
   and guards against regressions in coin selection.

5. **A sponsor must not balance against its own unsettled state.**
   Discovered during harness bring-up: building a second sponsored
   transaction before the sponsor wallet has observed its previous
   spend re-spends the same dust coin, and the node rejects with
   `DustDoubleSpend(DustNullifier(...))`. A production sponsor service
   must serialise its balancing per wallet (or track pending dust
   spends); the harness settles by waiting for the prior transaction to
   appear in the sponsor's synced state.

## Observed fee magnitudes

Sponsor DUST deltas per sponsored transaction, net of the sponsor's
concurrent dust regeneration (indicative magnitudes, not precise fees):

| Transaction | Sponsor DUST delta |
| --- | --- |
| Night transfer (F1) | ≈ 1.5 × 10¹⁹ |
| Counter circuit call (F2) | ≈ 3.9 × 10¹⁵ |
| Counter contract deployment (F6) | ≈ 8.7 × 10¹⁸ |

The genesis sponsor's capacity (≈ 1.25 × 10²⁴) covered the whole suite
without noticeable depletion. For a public-testnet sponsor bootstrapped
from the faucet, these magnitudes plus the regeneration rate and cap
define the throughput envelope; measuring that envelope is sponsor-
service work, out of scope here.

## Notes for a wire-level sponsor service

The harness hands the finalised transaction from user to sponsor
in-process. As a bonus observation, `FinalizedTransaction.serialize()`
produced compact payloads (0.6–3.4 kB across F1, F2, and F6); the
probe's argument-less `deserialize` call fails, so a real service must
use the ledger's typed deserialize signature (marker arguments). Node
acceptance is unaffected by the handoff mechanism.

A harness-level caveat for whoever ports this: `findDeployedContract`
against a chain with days of history ground at full CPU with unbounded
wasm memory growth; against a fresh chain it returns immediately. Worth
knowing before pointing the flow at a long-lived public network.

## Per-test results

<!-- BEGIN-RESULTS-TABLE -->

| Test | Status  | Tx hash / error code | Note                                         |
| ---- | ------- | -------------------- | -------------------------------------------- |
| F1   | PASS    | 0030d3c2...d6117af   | Two-balanced tx accepted: user paid tokens,  |
| F2   | PASS    | 000125b4...18917ae   | User with zero NIGHT and zero DUST landed a  |
| F3   | PARTIAL | 00836fe6...7b707af   | Sponsor 'all' re-balance degraded gracefully |
| F4   | PASS    | ledger-182           | TTL-expired round-trip rejected at stage 'su |
| F5   | PASS    | insufficient-dust    | Broke sponsor failed locally at balanceFinal |
| F6   | PASS    | 0086c65c...3e5d455   | Zero-token user deployed a contract; sponsor |

<!-- END-RESULTS-TABLE -->

## Verdict

**Wallet-level DUST sponsorship is feasible on v1; alternative A in C24
is the path forward.** Every test produced a definitive result backed
by a transaction hash or a captured error; the negative tests failed in
ways a sponsor service can detect and handle.

## Implications for the Passport fee model (C24)

Alternative A (wallet-level fee splitting) moves from open question to
working evidence, and it covers the one transaction the other
alternatives handle worst: the account-contract deployment that begins
every Passport onboarding (F6). A fresh user needs no NIGHT, no DUST,
and no waiting for dust generation; the fee model can promise
zero-token onboarding outright, with NIGHT airdrop (B) demoted to an
optional follow-up that gives users long-term self-sufficiency rather
than a bootstrap prerequisite. The protocol surface is already public
SDK API; no contract-paymaster and no upstream changes are required.
What C24 must now specify is the sponsor service contract: sequential
dust accounting per sponsor wallet (finding 5), client-side capacity
detection (F5), the user-TTL latency budget (F4), explicit
`['dust']` balancing (F3), and the privacy trade-off that the sponsor
sees the user's finalised transaction before submission and can link
its dust spends to user activity. On the public networks the sponsor
bootstraps from the faucet and regenerates DUST from held NIGHT, so a
single funded wallet is a renewable fee source whose throughput
envelope follows from the magnitudes above.
