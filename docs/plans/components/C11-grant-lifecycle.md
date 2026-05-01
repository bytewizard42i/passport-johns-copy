# C11 · Grant lifecycle

**Serves:** P4 · P7.

## Outcome

The operations on grants — issue, modify, revoke, expire. Implements P4
(revoke-and-continue) and P7 (scoped grants) over time. Verifiable from
chain state per I-7.6.

## Dependencies

- **C10** — operates on the grant primitive.
- **C12** — enforcement reads the current lifecycle state.
- **C1** — lifecycle state lives in C1.
- **C13** — lost-device flow leverages grant revocation.

## Open questions

**Revocation propagation.** When a device is revoked, do its grants
instantly become invalid or wait for a TTL? Instant is safer; TTL is
more efficient on-chain.

**Modification semantics.** Is "modify" a separate concept, or just
"revoke-old + issue-new"? Different audit-trail and UX consequences.

**Expiry handling.** Does an expired grant remove itself from chain
state automatically (gas paid by whom?) or stay as a tombstone? Affects
state-bloat economics.

## Failure modes

**Revocation lag.** Revoked grant remains usable due to caching or
replication delay. *Detection:* timed test of revocation propagation
across the chain.

**State bloat.** Expired grants accumulate; chain state grows
unboundedly. *Detection:* per-account state-size projections at scale.

**Modify-as-replace race.** Two concurrent modifications cause one to be
lost. *Detection:* concurrency test on grant modify path.

## Alternatives

**A — Instant revocation, automatic expiry-cleanup.** Strict but
state-heavy.

**B — TTL-based revocation, lazy expiry.** Looser; some replay window
after revocation.

**C — Hybrid: instant for revocation, lazy for expiry.**
