# C13 · Lost-device flow

**Serves:** P3 · P4.

## Outcome

The flow by which a user revokes a lost or compromised device while
retaining access via others. Implements P4 (revoke-and-continue).
Mirrors I-4.1 through I-4.4.

## Dependencies

- **C1** — device set is in account-custody contract state.
- **C9** — authentication on a remaining device authorises revocation.
- **C11** — revocation is a grant-lifecycle operation on the lost
  device's authorisations.
- **C12** — chain-side enforcement rejects post-revocation use of the
  revoked key.

## Open questions

**Revocation UX.** Does the user need a second-device confirmation
(two-of-N approval), or can any single remaining device revoke?
Single-device is faster; two-of-N is safer if a remaining device is also
compromised.

**Detection vs explicit revocation.** Does the wallet detect long device
inactivity and prompt revocation, or wait for explicit user action?

**Audit trail.** Does the revocation transaction record the reason
(lost / compromised / replaced)? Affects forensic analysis but adds
chain state.

## Failure modes

**No remaining authorised device.** User has lost the only device that
could revoke. *Detection:* user reports inability to revoke after device
loss.

**Revoked device retains usable key material.** Chain state propagation
lag or cache. *Detection:* timed test of post-revocation operations.

**Phishing-induced revocation.** Attacker convinces user to revoke their
working device, locking themselves out. *Detection:* unusual-revocation
telemetry; warning UX before destructive action.

## Alternatives

**A — Any remaining device can revoke** (simplest).

**B — Two-of-N approval for revocation** (safer, requires multi-device).

**C — Hybrid — single-device for normal revocation, two-of-N for
high-value-grant revocation.**
