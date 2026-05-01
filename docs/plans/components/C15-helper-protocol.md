# C15 · Helper protocol

**Serves:** P5 · P8.

## Outcome

The protocol that recovery helpers run — interface between C14 and the
people or services holding shares. Substitutable per P8 (multiple helper
implementations possible).

## Dependencies

- **C14** — invoked during recovery.
- **External** — DeRec spec v0.9 or equivalent.

## Open questions

**Helper identity model.** Persistent helper identifiers (a helper is
the same entity across recoveries) vs ephemeral (each recovery uses
fresh identifiers). Persistent is simpler; ephemeral is more
privacy-preserving.

**Daily verification cost.** DeRec specifies daily helper-liveness
checks. What's the bandwidth and battery cost on the user side?
Acceptable for v1.0?

**Non-collusion.** Are helpers cryptographically prevented from
colluding (e.g., via verifiable encryption to the user's quorum), or
rely on trust assumptions?

## Failure modes

**Helper goes silent.** Stops responding to verification. *Detection:*
daily verification protocol flags the silent helper; user prompted to
re-share.

**Helper share leaked.** Helper's storage is breached. *Detection:*
below-quorum number of breaches doesn't reconstruct; above-quorum is the
failure.

**Protocol incompatibility.** Different helper implementations don't
interoperate. *Detection:* a recovery attempt fails because helpers use
different protocol versions.

## Alternatives

**A — DeRec protocol** (design doc default; reasonably mature).

**B — Custom protocol** (Passport-specific; more control, more work).

**C — Cheqd or similar credential-secured helper protocol.**
