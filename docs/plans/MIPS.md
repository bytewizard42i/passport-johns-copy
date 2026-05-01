# Midnight Passport — MIPs Pipeline

The Midnight Improvement Proposals (MIPs) that Midnight Passport must produce.
Midnight has no formal improvement-proposal process yet; the Passport MIPs
are both the vehicle for interoperability and the forcing function that
creates that process.

The MIPs are the central body of v1.0 deliverables. The October MVP
consumes them as they firm up — MVP-window MIPs are the ones the MVP
build depends on; post-MVP MIPs continue toward feature-complete v1.0
after the October demo.

Every MIP ships with a **named external co-author** — unilateral drafts
become shelfware. The adoption narrative tracks who that co-author is
for each MIP.

Last updated: 2026/05/01.

---

## Pipeline at a glance

| MIP | Pipeline ID | Title | When |
|-----|-------------|-------|------|
| **MIP-1** | STD-01 | Key derivation paths | MVP-window |
| **MIP-2** | STD-02 | Address format | MVP-window |
| **MIP-3** | STD-04 | Multi-key account | Post-MVP |
| **MIP-4** | STD-05 | Recovery paths | Post-MVP |
| **MIP-5** | ECO-01 | dApp ↔ Wallet Connection Protocol | Post-MVP |
| **MIP-6** | ECO-02 | Privacy-preserving credentials | Post-MVP |
| **MIP-7** | ECO-03 | DecentralisedAuth | Post-MVP |

A cross-cutting prerequisite ships alongside the MIPs:

- **STD-03** — Domain-separation registry. Every `persistentHash` use
  site gets a prefix. Cryptographer-reviewed; required before
  credentials, signing, and naming can be ratified.

---

## MVP-window MIPs

### MIP-1 · STD-01 — Key derivation paths

**Scope.** CIP-1852-aligned key derivation paths for Midnight, using coin
type **2400**. Defines the derivation tree from a single root through to
the wallet roles.

**Maps to component.** [C5 — Signing primitive](components/C5-signing-primitive.md).

---

### MIP-2 · STD-02 — Address format

**Scope.** Bech32m-encoded addresses with the `mn_` human-readable prefix,
specified across the wallet roles.

**Maps to component.** [C1 — Account-custody contract](components/C1-account-custody-contract.md).

---

## Post-MVP MIPs

### MIP-3 · STD-04 — Multi-key account

**Scope.** On-chain multi-device contract — the authorisation surface that
allows a single Passport account to be controlled by multiple per-device
keys, with explicit add / rotate / revoke ceremonies.

**Maps to component.** [C1 — Account-custody contract](components/C1-account-custody-contract.md).

---

### MIP-4 · STD-05 — Recovery paths

**Scope.** The recovery surface: social recovery via DeRec helpers, plus
an encrypted-blob backup path for users without a social graph.

**Maps to component.** [C14 — Total-loss recovery flow](components/C14-total-loss-recovery-flow.md).

---

### MIP-5 · ECO-01 — dApp ↔ Wallet Connection Protocol

**Scope.** The CIP-30 equivalent for Midnight. CAIP-25-shaped, with privacy
scopes and an asynchronous proof lifecycle. This is what the wider
ecosystem builds against.

**Maps to component.** [C23 — dApp connection protocol](components/C23-dapp-connection-protocol.md).

---

### MIP-6 · ECO-02 — Privacy-preserving credentials

**Scope.** Attestation-tree domain separators, nullifier construction, and
multi-issuer support for privacy-preserving verifiable credentials.

**Maps to component.** [C20 — Selective-disclosure proof](components/C20-selective-disclosure-proof.md).

---

### MIP-7 · ECO-03 — DecentralisedAuth

**Scope.** Privacy-preserving dApp sign-in protocol — the
"sign-in-with-Passport" primitive that does not leak the user's address or
identity to the dApp by default. Sister protocol to MIP-5: MIP-5 covers
connection, MIP-7 covers authentication.

**Maps to component.** [C23 — dApp connection protocol](components/C23-dapp-connection-protocol.md).

---

## Process notes

- Each MIP opens as a pull request against the Midnight Improvement
  Proposals repository.
- Each MIP names its external co-author at draft time. If no co-author can
  be named, the MIP is not yet ready to start.
- MVP-window MIPs are the contract for adoption: if the Foundation, Lace,
  and partner wallets cannot consume them, the MVP has not landed.
