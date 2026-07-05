# DIDz Engine — Architecture Overview for the Passport Team

_A technical overview of how the DIDz identity engine is structured on
Midnight, offered as interoperability context. Where our conventions and
Passport's converge, we would rather align early than translate later; where
they differ, we hope our shipped, compiling prior art is useful input to your
open component questions._

**Author:** John Santi (johnny5i) — Midnight Ambassador, NightForce Bravo,
Midnight Aliit cohort 0 (inactive)
**Status:** Draft for the Passport team · **Date:** 2026/07/05
**Spelling:** British, to match the Passport / MIP house style.

---

## Why we are sharing this

Passport and the DIDz engine are solving adjacent halves of the same
problem. As we read the Passport component canvases, Passport answers *"which
device or key may act for this account, and how is that account recovered?"*
The DIDz engine answers *"who or what is this entity, is it currently alive
and in good standing, and what has been attested about it?"* Those compose
cleanly: a Passport account is, in our model, one kind of controller of a
DIDz identity.

We have a working, compiling engine today (Compact compiler 0.31.1, full ZK
key generation). Rather than present a specification and ask anyone to
conform to it, we are laying out our structure so that the places where
alignment is cheap can be agreed while both designs are still fluid.

---

## The engine in one picture

```
              ┌─────────────────────────────────────────────┐
              │  midnight-modules  (shared Compact primitives)│
              │  access-control · commitment-nullifier ·      │
              │  merkle-membership · scoped-grant · voting ·  │
              │  liveness-timer · pol-credential · recovery   │
              └───────────────┬───────────────────────────────┘
                              │ imported / patterned by
        ┌─────────────────────┼─────────────────────┬───────────────┐
        ▼                     ▼                     ▼               ▼
   DIDz-io              RWAz                  selectConnect     AgenticDID
   (identities)         (real-world assets)   (private contact) (agent DIDs)
        │                     │                     │               │
        └── all resolve identity + status through DIDz-io ──────────┘
```

Everything is built from a **small set of shared primitives** in
`midnight-modules`, so every product hashes keys the same way, tells the time
the same way, and reveals facts the same way. This is the surface most worth
aligning with Passport.

**Public repositories** (more being opened as they are readied):

| Project | Repository |
|---|---|
| DIDz — the identity registry | <https://github.com/bytewizard42i/didz-dapp-system> |
| AgenticDID — identity for Ai agents | <https://github.com/bytewizard42i/AgenticDID_io_me> |
| SelectConnect — private contact exchange | <https://github.com/bytewizard42i/selectConnect_app_pro> |
| realVote — private verifiable voting | <https://github.com/bytewizard42i/realVote> |
| RWAz — real-world-asset titles | <https://github.com/bytewizard42i/RWAz> |
| equineProData / petProData — animal records | <https://github.com/bytewizard42i/equineProData> · <https://github.com/bytewizard42i/petProData> |

_The shared `midnight-modules` engine is being made public; link to follow._

---

## The conventions we would most like to align on

### 1. Key commitments — identity is a hash of a secret, never a raw key

Every principal across the engine is identified by:

```
key_commitment = persistentHash([pad(32, "midnight:mm:pk:"), secret_key])
```

The secret is a Compact `witness`; only the commitment reaches the chain.
Authorisation is always "prove you know the secret behind this commitment",
never a stored public key. This is exactly the hash-preimage authentication
scheme in your **C1 / C9 authentication alternative A**, and it is the single
most important convention for interoperability: if Passport device keys and
DIDz principals share this derivation (same domain tag, same hash), a Passport
account can authorise against a DIDz identity with no adapter at all.

_Open question we would put to you:_ your C9 also weighs Jubjub Schnorr (B)
and P-256/WebAuthn (C) for MPC-composability and secure-element signing. We
use (A) today. If Passport standardises the domain tag and preimage layout
for (A), we would adopt it verbatim.

### 2. Domain-separation registry

Because `persistentHash` takes no domain argument, every hash site in the
engine prepends a registered tag, and we keep a single registry
(`midnight-modules/DOMAIN_TAGS.md`) with a freeze-once-on-chain rule and
`:vN` versioning. We built this directly in response to your **ADR 0001** and
the domain-separation MPS — your own inventory found Midnight core carrying
~25 tags in three schemes with no registry. We would happily converge our
tag scheme onto whatever the MPS ratifies, and contribute our registry as a
worked downstream example.

### 3. Selective disclosure = commitment + one reveal circuit per fact

Our privacy default: the chain shows only that an identity exists and its
lifecycle status. Entity type, subject binding, owner key, and every
attestation are **commitments**, each with a dedicated ZK circuit that
reveals exactly one fact on the holder's choice (`prove_entity_type`,
`prove_attestation`, `assert_i_control`). This is the same
witness + commitment + `assert` pattern your developer guide documents, and
the same philosophy as your C18/C20 attestation trees — applied per-attribute
rather than per-tree.

