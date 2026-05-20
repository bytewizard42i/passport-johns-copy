// U1 — Deploy v1 and capture the initial maintenance authority pubkey.
//
// Baseline. Every later test depends on a deployed contract; this runner
// owns the deploy step and records:
//   - contract address
//   - the at-deploy signing key (taken from the wallet provider) so U2 has
//     an explicit handle on "the old authority"
//   - whatever indexer surface exposes the on-chain authority pubkey (best
//     effort — schema is probed and recorded verbatim)

import { firstValueFrom } from 'rxjs';
import { setupContract, runTest, saveAuthority } from '../test-helpers.js';
import { CONFIG } from '../utils.js';

const TEST_ID = 'U1';

await runTest({
  testId: TEST_ID,
  name: 'deploy-and-authority',
  description: 'deploy v1; capture initial maintenance authority',
  action: async () => {
    const { walletCtx, contract } = await setupContract({ reuseDeployment: false });

    const state = await firstValueFrom(walletCtx.wallet.state());
    const walletSigningKey =
      walletCtx.unshieldedKeystore?.getSigningPublicKey?.()?.toHexString?.() ??
      walletCtx.unshieldedKeystore?.getBech32Address?.() ??
      '(unknown — keystore did not expose a signing pubkey)';

    // EXPERIMENT-NOTE [U1]: capture whatever the indexer exposes for the
    // deployed contract. The exact field names are SDK-version-dependent;
    // we record raw responses so FINDINGS.md can quote them.
    let indexerSnapshot: unknown = null;
    try {
      const res = await fetch(CONFIG.indexer, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `query Q($addr: HexEncoded!) { contractAction(address: $addr) { __typename } }`,
          variables: { addr: contract.address },
        }),
      });
      indexerSnapshot = await res.json();
    } catch (e: any) {
      indexerSnapshot = { error: e?.message ?? String(e) };
    }

    // Persist the at-deploy authority handle for U2 to consume.
    saveAuthority(walletSigningKey, 'at-deploy authority (wallet signing key)');

    await walletCtx.wallet.stop();

    return {
      verdict: 'PASS',
      txHash: contract.found?.deployTxData?.public?.txHash ?? contract.address,
      note: `deployed at ${contract.address}`,
      details: {
        contractAddress: contract.address,
        atDeployAuthority: walletSigningKey,
        deployTx: contract.found?.deployTxData?.public ?? null,
        indexerSnapshot,
      },
    };
  },
});
