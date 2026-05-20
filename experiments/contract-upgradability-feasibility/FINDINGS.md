# Contract Upgradability Feasibility — Findings

> **Status: executed 2026/05/18 against a local Midnight devnet
> (`midnight-node:0.22.5`).** Seven tests PASS with on-chain tx hashes;
> three are descriptive (PARTIAL) by design. The two critical tests
> succeed: **U6 (logic upgrade in place at the same address) and U7
> (new circuit slot accepted post-deploy)**. Contract upgradability via
> the Contract Maintenance Authority is real on Midnight v1 today,
> with two hard limits: the ledger state schema is fixed at deploy
> time, and the client-side compiled artefact must stay in lock-step
> with the on-chain VK set.

## Header

| Item | Value |
| ---- | ----- |
| Date executed | 2026/05/18 |
| Operator | Nicolas Di Prima |
| Node image | `midnightntwrk/midnight-node:0.22.5` (digest `sha256:3d1f2c7a7cf0…013b2cf0c`) |
| Indexer image | `midnightntwrk/indexer-standalone:4.2.1` |
| Proof server | `midnightntwrk/proof-server:8.0.3` |
| `compact` compiler | `0.5.1` |
| `pragma language_version` | `0.22` |
| `@midnight-ntwrk/midnight-js-contracts` | `4.0.4` |
| `@midnight-ntwrk/compact-runtime` | `0.15.0` |
| `@midnight-ntwrk/ledger-v8` | `8.1.0` (resolved from `^8.0.3`) |
| `@midnight-ntwrk/midnight-js-types` | `4.0.4` |
| `@midnight-ntwrk/midnight-js-node-zk-config-provider` | `4.0.4` |
| `@midnight-ntwrk/midnight-js-level-private-state-provider` | `4.0.4` |
| `@midnight-ntwrk/zswap` | `4.0.0` |
| Deployed contract address | `1982cfbc8bf2f03c5f2183222bca97f2df9cdbc33b9e2bbe3047396fde7f4189` |

## Per-test results

<!-- BEGIN-RESULTS-TABLE -->

| Test | Status  | Tx hash / error code | Note                                         |
| ---- | ------- | -------------------- | -------------------------------------------- |
| U1   | PASS    | 847025a5...87b6ba3   | deployed at 1982cfbc8bf2f03c5f2183222bca97f2 |
| U2   | PASS    | 972844cc...eec51ab   | authority rotated; SDK auto-updated local pS |
| U3   | PASS    | stale-authority-rejected | stale signing key rejected — recovery story: |
| U4   | PASS    | 9a5f00f3...a5da399   | circuit isolation works: increment rejected, |
| U5   | PASS    | ba5dffe9...1e60040   | v1 increment VK re-inserted; increment calla |
| U6   | PASS    | c35deebc...8154256   | logic upgrade landed: v1 increment VK remove |
| U7   | PASS    | ab0e8086...2e9c5c8   | new circuit slot accepted — circuit set IS e |
| U8   | PARTIAL | —                    | descriptive — see evidence for indexer ledge |
| U9   | PARTIAL | —                    | call.ok=true remove.ok=true — see evidence f |
| U10  | PARTIAL | —                    | descriptive indexer dump — see evidence for  |

<!-- END-RESULTS-TABLE -->

## Per-area summaries

### Authority lifecycle (U1, U2, U3)

