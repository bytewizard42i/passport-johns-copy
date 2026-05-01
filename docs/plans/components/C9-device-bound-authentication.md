# C9 · Device-bound authentication

**Serves:** P1 · P3 · P6.

## Outcome

How a device proves it is the user's authorised device. Passkey
(WebAuthn) bound to the device's secure boundary. Provides P1
(seedless), P3 (peer-device), P6 (key-bound).

## Dependencies

- **C5** — the signing key produced by device-bound auth.
- **C16** — wallet storage holds wrapped key material.
- **C1** — device public key registered in account-custody contract.
- **External** — WebAuthn spec, platform TEE / StrongBox / Secure
  Enclave APIs.

## Open questions

**WebAuthn PRF extension vs assertion fallback.** PRF gives
deterministic key derivation; assertion fallback works on more devices
but with weaker properties. Design doc says both paths required
(FEATURES.md feature 1).

**Browser × OS support matrix.** Which platforms get PRF, which get
fallback? Product-owner-signed matrix per FEATURES.md.

**Native app vs browser.** If we ship a mobile native app, does it use
platform WebAuthn or platform secure enclave directly?

## Failure modes

**Passkey not recoverable on device loss.** If passkey isn't synced
(iCloud Keychain, Google Password Manager), losing the device loses
access. *Detection:* user reports of recovery failure tied to passkey
absence.

**PRF unavailable.** User's browser / OS doesn't support PRF; falls
back; fallback path has lower security. *Detection:* telemetry shows PRF
failure rate above threshold.

**Cross-origin attack.** Passkey scoped wrongly; another origin can
exercise it. *Detection:* security review of WebAuthn `rpId` binding.

## Alternatives

**A — WebAuthn PRF + assertion fallback** (design doc default).

**B — WebAuthn assertion only** (broader compatibility, weaker
security).

**C — Platform-native** (Secure Enclave on iOS, StrongBox on Android, no
WebAuthn). Hardest to ship cross-platform.
