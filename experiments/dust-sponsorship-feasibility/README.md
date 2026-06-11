# DUST Sponsorship Feasibility — Experiment

This experiment empirically determines whether the wallet-level DUST fee
sponsorship pattern — where a sponsor wallet pays the DUST fees on a
user's transaction via `tokenKindsToBalance` splitting — actually lands
on the Midnight node end-to-end.

It is a strict feasibility check: every result is backed by a
reproducible transaction hash or a specific node error code, no
theoretical analysis.

## Status

**Executed 2026/06/11** against `midnight-node:1.0.0` (the repository's
current stable stack; the brief's original 0.22.5 pin was bumped on the
day of the run, per the brief's own instruction). Verdict:
**wallet-level DUST sponsorship is feasible on v1; alternative A in C24
is the path forward.** Five tests PASS with on-chain transaction
hashes; F3 is PARTIAL because the tutorial's corruption warning did not
reproduce (the wrong `'all'` re-balance degrades gracefully) — itself a
finding. Decisively for Passport, F6 shows a **zero-NIGHT, zero-DUST
user deploying a contract** with the sponsor paying the fee: the
onboarding transaction shape is sponsorable. See
[`FINDINGS.md`](./FINDINGS.md) for the results table, fee magnitudes,
sponsor-service requirements, and the C24 implications.

## Why this matters

The Passport v1.0 fee model
([`.planning/concrete-plan.md` § C24](../../.planning/concrete-plan.md))
hinges on whether a fresh-account user with zero NIGHT and zero DUST can
transact at all. The neighbouring experiment
[`../contract-custody-feasibility/`](../contract-custody-feasibility/)
established that **contract-paymaster** (a contract paying its own or a
user's fee branch) is not implementable on v1 (D1, D2 FAIL).

A community-published tutorial describes a **wallet-level** alternative
using existing SDK surfaces. The relevant APIs
(`balanceUnboundTransaction`, `balanceFinalizedTransaction`,
`tokenKindsToBalance`) are confirmed present in
`@midnight-ntwrk/wallet-api: ^5.0.0` and `@midnight-ntwrk/wallet-sdk-facade`.
What is **not** confirmed is whether the resulting two-balanced
transaction is accepted by the node. This experiment closes that gap.

## Where to start reading

| File                       | Purpose                                                                  |
| -------------------------- | ------------------------------------------------------------------------ |
| `EXPERIMENT_GUIDELINE.md`  | The brief — goal, in-scope tests (F1–F6), setup, deliverables, acceptance |
| `FINDINGS.md`              | The spike report: results table, verdict, C24 implications               |
| `src/tests/`               | One TypeScript runner per test case                                      |
| `src/sponsorship.ts`       | The two-party flow under test, plus sponsored midnight-js providers      |
| `evidence/`                | Per-test JSON: balances, tx hash or error code, node-side notes          |

## Running it

```sh
./run-all.sh           # localnet up + compile + all six tests + FINDINGS table
./run-all.sh --fresh   # reset chain state first
./run-all.sh --tests f1,f6
```

The harness mirrors
[`../contract-custody-feasibility/`](../contract-custody-feasibility/)
(same TypeScript layout, same SDK package family) with images bumped to
the [`../account-custody-prototype/`](../account-custody-prototype/)
stack. On macOS the localnet binds host ports 19944/18088/16300 so it
runs beside the prototype's stack (9944/8088/6300) — sharing a chain
means sharing its history, and `findDeployedContract` grinds on aged
chains. Exact SDK resolutions are pinned in every evidence file.

The six tests — F1 happy path, F2 zero-NIGHT zero-DUST onboarding, F3
re-balance corruption (negative), F4 TTL expiry, F5 sponsor with
insufficient DUST (negative), F6 sponsored contract deployment — are
described in detail in `EXPERIMENT_GUIDELINE.md`. Two wallet seeds are
required (one user, one sponsor); no new contracts are required for F1,
and only a minimal counter contract for F2 and F6.