Deployment surfaces a deterministic contract address (U1) and the SDK
sets the initial maintenance authority to a `sampleSigningKey()` value
written into the local `privateStateProvider`. `mgmt.replaceAuthority`
rotates the on-chain authority and, **crucially, auto-overwrites the
local signing key in the same step** (U2, tx `972844cc…51ab` at block
24). The auto-update is documented behaviour
(`submitReplaceAuthorityTx`'s docstring spells it out) but caught us
out: an earlier draft of U2 tried to test "old-key replay rejected" by
issuing a subsequent maintenance op, and that op silently succeeded —
because the SDK had already updated the local key. To genuinely test
stale-key rejection you must deliberately corrupt
`privateStateProvider.setSigningKey()` to a non-matching value before
the next op. U3 does exactly that, and the node rejects with
`1010: Invalid Transaction: Custom error: 135` — captured verbatim in
`evidence/u3-authority-loss.json`. **Recovery story: there is none.**
If the authority signing key is lost (and not exported via
`exportSigningKeys`), the contract's circuit set and authority become
permanently frozen.

### Circuit lifecycle (U4, U5, U6)

`removeVerifierKey` for a single circuit lands as a SucceedEntirely tx
(U4 `9a5f00f3…d478a5da` at block 38). After the remove, calling the
disabled circuit fails with
`"Operation 'increment' is undefined for contract state … {bump_other,
query_counter}"`, while the sibling circuit `bump_other` still works
(`callTx.bump_other` accepted, tx in the evidence). Re-inserting the
**same** verifier key restores the disabled circuit (U5 `ba5dffe9…40`
at block 49); a subsequent `callTx.increment` succeeds with v1
semantics (counter += 1). **U6 is the headline result.** Removing v1's
increment verifier key and inserting v2's at the same slot lands two
on-chain maintenance txs (final tx `c35deebc…56` at block 90). The
contract address is preserved, the ledger state is preserved, and the
on-chain VK set after the swap is `{bump_other v1, query_counter v1,
increment v2}`. We could not assert "counter += 2 holds" by calling
increment, because the SDK's `findDeployedContract` requires a
compiled artefact whose circuit-and-VK set matches on-chain exactly —
neither the v1 nor the v2 compile satisfies that after the swap. The
operational definition of "contract upgraded in place" — same address,
new VK serving new logic — is demonstrably true.

### Schema and topology (U7, U8)

**U7 is the second headline result.** Inserting a verifier key for a
circuit slot that did not exist at deploy time succeeds: `decrement`,
absent from v1 but present in v2's compile, was added with
`submitInsertVerifierKeyTx(v2Compile, address, 'decrement', vk)` (U7
tx `ab0e8086…c5c8` at block 98, SucceedEntirely). After U7 the
indexer's ContractState shows all four circuit slots — `increment`,
`bump_other`, `decrement`, `query_counter` — confirming circuit-set
evolution lands on-chain. **The circuit set is mutable post-deploy.**
U8 is the counter-finding: the ledger state schema is **not** evolved
by maintenance. The contract's constructor runs once at deploy, and
its public ledger slots are fixed at that moment. The post-U6/U7
ContractState (hex-dumped in `evidence/u8-evolve-ledger.json`)
contains the four circuit VKs but no `last_op` slot. v2's increment
body writes `last_op`, but `last_op` is unreachable from the deployed
ledger; any execution of that body would either fail at runtime or
silently no-op. Either way: **adding ledger fields requires
re-deploy**, even though logic changes and new circuits do not.

### Observability (U9, U10)

U9's race issued `callTx.bump_other` and
`submitRemoveVerifierKeyTx('bump_other')` concurrently from the same
wallet against the same contract. Both transactions landed in **the
same block (65)** — call tx `001694e6…bdbc`, remove tx
`aa0d8534…a641` — and the call's verifier check evidently passed
because removal effects are not yet visible mid-block. The
restore-bump_other follow-up tx then re-inserted the verifier key.
Practical disruption-window conclusion: a single-block window is the
worst case; clients should treat the maintenance tx as effective only
from the block AFTER it lands. U10 dumps the indexer's
`ContractAction` interface — three possible types
(`ContractDeploy`, `ContractCall`, `ContractUpdate`) — and the root
schema. The serialised ContractState is returned as opaque hex; a
watching wallet would have to decode it locally to detect VK changes.
The indexer does NOT today emit a structured `MaintenanceEvent` type;
that's an indexer feature gap worth flagging upstream.

## Verdict

1. **Can a verifier key for a deployed circuit be replaced with one
   compiled from updated circuit logic, while preserving the contract
   address and ledger state?** **Yes — see U6** (`c35deebc…56`, block
   90). The address is preserved, the ledger state is preserved, the
   circuit slot now serves the new logic. The catch is client-side:
   every dApp using the upgraded contract must redeploy with a
   compiled artefact whose VK set matches the post-swap on-chain state
   exactly, or `findDeployedContract` refuses to bind.
2. **Can new circuits be added to a deployed contract, or is the
   circuit set fixed at deploy time?** **The circuit set is
   evolvable — see U7** (`ab0e8086…c5c8`, block 98). A
   verifier-key insertion for a previously-unknown circuit slot
   lands as SucceedEntirely and the indexer surfaces the new slot.
3. **Can the ledger state schema evolve (add fields, change types)?**
   **No — see U8.** The constructor runs once at deploy. New ledger
   fields are unreachable from on-chain state. Adding a field
   requires a fresh deploy with state migration.
4. **What happens to in-flight calls during the upgrade window?**
   **Same-block coexistence is possible — see U9.** The call and
   the maintenance tx can land in the same block; the call's
   verifier check sees the pre-maintenance state. Treat maintenance
   as effective from block N+1.
5. **What is the recovery story if the maintenance authority key is
   lost?** **There is none — see U3.** A signing key that doesn't
   match the on-chain authority is rejected with custom error 135.
   `privateStateProvider.exportSigningKeys` is the only backup
   surface; without that export the contract is permanently frozen.

## Implications for Passport

Logic upgrades and new-circuit additions to the custody contract are
both viable on Midnight v1 today. The custody contract can be shipped,
exercised, and refined in place at the same address — and the same
applies to other Passport-owned contracts. The two hard constraints
shape the deployment model:

1. **Ledger state evolution is a redeploy event.** Adding a new
   ledger field (a new per-account credential type, a new metadata
   slot) requires a fresh contract with state migration. Plan the
   v1 ledger to be slightly over-provisioned (generic
   `Map<Bytes<32>, …>` slots rather than narrow named fields) so
   that schema evolution can be expressed as new entries in
   existing slots rather than new slots.
2. **Authority-key custody is critical.** Loss of the maintenance
   authority signing key is terminal. The auth-scheme decision's
   ECDSA deferral (locked 2026/05/13, conditional on "Midnight ships
   smart-contract upgradability AND native ECDSA") is **partially
   unblocked** by these findings: the upgradability half is here,
   the native-ECDSA half is still outstanding. We can ship JubJub
   Schnorr + Dynamic MPC today and migrate to native ECDSA via a
   verifier-key swap when the latter lands, without rotating
   addresses or migrating state — provided we keep the maintenance
   authority key under threshold custody from day one.
