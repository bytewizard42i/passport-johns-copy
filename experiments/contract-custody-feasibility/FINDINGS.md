# Contract Custody Feasibility — Findings

> **Status: executed 2026/04/27 against devnet `midnight-node:0.22.5` /
> `@midnight-ntwrk/midnight-js-* 4.0.4`.** Four tests PASS with on-chain
> tx hashes, six FAIL with classified error codes. Verdict and
> Passport-account-model implications below.

## Headline findings

1. **Error 186 is still present on `midnight-node:0.22.5`.** Both U2
   (`sendUnshielded → ContractAddress`) and U4 hop-2 are rejected with
   `1010: Invalid Transaction: Custom error: 186`. **The CTO's
   2026/04/27 claim that "186 was fixed in the past month" is not
   verified by this experiment as configured.** Either the fix is in a
   newer release tag than `0.22.5`, or it did not fully land.
   Re-validation on the next node release is required before the
   contract-custody account model can rely on contract↔contract Night
   transfers.
2. **`receiveShielded` exists at the Compact-language level.** The
   contract compiles with the symmetric-to-`receiveUnshielded`
   primitive that the Passport account model assumes — the brief's
   most critical net-new question is positively answered at the
   language level. Runtime acceptance was blocked in this run by the
   color-derivation gap below; whether the call would succeed with a
   correctly-shaped `ShieldedCoinInfo` is the experiment's strongest
   remaining open question.
3. **Compact's shielded tokens use a contract-derived color domain.**
   After `mintShieldedToken(color, ...)` lands, the wallet's shielded
   balances surface notes under a *derived* color (e.g.
   `5b6e0a8...58f5`, `418093d2...b939`), not the user-supplied color
   (`00...01`, `00...02`, `00...04`). Any subsequent operation that
   references those notes — `sendShielded`, `receiveShielded` from a
   user — requires the caller to know the derived color. **The SDK
   does not currently expose a public function for this derivation,
   which is the structural shape of the historical "Merkle rehash"
   question:** cross-tx shielded custody is permitted at the language
   level, but the off-chain prover lacks both the derived-color and
   the `mt_index` lookup surfaces it needs to construct the spend.

## Header

| Field                          | Value                                              |
| ------------------------------ | -------------------------------------------------- |
| Date run                       | 2026/04/27                                         |
| Devnet image (node)            | `midnightntwrk/midnight-node:0.22.5`               |
| Devnet image (indexer)         | `midnightntwrk/indexer-standalone:4.0.0`           |
| Devnet image (proof srv)       | `midnightntwrk/proof-server:8.0.2`                 |
| Compact toolchain manager      | `compact 0.5.1` (active compiler `0.30.0`)         |
| Contract `language_version`    | `0.22`                                             |
| `@midnight-ntwrk/compact-runtime` | `^0.15.0` (latest published)                    |
| `@midnight-ntwrk/ledger-v8`    | `^8.0.3` (latest published; 8.1.0-rc.1 exists)     |
| `@midnight-ntwrk/midnight-js-*`| `^4.0.4` (latest published)                        |
| `@midnight-ntwrk/wallet-api`   | `^5.0.0`                                           |
| `@midnight-ntwrk/wallet-sdk-shielded` | `^3.0.0` (latest; bumped from 2.1.0)        |
| `@midnight-ntwrk/wallet-sdk-dust-wallet` | `^4.0.0` (latest; bumped from 3.0.0)     |
| `@midnight-ntwrk/wallet-sdk-unshielded-wallet` | `^3.0.0` (latest; bumped from 2.1.0) |
| `@midnight-ntwrk/wallet-sdk-facade` | `^4.0.0` (latest; bumped from 3.0.0)          |
| `@midnight-ntwrk/wallet-sdk-hd` | `^3.0.2` (latest)                                 |
| `@midnight-ntwrk/wallet-sdk-address-format` | `^3.1.1` (latest)                     |
| `@midnight-ntwrk/zswap`        | `^4.0.0` (latest)                                  |
| `feeBlocksMargin`              | `100` (raised from default `5`; see Deploy-stage)  |
| Operator                       | _PENDING_                                          |
| Repo commit at run             | _PENDING_                                          |