### 4. Per-context nullifiers

For one-per-person actions we use:

```
nullifier = persistentHash([pad(32, "…:nullf:"), secret, verifier_context])
```

Including the verifier/context means the same person is replay-blocked within
a context but unlinkable across contexts — your **C21 alternative A**, which
we adopted this week. If your nullifier domain tag is standardised, we align.

### 5. Keeper-driven epochs, not wall-clock timestamps

Time-sensitive logic (grant expiry, proof-of-life freshness) reads a
`Counter` epoch advanced by a keeper, never a caller-supplied timestamp. A
shared epoch convention would let Passport-issued grants and DIDz freshness
windows speak the same clock.

---

## Two structures where we have shipped prior art for your open questions

### Scoped grants (your C10 / C11 / C12)

Your C10 canvas leaves the grant schema open and lists alternatives ending at
*"C — ZK-attested grants (tightest privacy)."* Our `scoped-grant` v2 module
**is** that alternative, compiled: a grant is `operation × object ×
quantitative bounds` with per-action and cumulative caps, a counterparty
lock, custom-constraint slots, and chain-side enforcement (your C12) via
verifier circuits — out-of-scope operations fail at proof verification, not
application discretion. We offer it as a concrete reference for the C10 schema
discussion.

### Permanent identity, temporary eligibility (proof-of-life)

Our `pol-credential` module encodes a rule we think Passport will eventually
need: an identity is **permanent**, but the right to act as a living person
**expires and renews**. Anything only the living may do checks a freshness
window (each verifier choosing its own); a death certificate from a trusted
authority is irreversible. This is the substrate for recovery-and-inheritance
flows and pairs naturally with your C14 recovery work.

---

## What rides on this foundation

The conventions above are not academic — an entire product line stands on
them, which is why we care about getting the base layer right (and agreed)
early. Each of these resolves identity, liveness, and attestations through
the same engine:

- **KYCz** — self-custodied KYC: verify once with a regulated issuer, prove
  facts (age, jurisdiction, accreditation) anywhere, revealing nothing else.
  Every proof is the selective-disclosure pattern in §3.
- **SafeHealthData** — patient-custodied health records: hospitals attest,
  patients hold, insurers verify — without any party seeing more than the
  fact being proven. Lives and dies on the attestation + issuer-assurance
  conventions.
- **equineProData / petProData** — lifetime veterinary and provenance
  records for animals (a working demonstration that DIDz entity types beyond
  HUMAN are real, not aspirational).
- **realVote** — one-person-one-vote civic voting: proof-of-life freshness
  (§ keeper epochs) plus per-context nullifiers (§4) — a living person votes
  once per election, unlinkably across elections.
- **DownMan** — estate and inheritance automation, triggered by the same
  irreversible death attestation the proof-of-life module records.
- **SCIFz** — clearance-gated knowledge compartments; access is an
  attestation-gated scoped grant.
- **GeoZ** — privacy-preserving location oracles anchored to DEVICE
  identities.
- **HuddleBridge / SentinelDID** — communications and disaster-relief
  identity for degraded environments, where recovery (your C14) matters
  most.

A user who onboards once — with a Passport account controlling a DIDz
identity — gets all of this without a second registration anywhere. That is
the prize interoperability buys, and why we would rather agree on five hash
conventions now than maintain adapters forever.

## Where we want to *adopt* from Passport

We are not only offering. Your work has already changed ours:

- **Contract upgradability** — your executed upgradability experiment (real
  on-chain tx hashes; logic upgrade in place, new circuit slots post-deploy,
  via the Contract Maintenance Authority) is directly shaping our deployment
  runbook, including the maintenance-authority key-custody hazard you
  documented.
- **Recovery** — your DeRec-based C14/C15 (Shamir shares, ML-KEM transport,
  daily challenge-response) is more mature than ours. We have a
  soulbound m-of-n + Ai-vouch recovery design we would like to offer as a
  C14 *Alternative E* input, deferring to your DeRec direction rather than
  replacing it.
- **Attestation Merkle trees** — your C18 shape is exactly the accumulator we
  need for anonymous "this pairwise identity belongs to *some* active DIDz"
  proofs. We would rather build ours to your leaf/root convention than invent
  a parallel one.

---

## The one ask

Not "conform to us" — rather: **could we compare notes on the five
conventions above before either side freezes them?** The key-commitment
derivation (§1), the domain-tag scheme (§2), and the nullifier layout (§4)
are the three where early agreement costs nothing now and saves an adapter
layer for every wallet and dApp later. We are glad to bring these to the
relevant MIP discussions in whatever form is most useful to you.

---

_This document is internal DIDz collaboration material. Any content shared
upstream will be re-cut into the Passport/MIP format, British-spelled and
DCO-signed, as a single-purpose contribution — never as a bulk import._
