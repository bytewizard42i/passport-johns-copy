# Experiment Brief — Contract Upgradability on Midnight v1

**Date scoped:** 2026/05/18
**Owner:** _to be assigned_
**Target location:** `experiments/contract-upgradability-feasibility/`

---

## Goal

Empirically determine, on the latest Midnight v1 SDK and devnet node, what
"upgradable smart contract" means in practice via the **Contract Maintenance
Authority** mechanism. Establish what can be changed on a live contract
after deployment, what cannot, and what the user-visible behaviour is during
an upgrade.

The deliverable is a strict, reproducible statement of what works, what
fails, and what only partially works on v1 today. No theoretical analysis —
every finding must be backed by a transaction hash or a specific node error
code.

## Why this matters

Hector and Karmel flagged upgradability as one of the three protocol-side
questions Passport needs answered this week (alongside prover benchmarks and
MPC risk review — 2026/05/18 chat). Passport's auth-scheme decision
([[project-passport-auth-scheme-decision]]) explicitly defers any move to
native ECDSA *"until Midnight ships smart-contract upgradability AND native
ECDSA"*: the latter half of that condition is a research dependency we now
need to nail down. Specifically:

- Can a verifier key for a deployed circuit be replaced with one compiled
  from updated circuit logic, while preserving the contract address and
  ledger state?
- Can new circuits be added to a deployed contract, or is the circuit set
  fixed at deploy time?
- Can the ledger state schema evolve (add fields, change types)?
- What happens to in-flight calls during the upgrade window?
- What is the recovery story if the maintenance authority key is lost?

The result determines whether Passport can ship a custody contract today
and migrate it forward, or whether every contract change forces a full
re-deploy + state migration + address rotation — which would be a major
constraint on the deployment model.

## In scope — test cases

Each test must produce either a successful transaction hash plus on-chain
state delta, or a specific node error code plus the captured response.

### Authority lifecycle

1. **U1 — Initial deploy and authority capture.** Deploy a minimal counter
   contract; record the initial maintenance authority public key from the
   on-chain contract metadata. *Baseline.*
2. **U2 — Authority rotation.** Use `submitReplaceAuthorityTx` (or
   `contractMaintenance.replaceAuthority()`) to rotate the maintenance
   authority to a new key. Confirm subsequent maintenance txs signed by the
   old key are rejected, and txs signed by the new key are accepted.
3. **U3 — Authority loss / recovery.** With the new authority key only,
   attempt to rotate authority signed by the *old* key. Expected: failure.
   Document the recovery story when the authority key is permanently lost
   (likely: none — contract is frozen in its current shape).

### Circuit lifecycle

4. **U4 — Disable circuit.** Remove the verifier key for one circuit
   (`incrementMaintenance.removeVerifierKey()`). Confirm a subsequent call
   to that circuit is rejected by the node. Confirm other circuits still
   work, and ledger state is unchanged.
5. **U5 — Re-enable with the same verifier key.** Re-insert the original
   verifier key. Confirm the circuit works again.
6. **U6 — Re-enable with a *new* verifier key (logic upgrade).** Recompile
   the contract with modified circuit logic (e.g. counter `increment`
   becomes `increment by 2`), extract the new verifier key, insert it.
   Confirm the circuit now executes the new logic against the *same*
   ledger state at the *same* contract address. **This is the critical
   "did we upgrade the contract?" test.**

### Schema and topology

7. **U7 — Add a brand-new circuit.** Compile a v2 of the contract that
   exposes an additional circuit not present in v1. Attempt to insert a
   verifier key for the new circuit name. Expected outcome unknown — the
   maintenance APIs operate on existing circuit slots; this surfaces
   whether circuit slots are fixed at deploy time.
8. **U8 — Evolve ledger state.** Compile a v2 of the contract that adds a
   new field to the ledger struct. Determine whether: (a) the deployed
   contract's ledger silently grows, (b) the upgrade is rejected, or (c)
   the new field is unreadable / forces a re-deploy.

### Observability

9. **U9 — In-flight calls during upgrade.** Submit a circuit call in
   block N, perform `removeVerifierKey` in block N+1, observe whether the
   first call lands. Documents the disruption window.
