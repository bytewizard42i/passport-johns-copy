// U8 — Evolve the ledger state schema.
//
// v2's contract has an extra ledger field `last_op: Uint<8>` that v1's
// deployed ledger does not declare. Possible outcomes (brief flags as
// unknown):
//   (a) Deployed ledger silently grows when v2-shaped txs land.
//   (b) Submission rejected with a schema-mismatch error.
//   (c) Accepted but new field unreadable.
//
// Runs after U6 and U7 — at which point neither v1 nor v2 compile binds.
// Uses `setupForMaintenance` (no findDeployedContract) and probes the
// indexer for the ledger state.

import { setupForMaintenance, runTest } from '../test-helpers.js';
import { CONFIG } from '../utils.js';

const TEST_ID = 'U8';

await runTest({
  testId: TEST_ID,
  name: 'evolve-ledger',
  description: 'does last_op surface after v2-shaped maintenance has landed?',
  action: async () => {
    const m = await setupForMaintenance();

    let indexerSnapshot: unknown = null;
    try {
      const res = await fetch(CONFIG.indexer, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `query Q($addr: HexEncoded!) {
            contractAction(address: $addr) {
              __typename
              ... on ContractDeploy { address state }
              ... on ContractCall   { address state }
              ... on ContractUpdate { address state }
            }
          }`,
          variables: { addr: m.address },
        }),
      });
      indexerSnapshot = await res.json();
    } catch (e: any) {
      indexerSnapshot = { error: e?.message ?? String(e) };
    }

    await m.walletCtx.wallet.stop();

    return {
      verdict: 'PARTIAL',
      note: 'descriptive — see evidence for indexer ledger snapshot',
      details: {
        contractAddress: m.address,
        indexerSnapshot,
      },
    };
  },
});
