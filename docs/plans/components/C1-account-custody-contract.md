# C1 · Account-custody contract

**Serves:** P1 · P3 · P4 · P5 · P8.

## Outcome

The on-chain Compact contract representing a Passport account. Holds the
device set, name binding, active scoped grants, and — depending on C4's
chosen alternative — the user's Midnight-native asset balances. Every
Passport-touching operation interacts with this contract.

## Dependencies

- **C4** — asset-custody model determines what C1 holds vs. what lives at
  addresses.
- **C2** — name service binds names to C1.
- **C9** — devices register as authorised keys in C1.
- **C10 · C11 · C12** — grants live in, operate on, and are enforced by
  C1.

## Open questions

**One contract per account, or single registry?** Per-account instances
(NEAR-style) give clean isolation but cost more to deploy and harder for
indexers; a single registry concentrates state and metadata.

**Who deploys.** Self-deployed at onboarding, or pre-deployed registry
the user joins?

**Upgrade path.** Compact contracts have no built-in upgradability per
the spec. How do we migrate the user base if the contract evolves?

## Failure modes

**Deploy cost prohibitive.** Per-account deploys exceed tolerable
onboarding cost. *Detection:* onboarding-cost projections at user-base
scale.

**Privacy concentration.** A single registry surface enables metadata
correlation across accounts. *Detection:* on-chain analysis enumerates
accounts with high precision.

**Upgrade fragmentation.** Version-skew between deployed contracts
breaks operations. *Detection:* a Compact spec change makes some
accounts incompatible with new tooling.

## Alternatives

**A — One Compact contract per account** (NEAR-style isolation).

**B — Single registry contract with accounts as entries** (cheaper,
privacy concentration).

**C — Hybrid** (registry for discovery + per-account contract for state).