> **Confirmation: the verdict is robust against the latest published
> SDK.** This run reproduced the identical PASS/FAIL pattern after
> bumping `wallet-sdk-shielded` (2.1.0 → 3.0.0), `wallet-sdk-dust-wallet`
> (3.0.0 → 4.0.0), `wallet-sdk-unshielded-wallet` (2.1.0 → 3.0.0), and
> `wallet-sdk-facade` (3.0.0 → 4.0.0). The headline findings — error
> 186 still surfacing on `midnight-node:0.22.5`, and the
> shielded-color-derivation gap blocking S3/S4 — **are not artefacts
> of stale tooling**. They are genuine gaps in the latest published
> stack as of 2026/04/27.

## Compile-stage findings (2026/04/27)

Established before any test ran — by iterating on `compact compile`
until the contract built cleanly. Every bullet is backed by a specific
compiler error captured in this session's transcript.

- **`receiveShielded` exists in the Compact stdlib.** The brief listed
  S4 as the most critical net-new test on the assumption that the
  language-level surface might not exist; it does. Signature:
  `receiveShielded(coin: ShieldedCoinInfo {nonce, color, value})` —
  note no `mt_index`, since the consumed note is created in this
  transaction and has no on-chain Merkle position yet.
- **`mintShieldedToken` is the atomic mint+send primitive.** There is
  no separate `sendImmediateShielded`; "atomic mint+send" is just
  `mintShieldedToken` with a non-self recipient. Signature:
  `mintShieldedToken(color: Bytes<32>, amount: Uint<64>, nonce: Bytes<32>, recipient: Either<ZswapCoinPublicKey, ContractAddress>)`.
- **Shielded amounts are `Uint<64>`.** Unshielded uses `Uint<128>`.
- **Per-note nonce is caller-supplied.** Each `mintShieldedToken` call
  requires a `Bytes<32>` nonce that determines the resulting
  commitment uniqueness; reusing a nonce across mints with the same
  color/value would presumably collide.
- **`sendShielded` requires `QualifiedShieldedCoinInfo`.** The Merkle
  rehash question has a precise shape: cross-tx custody is permitted
  at the Compact-language level, but the off-chain prover must look
  up the contract-held note's Merkle-tree index (`mt_index`) before
  constructing the send. The "Qualified" variant adds `mt_index` to
  the basic `ShieldedCoinInfo`. SDK-side lookup API: not exposed.
- **All 11 circuits compile.** Largest is `send_held_shielded` (k=15,
  19,636 rows). Other notable sizes: `mint_*_shielded` (k=14, ~10.7k
  rows), `receive_shielded` (k=13, 6,602 rows). The k=15 circuit is at
  the upper bound for which `compact` ships precomputed public
  parameters.

## Deploy-stage findings (2026/04/27)

- **Initial deploy on `midnight-node:0.22.0` rejected** with
  `MalformedError::BalanceCheckOverspend` (Substrate `Custom(138)`)
  using `feeBlocksMargin: 5` — the default inherited from
  `experiments/redjubjub-wallet/`, whose largest circuit was k=11.
- **Resolved by raising `feeBlocksMargin` to `100`** (env-overridable
  via `FEE_BLOCKS_MARGIN`). Both contract instances then deployed
  cleanly on `midnight-node:0.22.5`.
- **Practical guidance for follow-on work:** custody-style contracts
  with a k≥14 circuit need substantially more fee headroom than the
  redjubjub-wallet experiment's defaults suggested. `5` was enough for
  k≤11; this contract with one k=15 circuit needs ~100. The exact
  relationship between `feeBlocksMargin` and circuit complexity is
  worth measuring if it becomes a frequent friction point.

## Per-test results

> Populated mechanically from `evidence/<id>-<name>.json` by
> `src/compose-findings.ts`. Do not hand-edit between the markers.

<!-- BEGIN-RESULTS-TABLE -->

