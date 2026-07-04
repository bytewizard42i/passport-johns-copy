# DIDz Product ↔ Passport Component Crosswalk

The bidirectional map. This is the heart of the cross-pollination: what DIDzM brings to
each Passport surface, and what each DIDzM product should adopt from Passport in return.

Passport promises are **P1–P10** (see `docs/plans/PROMISES.md`); components are **C1–C25**
(see `docs/plans/components/README.md`); improvement proposals are **MIP-3 … MIP-8**
(see `docs/plans/MIPS.md`). Only components referenced below are named; the full inventory
lives in the component README.

---

## A. DIDzM → Passport (what we contribute)

| Passport surface | Promise(s) | DIDzM product / idea that informs it | Contribution |
|---|---|---|---|
| **C2 · Name service** | P2, P8, P10 | DIDz.io naming / anchor model | Anti-squat + resolver thinking; human-readable handle ↔ account anchor. |
| **C3 · DID surface** | P2 | DIDz.io (Identus, one-DIDz-per-item, binary ZKQuery) | W3C DID interop shape; "is `alice.midnight` the DID or a layer over it" answered from a shipped model. |
| **C9 · Device-bound auth** | P1, P3, P6 | DIDz.io biometric binding (face + fingerprint + pulse/ox) | Biometric-as-factor patterns, anti-Sybil (one finger per identity). |
| **C10–C12 · Scoped grants + enforcement** | P7 | AgenticDID delegation/scopes/revocation; selectConnect progressive reveal | Grant primitive over operation × object × bounds; staged-consent UX. |
| **C14 · Total-loss recovery** | P1, P5, P6 | **John's recovery vision** (file `01`); SentinelDID (crisis case) | m-of-n soulbound-attribute recovery; Ai-vouch factor; offline-tolerant helpers. **Primary contribution target.** |
| **C15 · Helper protocol** | P5, P8 | SentinelDID; social-recovery thinking | Substitutable, infrastructure-light helpers; non-collusion across factor categories. |
| **C18 / C20 · Credentials & selective-disclosure proof** | P9 | KYCz (identityless KYC); SCIFz (tiered clearance + audit + revocation) | Trusted-issuer binding; nullifier + revocation patterns; tiered/attribute proofs. |
| **C24 · Fee model** | P8 | DIDzM projects' NIGHT/DUST handling notes | Single-chain fee UX corner cases. |

## B. Passport → DIDzM (what we adopt)

| DIDzM product | Adopt from Passport | Why |
|---|---|---|
| **DIDz.io** | C1 account-custody contract; C2 name service; C16 wallet local storage; the "zombie public state on private-state loss" warning | A production-grade account/anchor + storage model so DIDz identities are recoverable and named the same way Passport accounts are. |
| **KYCz** | C18/C20 credential + selective-disclosure standard; STD-03 domain separation | Align KYCz proofs to the emerging Midnight credential MIP (MIP-6) so a KYCz attestation is a first-class Passport credential. |
| **AgenticDID** | C10 scoped-grant primitive; C9 device-bound auth | Express agent delegation using the same one-primitive grant model Passport standardises (P7). |
| **SentinelDID** | C14/C15 recovery + helper protocol | Base crisis-recovery on the Passport recovery standard rather than a bespoke one. |
| **SCIFz** | C20 selective-disclosure proof; C8 domain-separation registry | Reuse the ratified proof + hash-prefix discipline for clearance gating. |
| **selectConnect / ProMingle / SouLink / PopCork** | C23 dApp connection + MIP-7 DecentralisedAuth ("sign-in-with-Passport") | Let these apps authenticate users via Passport without leaking identity. |

## C. Promise-by-promise: where DIDzM has prior art

| Promise | DIDzM prior art |
|---|---|
| **P1 Seedless** | DIDz.io QR onboarding + biometric binding (no seed shown to Holder). |
| **P2 Named** | DIDz.io identity naming; DID-as-handle thinking. |
| **P3 Peer-device** | (Adopt from Passport — DIDzM has less here.) |
| **P4 Revoke-and-continue** | AgenticDID revocation; SCIFz revocation model. |
| **P5 Recover-from-zero** | **John's m-of-n soulbound recovery vision; SentinelDID crisis recovery.** Strongest overlap. |
| **P6 Key-bound** | DIDz binary-ZKQuery (raw attributes never leave device). |
| **P7 Scoped grants** | AgenticDID delegation/scopes; selectConnect progressive reveal. |
| **P8 Chain-only** | Binary ZKQuery resolves on chain; substitutable issuers/helpers. |
| **P9 Selective disclosure** | KYCz, SCIFz, DIDz binary ZKQuery — core competency. |
| **P10 Chain abstraction** | (Adopt from Passport / upstream cross-chain work.) |

## D. The single biggest overlap

**Recovery (P5 / C14 / C15 / MIP-4).** John's soulbound m-of-n recovery vision plus
SentinelDID's crisis lens is the place where DIDzM has the most original, upstream-worthy
thinking. That is why the first PR (file `04`) aims there.

_Last updated: 2026-07-04._
