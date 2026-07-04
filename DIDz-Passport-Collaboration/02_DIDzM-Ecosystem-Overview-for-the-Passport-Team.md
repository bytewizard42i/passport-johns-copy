# DIDzM Ecosystem Overview — for the Passport Team

A concise tour of the DIDz / DIDzMonolith product family, written for someone on the
Midnight Passport team. For each product: what it is, and **why it matters to Passport**.

The through-line: DIDzM has spent significant design effort on exactly the identity,
credential, and recovery surfaces Passport is now standardising. These are complementary,
not competing. Passport is the **account + wallet + naming** layer; DIDz is the
**verifiable-identity + credential + selective-disclosure** layer that rides on top.

---

## Foundation layer

### DIDz.io — the identity foundation
Privacy-preserving decentralised identity for **people, organisations, and objects**
(one DIDz = exactly one item). Roles: Holder, Trusted Issuer, Verifier. Uses Hyperledger
Identus for DID infrastructure, QR-code out-of-band exchange, biometric binding
(fingerprint + face + bio pulse/ox, one finger per DIDz for anti-Sybil), and
**binary-only ZKQuery responses** (yes/no, never raw data).
**Why it matters to Passport:** this is the DID surface (C3) and the naming/anchor idea
(C2), already prototyped. The biometric-binding and binary-ZKQuery patterns are directly
reusable for Passport's selective disclosure (P9) and for soulbound recovery factors (C14).

### KYCz — identityless KYC
A no-frills base layer: "identityless KYC verification protocol." Proves KYC-grade facts
without revealing the underlying data. Designed to inform how DIDz is built on Midnight.
**Why it matters to Passport:** the **trusted-issuer** half of credential-based recovery
factors (SSN, driver's license proofs in John's recovery vision) and of privacy-preserving
credentials (MIP-6 / C20).

---

## Identity for agents and sensitive contexts

### AgenticDID.io — identity for Ai agents
DIDs scoped to Ai agents only: delegation, scopes, revocation, and audit for autonomous
actors built on the DIDz foundation.
**Why it matters to Passport:** maps to scoped grants (P7 / C10–C12) and is the natural
home for the **"Ai vouches for you"** recovery factor — an agent with a verifiable,
scoped relationship to a Holder.

### SentinelDID — emergency / disaster-relief identity
A DID proof-of-concept aimed at emergency relief: establishing and using identity in
crisis conditions. Motivating case: **Venezuela**, via a combination of World Mobile,
Starlink, and Ai (see `references/`).
**Why it matters to Passport:** the hardest recovery case is a user with no devices, no
infrastructure, and no social graph on hand. SentinelDID's thinking stresses Passport's
P5 / C14 under real-world adversity and argues for **substitutable, offline-tolerant**
recovery helpers (C15, P8).

### SCIFz — clearance-gated private knowledge
A cryptographic SCIF: answers questions at or below the asker's clearance, gated by ZK
proofs on Midnight, with an append-only audit and revocation model. Clearance is a
credential commitment; queries prove "cleared to know" without revealing identity.
**Why it matters to Passport:** a worked example of **tiered credential proofs +
revocation + audit** (C18/C20), and of Merkle-membership credential gating that a
recovery-factor registry could reuse.

---

## Supporting products that lean on identity

- **GeoZ** — privacy-preserving geofenced / jurisdictional oracle. Relevant to
  location-scoped grants and jurisdiction-aware credential factors.
- **selectConnect** — progressive-reveal contact sharing with abuse-bond staking; a
  staged-disclosure UX already implemented in Compact (relevant to P9 UX and to
  helper-consent flows in C15).
- **ProMingle / SouLink / PopCork / HuddleBridge** — social and professional platforms
  that consume DIDz identity; real demand-side pull for a Passport-grade account layer.
- **MidnightVitals** — real-time diagnostics tooling (proof server, RPC, indexer, wallet,
  private state). Useful for observing a Passport localnet during integration.

---

## The one-paragraph pitch

DIDzM is a large, coherent body of privacy-first Midnight products with **identity and
credentials at the core**, and a founder (John M.P. Santi, NightForce Bravo / Ambassador)
who has thought hard about the exact problems Passport is standardising: naming, DID
surface, selective disclosure, scoped grants, and above all **recovery of a soulbound
account you can never be locked out of**. We want to contribute that thinking upstream.

_Last updated: 2026-07-04._
