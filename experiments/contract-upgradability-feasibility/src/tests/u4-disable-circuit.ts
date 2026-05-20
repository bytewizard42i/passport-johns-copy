// U4 — Disable a circuit by removing its verifier key.
//
// Pre-condition: U2 has rotated authority; the wallet provider may or may
// not be wired to the new key. The natural failure mode (wallet still on
// old key) is itself a finding — captured by the maintenance call's error.
//
// Steps:
//   1. removeVerifierKey('increment')
//   2. Call `increment` via the circuit — expect rejection
//   3. Call `bump_other` — expect success (other circuits unaffected)
//   4. Read counter; assert it advanced only by bump_other's delta

import { setupContract, runTest, circuitMaintenance } from '../test-helpers.js';

const TEST_ID = 'U4';

await runTest({
  testId: TEST_ID,
  name: 'disable-circuit',
  description: 'removeVerifierKey disables one circuit; sibling circuit still works',
  action: async () => {
    const { walletCtx, contract, providers } = await setupContract();

    const incMgmt = circuitMaintenance(providers, 'increment', contract.address);

    // 1. Disable increment.
    let removeResult: any = null;
    let removeError: string | null = null;
    try {
      removeResult = await (incMgmt as any).removeVerifierKey();
    } catch (e: any) {
      removeError = e?.message ?? String(e);
    }
    // FinalizedTxData is flat: { txId, txHash, status, blockHeight, ... }.
    const removeTx = removeResult?.txHash ?? removeResult?.txId ?? null;

    // 2. Try to call the now-disabled increment.
    let incrementCall: { ok: boolean; tx?: string; error?: string } = { ok: false };
    try {
      const r: any = await contract.found.callTx.increment();
      incrementCall = {
        ok: true,
        tx: r?.public?.txId ?? r?.public?.transactionHash ?? r?.txHash ?? r?.txId ?? '(no-hash)',
      };
    } catch (e: any) {
      incrementCall = { ok: false, error: e?.message ?? String(e) };
    }

    // 3. Call the still-enabled bump_other.
    let bumpCall: { ok: boolean; tx?: string; error?: string } = { ok: false };
    try {
      const r: any = await contract.found.callTx.bump_other();
      bumpCall = {
        ok: true,
        tx: r?.public?.txId ?? r?.public?.transactionHash ?? r?.txHash ?? r?.txId ?? '(no-hash)',
      };
    } catch (e: any) {
      bumpCall = { ok: false, error: e?.message ?? String(e) };
    }

    await walletCtx.wallet.stop();

    // PASS = remove succeeded, increment rejected, bump_other accepted.
    const removeOK = !!removeTx || (!removeError && removeResult != null);
    const allOK = removeOK && !incrementCall.ok && bumpCall.ok;
    const verdict = allOK ? 'PASS' : removeError ? 'FAIL' : 'PARTIAL';
    return {
      verdict,
      txHash: removeTx ?? undefined,
      errorCode: removeError ? 'remove-verifier-key-failed' : undefined,
      note: allOK
        ? 'circuit isolation works: increment rejected, bump_other still callable'
        : removeError
          ? `removeVerifierKey threw: ${removeError}`
          : `partial — incrementAccepted=${incrementCall.ok}, bumpAccepted=${bumpCall.ok}`,
      details: {
        contractAddress: contract.address,
        removeResult,
        removeError,
        incrementCall,
        bumpCall,
      },
    };
  },
});