10. **U10 — Indexer / wallet visibility.** Inspect what the indexer
    publishes after each maintenance tx. Does a watching wallet see the
    authority change, the verifier-key change, the new circuit? This
    matters for partner wallets observing Passport contracts.

## Out of scope

- Cryptographic analysis of the maintenance signature scheme. We trust
  the protocol's signature check; we are testing developer surfaces.
- Performance benchmarking of maintenance txs.
- Multi-authority / threshold maintenance schemes (relevant later, not now).
- Wallet UX for surfacing upgrades to end users.
- Production-grade contract design. A minimal contract that exercises the
  operations is sufficient.

## Setup

- **Reference example**: SDK reference, *"Example 5: Contract Maintenance
  — Authority and Verifier Keys"* in
  [`docs/reference/machine-investigation/midnight-v1-documentation/sdk-reference.md`](../../docs/reference/machine-investigation/midnight-v1-documentation/sdk-reference.md)
  (line ~2498) covers the maintenance APIs end-to-end on a counter
  contract. Treat it as the starting point.
- **TS infrastructure**: copy the devnet harness from
  [`../contract-custody-feasibility/`](../contract-custody-feasibility/).
  Reuse the devnet docker config, the TypeScript package layout, the
  build/run scripts, and the evidence-capture pattern. Strip out custody
  application code.
- **Contracts**: write two minimal Compact contracts: a v1 counter
  (`upgradable_v1.compact` — `increment` adds 1) and a v2 counter
  (`upgradable_v2.compact` — `increment` adds 2, plus one new circuit
  `decrement` and one new ledger field) to exercise U6, U7, U8.
- **SDK**: latest published `@midnight-ntwrk/midnight-js-*` packages at
  the date the experiment is run. Pin exact versions in `FINDINGS.md`.
- **Node**: latest stable Midnight devnet node image. Pin the exact
  version.

## Deliverables

1. **`experiments/contract-upgradability-feasibility/`** — the experiment
   directory with the devnet harness, the v1 and v2 Compact contracts,
   and the TypeScript test runners.
2. **`experiments/contract-upgradability-feasibility/FINDINGS.md`** with:
   - **Header**: SDK package versions, node version, date the experiment
     was run, devnet commit/tag.
   - **Per-test-case results table**:
     `test name | status (PASS / FAIL / PARTIAL) | tx hash or error code | one-line note`.
   - **Per-area summary**: short paragraphs each for Authority lifecycle,
     Circuit lifecycle, Schema and topology, Observability.
   - **Verdict** — answers to the five questions in *Why this matters*,
     each backed by the relevant test IDs.
   - **Implications for Passport** — one paragraph on what this means for
     the custody contract migration path and for the auth-scheme decision
     (whether the ECDSA deferral is still well-founded).
3. **`experiments/contract-upgradability-feasibility/evidence/`** —
   per-test JSON files capturing the request, response, transaction hash
   (or error code + node response), and relevant node logs.
4. **Reproducibility**: a single command (e.g. `./run-all.sh`) that
   brings up the local devnet, runs every test, and writes the evidence
   files. Anyone with the pinned SDK installed must be able to reproduce
   the findings end-to-end on a clean checkout.

## Acceptance criteria

- Every test case in the In Scope list has a definitive result backed by
  an evidence file.
- The verdict in `FINDINGS.md` answers the five framing questions
  explicitly.
- The reproducibility command runs end-to-end on a fresh checkout.
- SDK and node versions are pinned and documented.

## References

- [`docs/reference/machine-investigation/midnight-v1-documentation/sdk-reference.md`](../../docs/reference/machine-investigation/midnight-v1-documentation/sdk-reference.md)
  § *Example 5: Contract Maintenance — Authority and Verifier Keys*
  (~line 2498) — the canonical end-to-end recipe for the maintenance
  APIs.
- [`../contract-custody-feasibility/`](../contract-custody-feasibility/)
  — TypeScript devnet infrastructure to copy.
- 2026/05/18 chat with Hector (memory `project_meeting_2026_05_18_hector`)
  — origin of the three-deliverable workstream.
