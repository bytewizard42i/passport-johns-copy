// U3 — Authority loss / recovery.
//
// After U2 rotates authority to a fresh key, the SDK auto-updates the
// local private state's signing key to that new authority — so any
// subsequent maintenance call naturally signs with the correct key. To
// actually test "stale-key replay rejected" we have to deliberately
// corrupt the local signing key, point it at a random unrelated key,
// then attempt `replaceAuthority` and expect rejection. The on-chain
// authority is U2's new key; signing with anything else must fail the
// protocol's signature check.
//
// At the end, restore the legitimate signing key so downstream tests
// can still operate.

import {
  setupForMaintenance,
  runTest,
  contractMaintenance,
} from '../test-helpers.js';
import { sampleSigningKey } from '@midnight-ntwrk/compact-runtime';

const TEST_ID = 'U3';

await runTest({
  testId: TEST_ID,
  name: 'authority-loss',
  description: 'stale authority signature is rejected — no recovery on key loss',
  action: async () => {
    const m = await setupForMaintenance();

    // Read the legitimate signing key (set by U2's rotation).
    const legitimateKey = await m.providers.privateStateProvider.getSigningKey(m.address);
    if (!legitimateKey) {
      return {
        verdict: 'FAIL',
        errorCode: 'no-signing-key-in-private-state',
        note: 'privateStateProvider returned null signingKey; U2 must run first',
        details: { contractAddress: m.address },
      };
    }

    // Install an unrelated (stale-equivalent) key into the private state.
    const stalePretender = sampleSigningKey();
    await m.providers.privateStateProvider.setSigningKey(m.address, stalePretender);

    const mgmt = contractMaintenance(m.providers, m.address);
    const thirdKey = sampleSigningKey();

    let attempt: { ok: boolean; tx?: string; error?: string } = { ok: false };
    try {
      const r: any = await (mgmt as any).replaceAuthority(thirdKey);
      attempt = { ok: true, tx: r?.txHash ?? r?.txId ?? '(no-hash)' };
    } catch (e: any) {
      attempt = { ok: false, error: e?.message ?? String(e) };
    }

    // Restore the legitimate key so later tests are not corrupted.
    await m.providers.privateStateProvider.setSigningKey(m.address, legitimateKey);
    await m.walletCtx.wallet.stop();

    // PASS = the stale-key rotation was rejected.
    // FAIL = the stale key still works (security finding).
    const verdict = attempt.ok ? 'FAIL' : 'PASS';
    return {
      verdict,
      errorCode: attempt.ok ? undefined : 'stale-authority-rejected',
      note: attempt.ok
        ? 'SECURITY ANOMALY: random unrelated signing key was accepted'
        : 'stale signing key rejected — recovery story: none, key loss is terminal',
      details: {
        contractAddress: m.address,
        attempt,
        restored: true,
      },
    };
  },
});
