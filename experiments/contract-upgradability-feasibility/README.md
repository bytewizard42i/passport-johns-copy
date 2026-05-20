# Contract Upgradability Feasibility — Experiment

This experiment empirically determines what "upgradable smart contract"
means on Midnight v1 via the **Contract Maintenance Authority** mechanism
— authority rotation, verifier-key insertion and removal, circuit-set
evolution, and ledger-state evolution.

It is a strict feasibility check — every result is backed by a
reproducible transaction hash or a specific node error code, no
theoretical analysis.

## Status

**Scaffolding only.** This directory currently contains
`README.md` + `EXPERIMENT_GUIDELINE.md` describing the experiment shape
and acceptance criteria. No `src/`, contracts, test runner, or evidence
exist yet.

## Why this matters

Hector and Karmel asked Passport (2026/05/18) to produce answers on
three protocol-side questions this week: upgradability, prover
benchmarks, and MPC risk. This experiment is the upgradability answer.

Passport's auth-scheme decision defers any move to native ECDSA *"until
Midnight ships smart-contract upgradability AND native ECDSA"*. We need
to know what the first half of that condition actually delivers on v1
today — what can change post-deploy, what cannot, and what happens to
ledger state and contract address during an upgrade.

## Where to start reading

| File                       | Purpose                                                                       |
| -------------------------- | ----------------------------------------------------------------------------- |
| `EXPERIMENT_GUIDELINE.md`  | The brief — goal, in-scope tests (U1–U10), setup, deliverables, acceptance    |
| (future) `FINDINGS.md`     | The spike report, populated when the experiment is run                        |
| (future) `contracts/`      | `upgradable_v1.compact` and `upgradable_v2.compact`                           |
| (future) `src/tests/`      | One TypeScript runner per test case                                           |
| (future) `evidence/`       | Per-test JSON: request, response, tx hash or error code, node-side notes      |

## Setup at-a-glance (when running)

Mirror the harness from
[`../contract-custody-feasibility/`](../contract-custody-feasibility/) —
same devnet docker config, same TypeScript package layout, same SDK
package family. Pin exact versions in `FINDINGS.md` at run time.

Anchor on the SDK reference, *"Example 5: Contract Maintenance —
Authority and Verifier Keys"* in
[`docs/reference/machine-investigation/midnight-v1-documentation/sdk-reference.md`](../../docs/reference/machine-investigation/midnight-v1-documentation/sdk-reference.md)
(~line 2498) — it covers the maintenance APIs end-to-end on a counter
contract. The ten in-scope tests are described in detail in
`EXPERIMENT_GUIDELINE.md`.
