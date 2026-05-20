// U7 — Add a brand-new circuit slot.
//
// Attempt to insert a verifier key for `decrement` — a circuit present in
// v2 but absent from v1's compiled artefact at deploy time. Outcome is
// unknown per the brief; the test records whatever the node returns. Uses
// the low-level `submitInsertVerifierKeyTx` because (a) after U6's swap
// the on-chain VK set already diverges from v1, and (b) the compiled
// artefact passed in must be the v2 one to address `decrement` as a
// valid `ProvableCircuitId`.

import {
  setupForMaintenance,
  runTest,
  verifierKeyFor,
  compiledV2,
} from '../test-helpers.js';
import { submitInsertVerifierKeyTx } from '@midnight-ntwrk/midnight-js-contracts';
import { zkConfigPathV2 } from '../utils.js';

const TEST_ID = 'U7';

await runTest({
  testId: TEST_ID,
  name: 'add-circuit',
  description: 'insert v2.decrement VK into v1-deployed contract (new slot)',
  action: async () => {
    const m = await setupForMaintenance();
    const decrementVK = await verifierKeyFor(zkConfigPathV2, 'decrement');

    let result: any = null;
    let err: string | null = null;
    try {
      result = await submitInsertVerifierKeyTx(
        m.providers,
        (await compiledV2()) as any,
        m.address,
        'decrement' as any,
        decrementVK as any,
      );
    } catch (e: any) {
      err = e?.message ?? String(e);
    }
    const txHash = result?.txHash ?? result?.txId ?? null;

    await m.walletCtx.wallet.stop();

    // Outcome unknown by the brief — record what we got. PASS means
    // insertion landed (decrement is now a callable circuit on-chain).
    // FAIL means the node rejected the insertion (circuit set fixed at
    // deploy).
    const verdict = txHash ? 'PASS' : 'FAIL';
    return {
      verdict,
      txHash: txHash ?? undefined,
      errorCode: err ? 'insert-rejected' : undefined,
      note: txHash
        ? 'new circuit slot accepted — circuit set IS evolvable post-deploy'
        : `node rejected new-circuit insertion: ${err ?? '(unknown)'}`,
      details: {
        contractAddress: m.address,
        insertResult: result,
        insertError: err,
      },
    };
  },
});
