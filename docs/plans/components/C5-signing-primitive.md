# C5 · Signing primitive

**Serves:** P6.

## Outcome

The cryptographic operation by which a device authorises Passport account
operations. Schnorr-on-Jubjub at the user-device layer (verified by
`experiments/redjubjub-wallet/`). Independent of MCS / threshold-Schnorr
at the cross-chain layer (which is owned upstream).

## Dependencies

- **C7** — witness handling pipeline.
- **C6** — proof generation consumes signing inputs.
- **C9** — device-bound auth produces the key that signs.
- **C16** — wallet local storage holds the per-device key.
- **External** — `experiments/redjubjub-wallet/` and `redjubjub-wallet-rs/`
  for the verified Schnorr-on-Jubjub implementation.

## Open questions

**Per-device key directly vs. derivation tree.** Per-device Jubjub keys
directly, no HD tree at the user layer. If C4 picks address-custody,
derivation may re-emerge for asset-address generation.

**Key rotation cadence.** Does a device rotate its key periodically, or
only on revocation? Affects long-term cryptographic hygiene.

**Cross-curve composition.** Passport user-side stays Jubjub. Cross-chain
operations rely on the upstream MCS for foreign-chain signatures; user
signs the trade intent in Jubjub, MCS handles the foreign-chain side.

## Failure modes

**Curve mismatch with consumer.** A consumer (e.g., dApp verifier)
expects ECDSA-secp256k1 and Jubjub Schnorr is unrecognised. *Detection:*
third-party verification fails.

**Signing surface leak.** Implementation accidentally exposes signing API
beyond the trusted boundary. *Detection:* code review reveals callable
signing path from outside the secure boundary.

## Alternatives

**A — Schnorr-on-Jubjub per device** (current — verified by experiments).
**v1.0 deliverable target.**

**B — FROST committee under user control.** Rejected as a v1.0 target —
the partner-operated cousin is the MVP model below.

**C — Per-device with periodic rotation** (variant of A with rotation
policy).

**D — FROST-Jubjub via partner-operated MPC committee with DKG.** **MVP
model (managed signing).** A partner runs MPC nodes; user authenticates via
OAuth2-shaped flow with a passkey registered to the MPC auth provider.
DKG ensures no node ever reconstructs the user's private key. Signing is
collaborative threshold Schnorr over Jubjub. Compatible with P6 (no key
reconstructed) but **violates P8** (the MPC operator is a required
service). The v1.0 deliverable retires this in favour of A.
