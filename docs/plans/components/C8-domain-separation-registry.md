# C8 · Domain-separation registry

**Serves:** P6 · P9.

## Outcome

Cross-cutting hash-prefix discipline: every `persistentHash` use site
gets a 6+ byte domain prefix. Prerequisite to credentials, signing, and
naming. The registry ships alongside the standards pipeline.

## Dependencies

- **C2** — namehashes use domain separators.
- **C18 – C21** — attestation construction and nullifier construction
  use distinct prefixes.
- **C6 · C7** — proof inputs carry domain separators.
- **External** — cryptographer review.

## Open questions

**Centralised registry vs per-protocol prefixes.** Central registry
document tracks all prefixes; each protocol owns its prefix. Risk of
collision if uncoordinated.

**Versioning.** Does a domain separator get versioned? If we update a
circuit, does the prefix change?

**Audit timing.** When does the registry get a cryptographer sign-off?
What's the cadence post-v1.0?

## Failure modes

**Domain collision.** Two protocols use the same prefix. *Detection:*
protocol audit; differential test that hashes are equivalent up to
prefix.

**Missing prefix.** A `persistentHash` use site lacks a prefix.
*Detection:* code review or static analysis flagging un-prefixed hash
calls.

## Alternatives

**A — Central registry (markdown + audit).**

**B — Compile-time enforcement** (Compact tooling rejects un-prefixed
hashes).

**C — Hybrid** (both, with compile-time checking what the registry
declares).
