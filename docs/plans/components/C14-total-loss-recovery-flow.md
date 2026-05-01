# C14 · Total-loss recovery flow

**Serves:** P1 · P5 · P6.

## Outcome

The flow by which a user recovers their account when all authorised
devices are lost. Implements P5 (recover-from-zero). Mirrors I-5.1
through I-5.4.

## Dependencies

- **C15** — helper protocol for distributing and reassembling recovery
  shares.
- **C1** — recovered identity reattaches to the same account.
- **C16** — recovery reconstructs into wrapped storage on a fresh
  device.
- **C9** — fresh device's auth provides a new key registered on the
  recovered account.
- **External** — DeRec or equivalent social recovery substrate.

## Open questions

**Recovery share scheme.** Shamir (3-of-5 default per design doc) or
alternative (e.g., threshold encryption)? Different helper UX and threat
model.

**Helper authentication.** Does each helper authenticate with the
recovering user before releasing their share? PIN, biometric prompt,
OOB confirmation?

**Recovery quorum policy.** Strict t-of-n only, or include time-locked
self-recovery (e.g., wait 30 days, then any single helper plus a
publicly-revealed timelock)?

**Reconciliation with chain state.** After recovery, the user has a new
device key. How does that key get registered on the (existing)
account-custody contract? Special recovery transaction, or normal
device-add via the recovered seed?

## Failure modes

**Insufficient helpers respond.** Below-quorum participation.
*Detection:* user-initiated recovery times out or stalls.

**Compromised helpers collude.** Above-quorum helpers maliciously
reconstruct without user consent. *Detection:* user notified of
unauthorised reconstruction attempts; mitigations in helper protocol.

**Recovery exposes seed to user UI.** I-1.4 violated. *Detection:* code
review of the recovery flow.

**Recovered identity doesn't match original.** Different name or
different account anchor than what was registered. *Detection:* C14
end-to-end test fails to restore visible balances and credentials.

## Alternatives

**A — DeRec (3-of-5 Shamir, daily verification)** — design doc default.

**B — Encrypted-blob backup to user-chosen storage** — alternative for
users without a social graph (per MIP-4 scope).

**C — Hybrid (DeRec + encrypted-blob fallback).**

**D — Identity-proof-based recovery** (proven KYC re-establishes the
account; weaker security, easier UX).
