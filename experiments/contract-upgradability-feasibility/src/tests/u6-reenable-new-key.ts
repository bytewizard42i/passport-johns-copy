// U6 — The critical test. Logic upgrade in place.
//
// Replace the v1 `increment` verifier key with the v2 `increment` verifier
// key (compiled from a body that does `counter += 2` instead of `+= 1`).
// The two VKs land at the same circuit slot, at the same on-chain address,
// while the ledger state is preserved.
//
// Post-swap, the on-chain VK set is {bump_other v1, query_counter v1,
// increment v2}. Neither the v1 compile (expects v1 increment VK) nor the
// v2 compile (also has a `decrement` slot that v1 contract didn't deploy
// with) satisfies `findDeployedContract`'s strict slot/VK match. We
// therefore verify the swap by tx hashes only — calling increment is not
// possible without a custom-compiled "v1.5" artefact, which is out of
// scope for this experiment. The "counter += 2 holds" check is deferred
// to indexer state inspection in U10.

import {
  setupForMaintenance,
  runTest,
  verifierKeyFor,
  compiledV1,
  compiledV2,
} from '../test-helpers.js';
import {
  submitRemoveVerifierKeyTx,
  submitInsertVerifierKeyTx,
} from '@midnight-ntwrk/midnight-js-contracts';
import { zkConfigPathV2 } from '../utils.js';

const TEST_ID = 'U6';

await runTest({
  testId: TEST_ID,
  name: 'reenable-new-key',
  description: 'remove v1 increment VK; insert v2 increment VK at same slot',
  action: async () => {
    const m = await setupForMaintenance();
    const v2VK = await verifierKeyFor(zkConfigPathV2, 'increment');

    // 1. Remove v1 increment VK.
    let removeRes: any = null;
    let removeErr: string | null = null;
    try {
      removeRes = await submitRemoveVerifierKeyTx(
        m.providers,
        compiledV1() as any,
        m.address,
        'increment' as any,
      );
    } catch (e: any) {
      removeErr = e?.message ?? String(e);
    }
    const removeTx = removeRes?.txHash ?? removeRes?.txId ?? null;

    // 2. Insert v2 increment VK at the same slot. The compiled artefact
    // passed in must be the v2 one — that's the artefact that "knows
    // about" the new logic.
    let insertRes: any = null;
    let insertErr: string | null = null;
    try {
      insertRes = await submitInsertVerifierKeyTx(
        m.providers,
        (await compiledV2()) as any,
        m.address,
        'increment' as any,
        v2VK as any,
      );
    } catch (e: any) {
      insertErr = e?.message ?? String(e);
    }
    const insertTx = insertRes?.txHash ?? insertRes?.txId ?? null;

    await m.walletCtx.wallet.stop();

    const swapped = !removeErr && !insertErr && !!removeTx && !!insertTx;
    const verdict = swapped ? 'PASS' : 'FAIL';
    return {
      verdict,
      txHash: insertTx ?? undefined,
      errorCode: removeErr ? 'remove-failed' : insertErr ? 'insert-failed' : undefined,
      note: swapped
        ? 'logic upgrade landed: v1 increment VK removed, v2 increment VK inserted at same address'
        : `removeErr=${removeErr ?? '(ok)'} insertErr=${insertErr ?? '(ok)'}`,
      details: {
        contractAddress: m.address,
        removeRes,
        removeErr,
        insertRes,
        insertErr,
      },
    };
  },
});