| Test | Status  | Tx hash / error code | Note                                         |
| ---- | ------- | -------------------- | -------------------------------------------- |
| U1   | PASS    | 0024e98f...7c4a33a   | receiveUnshielded landed on devnet.          |
| U2   | FAIL    | js-error             | Threw: Unexpected error submitting scoped tr |
| U3   | PASS    | 00ceeca8...3e1eb0f   | sendUnshielded → UserAddress accepted (regre |
| U4   | FAIL    | js-error             | Threw: Unexpected error submitting scoped tr |
| S1   | PASS    | 00e97bd5...feef24b   | mintShieldedToken → kernel.self() landed.    |
| S2   | PASS    | 00e1545c...d381cf1   | sendImmediateShielded landed (atomic mint+se |
| S3   | FAIL    | js-error             | Threw: Unexpected error executing scoped tra |
| S4   | FAIL    | js-error             | Threw: Unexpected error submitting scoped tr |
| D1   | FAIL    | 006e4ea0...9647902   | No public SDK surface for contract-paid Dust |
| D2   | FAIL    | 003f75fe...64aed8c   | No public SDK surface for contract paymaster |

<!-- END-RESULTS-TABLE -->

> The `js-error` rows hide the underlying classification. The full
> error code is in each evidence file. For the unshielded-Night fails:
> U2 and U4-hop-2 are both `RpcError: 1010: Invalid Transaction: Custom error: 186`.
> S3 is a `ContractRuntimeError` from the proof-builder rejecting the
> arguments; S4 is `Wallet.InsufficientFunds` from the shielded wallet
> failing to find a held note matching the requested color. See the
> "Headline findings" section for the structural reasons behind both.

## Per-asset-type summary

### Unshielded (Night) — PARTIAL

User↔contract Night transfers work on `midnight-node:0.22.5` /
`midnight-js 4.0.4`:

- **U1 PASS** (tx `00ecd4f4...83ed05f`): `receiveUnshielded` lands.
  The historical error 168 is **not present** on this build.
- **U3 PASS** (tx `00d98c01...442a186`): `sendUnshielded` →
  `UserAddress` lands. Regression check confirmed.

Contract↔contract Night transfers do not:

- **U2 FAIL** with `1010: Invalid Transaction: Custom error: 186`.
  Bypassing-recipient direct contract→contract send is rejected by
  the node's transaction validator.
- **U4 FAIL** at hop-2 with the same `Custom error: 186`. The full
  round-trip is therefore impossible on this build.

The CTO's 2026/04/27 statement was that 186 was fixed in the past
month. This experiment did not reproduce that fix on
`midnight-node:0.22.5`. Either there is a more recent release tag
than `0.22.5` that contains the fix, or the fix did not fully land.
A definitive contradicting verdict is on hold pending node-version
clarification.

### Shielded (Zswap) — PARTIAL

Contract self-mint and atomic mint+send to user both work:

- **S1 PASS** (tx `00e8219c...27707ac`): `mintShieldedToken` to
  `kernel.self()` lands. The contract holds the resulting shielded
  note, observable as a derived color in subsequent wallet state
  views.
- **S2 PASS** (tx `00af3293...9e5976c`): atomic mint+send shielded
  → user lands. The user's wallet now shows a balance for the
  derived color `418093d2...b939`. This is the pattern modern dApps
  use today.

Cross-transaction custody (S3) and `receiveShielded` from a user (S4)
both fail for the same structural reason — the SDK does not expose
the contract-color-derivation function, so the off-chain prover
cannot construct a `ShieldedCoinInfo` / `QualifiedShieldedCoinInfo`
that matches an actual on-chain note:

- **S3 FAIL** (`ContractRuntimeError`): `send_held_shielded` was
  invoked with the user-supplied color (`00...03`); the circuit
  found no held note under that color (the actual on-chain note is
  under a derived color).
- **S4 FAIL** (`Wallet.InsufficientFunds`): the runner's
  `receive_shielded({color: 00...04, ...})` references a color the
  wallet has no notes for. The setup mint produced a note under a
  derived color; the receive call references the user-supplied color.

These are not language-level dealbreakers — they are SDK-surface
gaps. The Compact contract compiles correctly with both
`receiveShielded` and `sendShielded`. Filling the gap requires the
SDK to expose:

1. The contract-color derivation function (`H(contract_addr,
   user_color, ...)` or whatever the actual scheme is).
2. A way to query the wallet's held notes by `(contract_address,
   user_color)` to recover their nonces and Merkle-tree indices.

With both surfaces available, S3 and S4 should land. Without them,
the Passport architecture's outside-the-contract Zswap operations
(receive shielded into the contract, spend held shielded across
blocks) are blocked at the integration layer, not the protocol layer.

### Dust — NOT FEASIBLE TODAY

- **D1 FAIL** with errorCode `no-paymaster-api`. The SDK does not
  expose a public surface for routing a transaction's fee branch
  through a contract-held Dust balance. The wallet always pays.
- **D2 FAIL** with errorCode `no-paymaster-tx-shape`. None of the
  speculative paymaster API names (`balanceWithSponsor`,
  `attachContractFeeBranch`, etc.) are present on the WalletFacade
  or contract handle.

The Compact contract did register a `bump_counter` tx successfully in
both D1 (`009dfb07...436bc2b`) and D2 (`009d68cf...d3e71e2`) — i.e.
the user wallet *can* pay a contract-call fee, just not via a
contract-paid fee branch. Dust as a balance on a contract is not yet
addressable by this SDK version.

## Verdict

**Feasible for {U1, U3, S1, S2}; partially feasible for {S3, S4 —
language present, SDK surface missing}; not feasible for {U2, U4, D1,
D2}.**

In words: contract custody on Midnight v1 (`midnight-node:0.22.5` /
SDK 4.0.4) supports user↔contract unshielded Night transfers and
contract self-minting / atomic mint+send shielded transfers. It does
**not** support contract↔contract Night transfers (error 186 still
present, contradicting the CTO's report); it does not support cross-
transaction shielded custody or user-→-contract `receiveShielded` at
the SDK layer (the language layer compiles cleanly, but the SDK does
not expose the color-derivation and note-lookup primitives needed to
build those transactions); and it does not support contract-paid Dust
fees in any form (no public API).

## Implications for the Passport account model

Feeds back into [`RESEARCH.md`](../../RESEARCH.md).

The principle-perfect contract-custody account model from
[`secure-onboarding-design.md` § 7](../../docs/reference/machine-investigation/key-flows/secure-onboarding-design.md#7-account-model)
is **partially viable** on Midnight v1 today. The shape of the
constraint is precise enough to act on:

1. **Night custody works for the user-facing direction**, both ways.
   A contract can act as a user's Night wallet today.
2. **Inter-contract Night routing does not.** Until `Custom error: 186`
   is verified fixed (next node release; revalidate against the
   updated tag), any architecture that depends on a contract sending
   Night to another contract is blocked. This rules out, for now,
   designs where account contracts forward funds to (e.g.) a
   delegation contract or a bridge contract directly. **Workaround:**
   route through a user → user transfer.
3. **Shielded custody works for the simple paths** — contract self-
   mint, contract → user atomic mint+send. Designs that only need to
   issue shielded tokens from a contract are unblocked.
4. **Shielded custody for the Passport-relevant paths is SDK-bound,
   not protocol-bound.** Contract-receive of user-held shielded
   tokens (`receiveShielded`), and contract-spend of contract-held
   shielded notes across blocks (`sendShielded`), are both expressible
   in Compact today. They do not work through `midnight-js 4.0.4`
   because the SDK does not expose the contract-color-derivation and
   note-Merkle-index lookups needed to build the transactions
   client-side. **This is the highest-impact upstream ask** — once
   those surfaces exist, the shielded path likely opens up without
   further protocol work.
5. **Dust paymaster does not exist.** The "user without Dust" version
   of the Passport onboarding flow — where the contract pays the user's
   Dust fee out of its own balance — is **not implementable on v1
   today**. The user must hold Dust to pay their own fees. This
   breaks the abstract-account ideal for fees.

The concrete recommendation for the post-MVP multi-device milestone:

- Treat the contract-custody account model as **the primary path for
  Night and contract-self shielded operations**, with the explicit
  understanding that error 186 must be re-validated on the next node
  release before relying on contract↔contract Night.
- Treat **shielded receive and cross-tx custody as a tractable
  upstream ask on Midnight Foundation**: the Compact language
  supports these, the SDK does not. Drafting the SDK-surface
  requirement (color-derivation function + note query API) is now a
  concrete deliverable rather than a speculation.
- For Dust, **commit to a cryptographic alternative for the fee path**
  in the post-MVP multi-device milestone (most likely user-side
  device-key signed Dust spends, possibly with a FROST t≥2 + PIN
  factor, decoupled from the asset-custody contract). The
  contract-paymaster vision does not have a path on v1 today.
