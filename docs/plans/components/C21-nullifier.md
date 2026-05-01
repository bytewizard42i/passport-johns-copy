# C21 · Nullifier

**Serves:** P9.

## Outcome

Replay prevention with domain separation. A nullifier is a
domain-separated hash that prevents re-use of the same proof but cannot
be linked back to the underlying credential. P9 / I-9.4 / I-9.5.

## Dependencies

- **C8** — distinct domain separator from C18 (attestation leaf
  separator).
- **C18 · C20** — paired with attestation tree and selective-disclosure
  proof.

## Open questions

**Per-context nullifier shape.** Is the nullifier always
`persistentHash([nullifier_domain, user_secret_key])`, or does it
include a per-context input (e.g., the verifier's identifier)?
Per-context allows the same user to interact with multiple verifiers
without linkability across them.

**Nullifier storage.** Where do verifiers keep their list of seen
nullifiers? On-chain (clear, expensive) or per-verifier off-chain
(cheap, requires verifier discipline)?

## Failure modes

**Nullifier collides across users.** Two users produce the same
nullifier; one is denied falsely. *Detection:* statistical test on
nullifier distribution.

**Nullifier links to credential.** Cryptographic flaw lets observers
correlate a nullifier back to the attestation leaf. *Detection:*
domain-separation audit.

## Alternatives

**A — Per-context nullifier** (`persistentHash([nullifier_domain,
user_secret_key, verifier_id])` — recommended for unlinkability).

**B — Universal nullifier** (one per user per credential; same across
verifiers — simpler but linkable).
