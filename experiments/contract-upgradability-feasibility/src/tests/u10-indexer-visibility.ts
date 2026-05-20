// U10 — Indexer / wallet visibility of maintenance events.
//
// After U2/U4/U5 have run (and BEFORE U6/U7 break v1 compile binding),
// probe the indexer for what a watching wallet would see about the
// deployed contract. Descriptive only — no PASS/FAIL gate.
//
// Uses `setupForMaintenance` (no findDeployedContract) so the test
// doesn't depend on whether the on-chain VK set matches any compile.

import { setupForMaintenance, runTest } from '../test-helpers.js';
import { CONFIG } from '../utils.js';

const TEST_ID = 'U10';

async function gqlQuery(query: string, variables: Record<string, unknown> = {}): Promise<unknown> {
  try {
    const res = await fetch(CONFIG.indexer, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables }),
    });
    return await res.json();
  } catch (e: any) {
    return { error: e?.message ?? String(e) };
  }
}

await runTest({
  testId: TEST_ID,
  name: 'indexer-visibility',
  description: 'what does the indexer publish for the maintained contract?',
  action: async () => {
    const m = await setupForMaintenance();

    // 1. Schema discovery — dump ContractAction's type info so FINDINGS.md
    // can quote exact field names.
    const schemaProbe = await gqlQuery(`{
      __type(name: "ContractAction") {
        name kind fields { name type { name kind } } possibleTypes { name }
      }
    }`);

    // 2. Contract-action at this address. The exact field/arg names vary
    // by indexer version — probe a generic shape.
    const contractActions = await gqlQuery(
      `query Q($addr: HexEncoded!) {
         contractAction(address: $addr) { __typename }
       }`,
      { addr: m.address },
    );

    // 3. Schema discovery on the root query so we can find the right
    // transactions / history endpoint.
    const rootProbe = await gqlQuery(`{
      __schema { queryType { fields { name args { name } } } }
    }`);

    await m.walletCtx.wallet.stop();

    return {
      verdict: 'PARTIAL',
      note: 'descriptive indexer dump — see evidence for schema and contract-action data',
      details: {
        contractAddress: m.address,
        schemaProbe,
        contractActions,
        rootProbe,
      },
    };
  },
});
