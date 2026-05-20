// U5 — Re-enable the disabled circuit by re-inserting the ORIGINAL v1
// verifier key. Counter should advance by 1 on the next increment.
//
// After U4 removed the increment VK, `findDeployedContract` against the
// v1 compile throws with "Following operations: increment, are undefined
// or have mismatched verifier keys" — the SDK refuses to bind a compile
// whose circuit-set diverges from the on-chain VK set. This test
// therefore uses the LOW-LEVEL `submitInsertVerifierKeyTx` (which only
// needs providers + compile + address), and only after the VK is back
// does it `findDeployedContract` to call increment.

import {
  setupForMaintenance,
  setupContract,
  runTest,
  verifierKeyFor,
  compiledV1,
} from '../test-helpers.js';
import {
  submitInsertVerifierKeyTx,
} from '@midnight-ntwrk/midnight-js-contracts';
import { zkConfigPathV1 } from '../utils.js';

const TEST_ID = 'U5';

await runTest({
  testId: TEST_ID,
  name: 'reenable-same-key',
  description: 're-insert original verifier key; increment callable again',
  action: async () => {
    const m = await setupForMaintenance();
    const v1VK = await verifierKeyFor(zkConfigPathV1, 'increment');

    const insertResult: any = await submitInsertVerifierKeyTx(
      m.providers,
      compiledV1() as any,
      m.address,
      'increment' as any,
      v1VK as any,
    );
    const insertTx = insertResult?.txHash ?? insertResult?.txId ?? null;
    await m.walletCtx.wallet.stop();

    // Now that the on-chain VK set matches the v1 compile, find + call.
    let incCall: { ok: boolean; tx?: string; error?: string } = { ok: false };
    try {
      const s = await setupContract();
      const r: any = await s.contract.found.callTx.increment();
      incCall = {
        ok: true,
        tx: r?.public?.txId ?? r?.public?.transactionHash ?? r?.txHash ?? r?.txId ?? '(no-hash)',
      };
      await s.walletCtx.wallet.stop();
    } catch (e: any) {
      incCall = { ok: false, error: e?.message ?? String(e) };
    }

    const verdict = insertTx && incCall.ok ? 'PASS' : insertTx ? 'PARTIAL' : 'FAIL';
    return {
      verdict,
      txHash: insertTx ?? undefined,
      note: incCall.ok
        ? 'v1 increment VK re-inserted; increment callable again (v1 semantics, +1)'
        : `insert ok=${!!insertTx}; increment-call ok=${incCall.ok}`,
      details: {
        contractAddress: m.address,
        insertResult,
        incrementCall: incCall,
      },
    };
  },
});
