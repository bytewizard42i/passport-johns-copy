// U9 — In-flight call vs. maintenance.
//
// Submit `bump_other` (a working circuit call) and concurrently submit
// `removeVerifierKey('bump_other')`. Observe which wins. Restore the VK
// at the end so the on-chain state remains compatible with the v1 compile
// for downstream tests.
//
// Pre-condition: the on-chain VK set must match the v1 compile so the
// initial `findDeployedContract` succeeds. Execution order ensures this:
// U5 has restored the v1 VK set by the time U9 runs.

import {
  setupContract,
  setupForMaintenance,
  runTest,
  verifierKeyFor,
  compiledV1,
} from '../test-helpers.js';
import {
  submitRemoveVerifierKeyTx,
  submitInsertVerifierKeyTx,
} from '@midnight-ntwrk/midnight-js-contracts';
import { zkConfigPathV1 } from '../utils.js';

const TEST_ID = 'U9';

await runTest({
  testId: TEST_ID,
  name: 'in-flight-call',
  description: 'race a circuit call against removeVerifierKey for the same circuit',
  action: async () => {
    const s = await setupContract();

    // Fire both concurrently. The high-level mgmt API and the low-level
    // submitRemoveVerifierKeyTx are functionally identical for race
    // purposes; using the low-level here for clarity.
    const callPromise = (async () => {
      try {
        const r: any = await s.contract.found.callTx.bump_other();
        return {
          ok: true as const,
          tx: r?.public?.txId ?? r?.public?.transactionHash ?? r?.txHash ?? r?.txId ?? '(no-hash)',
          blockHeight: r?.public?.blockHeight ?? r?.blockHeight ?? null,
        };
      } catch (e: any) {
        return { ok: false as const, error: e?.message ?? String(e) };
      }
    })();

    const removePromise = (async () => {
      try {
        const r: any = await submitRemoveVerifierKeyTx(
          s.providers,
          compiledV1() as any,
          s.contract.address,
          'bump_other' as any,
        );
        return {
          ok: true as const,
          tx: r?.txHash ?? r?.txId ?? '(no-hash)',
          blockHeight: r?.blockHeight ?? null,
        };
      } catch (e: any) {
        return { ok: false as const, error: e?.message ?? String(e) };
      }
    })();

    const [callRes, removeRes] = await Promise.all([callPromise, removePromise]);
    await s.walletCtx.wallet.stop();

    // Restore: if remove succeeded, re-insert bump_other VK so the v1
    // compile still binds for later tests. Use a fresh maintenance-only
    // setup because the previous wallet is stopped.
    let restored: any = null;
    if (removeRes.ok) {
      try {
        const m = await setupForMaintenance();
        const vk = await verifierKeyFor(zkConfigPathV1, 'bump_other');
        const r: any = await submitInsertVerifierKeyTx(
          m.providers,
          compiledV1() as any,
          m.address,
          'bump_other' as any,
          vk as any,
        );
        restored = { ok: true, tx: r?.txHash ?? r?.txId ?? '(no-hash)' };
        await m.walletCtx.wallet.stop();
      } catch (e: any) {
        restored = { ok: false, error: e?.message ?? String(e) };
      }
    }

    // Descriptive — block ordering decides whether the call landed before
    // or after the remove. Either outcome documents the disruption window.
    return {
      verdict: 'PARTIAL',
      note: `call.ok=${callRes.ok} remove.ok=${removeRes.ok} — see evidence for block ordering`,
      details: {
        contractAddress: s.contract.address,
        callResult: callRes,
        removeResult: removeRes,
        restored,
      },
    };
  },
});
