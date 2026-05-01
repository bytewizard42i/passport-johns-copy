# C17 · View-key + indexer sync

**Serves:** P3 · P8.

## Outcome

The read half of the wallet — view keys handed to a substitutable
indexer that reconstructs visible chain state for the UI. Substitutable
per P8.

## Dependencies

- **C16** — view keys held in wallet local storage.
- **C2** — sync includes name ownership state.
- **C10 · C11** — sync includes grant state.
- **C18 – C21** — sync includes attestation Merkle proofs.
- **External** — Midnight indexer protocol; third-party or self-hosted
  indexer providers.

## Open questions

**Indexer protocol shape.** gRPC, JSON-RPC, GraphQL? Different
ergonomics for SDKs and dApps.

**Privacy properties.** What does the indexer learn about the user
(which view keys, which queries, which IP)? How do we limit it?

**Multiple-indexer composition.** If the user wants to use two indexers
(redundancy), does the wallet aggregate, or pick one?

**Hosted vs client-only.** Ship with a hosted indexer, a client-only
path (light-client-style), or both?

## Failure modes

**Indexer learns too much.** A malicious indexer correlates queries to
identify the user. *Detection:* privacy review of indexer query
patterns.

**Indexer goes down.** User can't see balances or grant state.
*Detection:* fallback indexer not configured; user is stuck.

**Sync drift.** Indexer is behind chain state; wallet UI shows stale
balances. *Detection:* timestamp comparison between indexer and chain.

## Alternatives

**A — Hosted indexer (single provider).** Simplest; highest privacy
risk.

**B — Multiple-provider directory.** Substitutable per P8.

**C — Client-only light-client sync.** Strongest privacy, most
resource-intensive.

**D — Hybrid (default to provider, fall back to client-only).**
