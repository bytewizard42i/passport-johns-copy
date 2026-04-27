# Contract Custody Feasibility — Findings

> **Status: executed 2026/04/27 against devnet `midnight-node:0.22.5` /
> the latest published `@midnight-ntwrk/*` family.** Five tests PASS
> with on-chain tx hashes, five FAIL — three of the five with documented
> upstream causes (one node bug, two missing SDK surfaces), two with
> the same node bug. Verdict and Passport-account-model implications
> below.

## Headline findings

1. **Shielded user→contract custody works on Midnight v1 today.**
   Recipe: derive the on-chain colour with `rawTokenType` from
   `@midnight-ntwrk/ledger-v8`, then call `receive_shielded({nonce,
   color, value})` with the derived colour. The earlier framing of
   this as an "SDK gap" was operator error — `rawTokenType` is a
   public function exported by the latest `ledger-v8`, and the wallet
   exposes its qualified note set via `state.shielded.availableCoins`.
   See the working tutorial at
   [`../../midnight-receive-shielded-sdk-gap-repro/`](../../midnight-receive-shielded-sdk-gap-repro/)
   (despite the legacy directory name, the repo now demonstrates the
   working recipe in three demos).

2. **Error 186 is still present on `midnight-node:0.22.5`.** Both U2
   (`sendUnshielded → ContractAddress`) and U4 hop-2 are rejected with
   `1010: Invalid Transaction: Custom error: 186` — surfaces as
   `MalformedError::EffectsCheckFailure` on the node. Tracked upstream
   as [`midnightntwrk/midnight-ledger#233`](https://github.com/midnightntwrk/midnight-ledger/issues/233).
   The CTO's 2026/04/27 statement that 186 was fixed in the past month
   is not verified by this experiment as configured. The fix may be on
   a release tag we haven't reached yet; confirmation of the tag would
   let us re-run U2 / U4 and convert two FAILs into PASSes.
   A focused minimal reproducer is at
   [`../../midnight-error-186-repro/`](../../midnight-error-186-repro/).

3. **One narrow SDK gap remains for shielded custody: contract-held
   coin enumeration.** S3 (`send_held_shielded` from contract-owned
   notes) requires a `QualifiedShieldedCoinInfo` with `mt_index`. The
   user wallet's `availableCoins` correctly does not include
   contract-owned notes (those are owned by the contract, not the
   user); no analogous provider-side or wallet-side API enumerates a
   contract's shielded UTXOs. The runner now probes a list of
   candidate surfaces and writes the trace to `evidence/s3-…json` —
   none of `wallet.state.shielded.availableCoins[contract]`,
   `contract.{shieldedCoins,getShieldedCoins,…}`, or
   `publicDataProvider.{queryContractShieldedNotes,…}` are present in
   `midnight-js 4.0.4`. **A single new public surface** —
   `getContractShieldedCoins(address) → QualifiedShieldedCoinInfo[]`
   on either the public data provider or the wallet facade —
   completely closes this gap.

4. **Dust paymaster has no public API.** The wallet always pays.
   D1 (contract pays own tx fee) and D2 (contract pays user's tx
   fee) both surface as documented absence rather than runtime
   failure. The "user without Dust" version of the Passport
   onboarding flow is not implementable on v1 today.

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
| `@midnight-ntwrk/wallet-sdk-shielded` | `^3.0.0` (latest)                           |
| `@midnight-ntwrk/wallet-sdk-dust-wallet` | `^4.0.0` (latest)                        |
| `@midnight-ntwrk/wallet-sdk-unshielded-wallet` | `^3.0.0` (latest)                  |
| `@midnight-ntwrk/wallet-sdk-facade` | `^4.0.0` (latest)                             |
| `@midnight-ntwrk/wallet-sdk-hd` | `^3.0.2` (latest)                                 |
| `@midnight-ntwrk/wallet-sdk-address-format` | `^3.1.1` (latest)                     |
| `@midnight-ntwrk/zswap`        | `^4.0.0` (latest)                                  |
| `feeBlocksMargin`              | `100` (raised from default `5`; see Deploy-stage)  |
| Operator                       | _PENDING_                                          |
| Repo commit at run             | _PENDING_                                          |

## Compile-stage findings (2026/04/27)

Established before any test ran — by iterating on `compact compile`
until the contract built cleanly. Every bullet is backed by a specific
compiler error captured in this session's transcript.

- **`receiveShielded` exists in the Compact stdlib.** Signature:
  `receiveShielded(coin: ShieldedCoinInfo {nonce, color, value})` —
  note no `mt_index`, since the consumed note is created in this
  transaction and has no on-chain Merkle position yet.
- **`mintShieldedToken` is the atomic mint+send primitive.** There is
  no separate `sendImmediateShielded`; "atomic mint+send" is just
  `mintShieldedToken` with a non-self recipient. Signature:
  `mintShieldedToken(color: Bytes<32>, amount: Uint<64>, nonce: Bytes<32>, recipient: Either<ZswapCoinPublicKey, ContractAddress>)`.
- **Shielded amounts are `Uint<64>`.** Unshielded uses `Uint<128>`.
- **Per-note nonce is caller-supplied** for `mintShieldedToken`. Each
  call requires a `Bytes<32>` nonce that determines the resulting
  commitment uniqueness; reusing a nonce across mints with the same
  color/value would collide.
- **`sendShielded` requires `QualifiedShieldedCoinInfo`** — the
  "Qualified" variant adds `mt_index` to the basic `ShieldedCoinInfo`.
  This is what S3 trips over: with no SDK surface for contract-owned
  notes, the dApp cannot recover the held note's Merkle-tree index.
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
| U1   | PASS    | 00e096b4...a8ca101   | receiveUnshielded landed on devnet.          |
| U2   | FAIL    | js-error             | Threw: Unexpected error submitting scoped tr |
| U3   | PASS    | 00d687c6...bf863e4   | sendUnshielded → UserAddress accepted (regre |
| U4   | FAIL    | js-error             | Threw: Unexpected error submitting scoped tr |
| S1   | PASS    | 00cdee17...d8052b4   | mintShieldedToken → kernel.self() landed.    |
| S2   | PASS    | 006eebc7...623714f   | sendImmediateShielded landed (atomic mint+se |
| S3   | FAIL    | no-mt-index-surface  | No contract-held-note lookup surface found i |
| S4   | PASS    | 0011af46...77e8d05   | receive_shielded user → contract confirmed o |
| D1   | FAIL    | 00b8a438...426c666   | No public SDK surface for contract-paid Dust |
| D2   | FAIL    | 00e51b2e...dce429a   | No public SDK surface for contract paymaster |

<!-- END-RESULTS-TABLE -->

> Underlying error classifications behind the `js-error` rows:
> - **U2, U4 hop-2:** `RpcError: 1010: Invalid Transaction: Custom error: 186` — node-side rejection. Tracked upstream as `midnight-ledger#233`.
> - **S3:** the runner gracefully reports `no-mt-index-surface` after probing every candidate API for contract-held coin enumeration; see `evidence/s3-cross-tx-custody.json` `details.probes` for the trace.

## Per-asset-type summary

### Unshielded (Night) — PARTIAL

User↔contract Night transfers work on `midnight-node:0.22.5` /
`midnight-js 4.0.4`:

- **U1 PASS** (tx `00e096b4...a8ca101`): `receiveUnshielded` lands.
  The historical error 168 is **not present** on this build.
- **U3 PASS** (tx `00d687c6...bf863e4`): `sendUnshielded` →
  `UserAddress` lands. Regression check confirmed.

Contract↔contract Night transfers do not:

- **U2 FAIL** with `1010: Invalid Transaction: Custom error: 186`.
  Direct contract→contract send rejected by the node's transaction
  validator.
- **U4 FAIL** at hop-2 with the same `Custom error: 186`. The full
  round-trip is therefore impossible on this build.

The CTO's 2026/04/27 statement was that 186 was fixed in the past
month. This experiment did not reproduce that fix on
`midnight-node:0.22.5`. Either there is a more recent release tag
than `0.22.5` that contains the fix, or the fix did not fully land.
The bug is tracked upstream — `midnightntwrk/midnight-ledger#233`,
plus a focused minimal reproducer at `midnight-error-186-repro/`.
A definitive verdict for the contract↔contract path is on hold
pending node-version clarification.

### Shielded (Zswap) — PARTIAL (deposit-side fully feasible)

Inbound paths and contract-issued tokens work end-to-end:

- **S1 PASS** (tx `00cdee17...d8052b4`): `mintShieldedToken` to
  `kernel.self()` lands. The contract holds the resulting shielded
  note (visible as a derived colour in subsequent wallet state views).
- **S2 PASS** (tx `006eebc7...623714f`): atomic mint+send shielded
  → user lands. Contract issues a new note directly to a user.
- **S4 PASS** (tx `0011af46...77e8d05`): `receive_shielded` user →
  contract lands. **The user can deposit shielded tokens into a
  contract.** Recipe:
  ```ts
  import { rawTokenType, encodeRawTokenType } from '@midnight-ntwrk/ledger-v8';
  const onChainColor = encodeRawTokenType(
    rawTokenType(contractScopedColor, contractAddress),
  );
  await contract.callTx.receive_shielded({ nonce, color: onChainColor, value });
  ```

Outbound from contract-held notes does not, by a single missing API:

- **S3 FAIL** with `no-mt-index-surface`. After the contract minted to
  itself in hop 1 (tx landed cleanly under derived colour
  `5d314dca...`), hop 2 (`send_held_shielded`) needs a
  `QualifiedShieldedCoinInfo` carrying the contract-held note's
  `mt_index`. The runner probed:
    - `wallet.state.shielded.availableCoins` — 8 user-owned notes,
      none under the contract-derived colour (correct: user wallet
      doesn't sync contract-owned notes).
    - `contract.{shieldedCoins, getShieldedCoins, currentShieldedCoinState, queryShieldedNotes}` — none present.
    - `publicDataProvider.{queryContractShieldedNotes, getContractShieldedCoins, contractShieldedCoins, shieldedCoinsForContract}` — none present.
  The full probe trace is in `evidence/s3-cross-tx-custody.json`.

The S3 gap is narrow and concrete: **one new public function**
returning a contract's `QualifiedShieldedCoinInfo[]` (with mt_index)
given the contract address would unblock `sendShielded` from
contract-held notes entirely.

### Dust — NOT FEASIBLE TODAY

- **D1 FAIL** with errorCode `no-paymaster-api`. The SDK does not
  expose a public surface for routing a transaction's fee branch
  through a contract-held Dust balance. The wallet always pays.
- **D2 FAIL** with errorCode `no-paymaster-tx-shape`. None of the
  speculative paymaster API names (`balanceWithSponsor`,
  `attachContractFeeBranch`, etc.) are present on the WalletFacade
  or contract handle.

The Compact contract did register a `bump_counter` tx successfully in
both D1 (`00b8a438...426c666`) and D2 (`00e51b2e...dce429a`) — i.e.
the user wallet *can* pay a contract-call fee, just not via a
contract-paid fee branch. Dust as a balance on a contract is not yet
addressable by this SDK version.

## Verdict

**Feasible for {U1, U3, S1, S2, S4}; partially feasible for {S3 — one
narrow SDK surface gap}; not feasible for {U2, U4 — pending node-fix
verification; D1, D2 — no v1 surface}.**

In words: contract custody on Midnight v1
(`midnight-node:0.22.5` + the latest published SDK family) supports
**user↔contract Night** in both directions, **contract self-mint and
atomic mint+send shielded**, and **user→contract shielded deposit**
via the `rawTokenType` recipe. It does **not** support
contract↔contract Night (error 186, upstream-tracked), **does not
support `sendShielded` from contract-held notes** (one missing SDK
function — contract-held coin enumeration), and **does not support
contract-paid Dust fees** in any form (no public API).

## Implications for the Passport account model

Feeds back into [`RESEARCH.md`](../../RESEARCH.md).

The principle-perfect contract-custody account model from
[`secure-onboarding-design.md` § 7](../../docs/reference/machine-investigation/key-flows/secure-onboarding-design.md#7-account-model)
is **substantially more viable on v1 than the previous run suggested**.
The experiment's clarified shape:

1. **Night user↔contract works in both directions.** A contract can
   act as a user's Night wallet today.
2. **Inter-contract Night routing does not.** Until `Custom error: 186`
   is verified fixed (next node release; revalidate against the
   updated tag), any architecture that depends on a contract sending
   Night to another contract is blocked. Workaround: route through
   user→user transfers.
3. **Shielded deposit-side custody works today.** A contract can
   self-mint, atomically issue shielded tokens to a user, **and
   accept shielded notes from a user** via `receive_shielded` using
   the `rawTokenType` recipe. The end-to-end recipe is documented and
   verified at `experiments/midnight-receive-shielded-sdk-gap-repro/`.
4. **Shielded withdraw-side custody is blocked by one missing API.**
   `sendShielded` from contract-held notes (S3) requires a
   `QualifiedShieldedCoinInfo` with `mt_index`; no SDK surface returns
   this for contract-owned notes. This blocks designs where the
   contract acts as a vault that users can withdraw from. The
   workaround for some token classes is contract-issued tokens that
   the contract can re-mint (S2 pattern). For shielded NIGHT or any
   other protocol-issued token, the gap stands until the SDK exposes
   contract-coin enumeration.
5. **Dust paymaster does not exist.** The "user without Dust" version
   of the Passport onboarding flow — where the contract pays the user's
   Dust fee out of its own balance — is **not implementable on v1
   today**. The user must hold Dust to pay their own fees.

The concrete recommendation for the post-MVP multi-device milestone:

- **Treat Night and shielded-deposit custody as production-viable
  paths on v1.** A Passport contract can custody Night fully and
  receive Zswap; both deposit flows (Night and shielded) are verified
  end-to-end with on-chain transactions.
- **Shielded withdraw is a single concrete upstream ask.** Filing
  with the Midnight Foundation: *"please add
  `getContractShieldedCoins(address) → QualifiedShieldedCoinInfo[]`
  on `publicDataProvider` (or equivalent on the wallet facade)."* The
  protocol primitive exists; the dApp-side discovery is the only
  missing piece.
- **Plan for the shielded-withdraw decision two ways.** Either (a)
  wait for the SDK surface and keep the contract-vault design, or (b)
  redesign the Zswap path so tokens stay user-side and the contract
  only authorises actions. (a) is preferable if the timeline allows;
  (b) is the fallback that doesn't require any upstream change.
- **Contract↔contract Night routing must be re-validated** on each
  new node release until `midnightntwrk/midnight-ledger#233` is closed.
- **For Dust, commit to a cryptographic alternative for the fee path**
  in the post-MVP multi-device milestone (most likely user-side
  device-key signed Dust spends, possibly with a FROST t≥2 + PIN
  factor, decoupled from the asset-custody contract). The
  contract-paymaster vision does not have a path on v1 today.
