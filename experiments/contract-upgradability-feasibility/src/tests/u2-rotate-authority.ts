// U2 — Rotate the maintenance authority.
//
// FINDING 2026/05/18: the high-level `mgmt.replaceAuthority(newKey)` (and
// the underlying `submitReplaceAuthorityTx`) auto-overwrites the LOCAL
// privateStateProvider signing key for this contract on success — the
// docstring says "After the transaction is finalized, the current signing
// key stored in the given private state provider is overwritten with the
// given new authority key." This means every subsequent maintenance call
// naturally signs with the now-correct key, and a naive "old-key replay"
// test (just calling another maintenance op after rotation) ALWAYS
// succeeds. To probe "old key rejected" you have to deliberately corrupt
// the private state's signing key — that test belongs in U3.
//
// This test therefore only verifies that the rotation tx itself lands and
// the SDK's auto-update behaviour matches the docstring. It does NOT call
// any state-mutating maintenance op — earlier versions of this test
// accidentally removed `bump_other` and broke every downstream test.

import {
  setupForMaintenance,
  runTest,
  contractMaintenance,
} from '../test-helpers.js';
import { sampleSigningKey } from '@midnight-ntwrk/compact-runtime';

const TEST_ID = 'U2';

await runTest({
  testId: TEST_ID,
  name: 'rotate-authority',
  description: 'rotate maintenance authority; verify SDK auto-updates local key',
  action: async () => {
    const m = await setupForMaintenance();

    const beforeKey = await m.providers.privateStateProvider.getSigningKey(m.address);

    const newAuthority = sampleSigningKey();
    const mgmt = contractMaintenance(m.providers, m.address);
    const rotationResult: any = await (mgmt as any).replaceAuthority(newAuthority);
    const rotationTx = rotationResult?.txHash ?? rotationResult?.txId ?? null;

    const afterKey = await m.providers.privateStateProvider.getSigningKey(m.address);
    const sdkAutoRotated = JSON.stringify(afterKey) !== JSON.stringify(beforeKey);

    await m.walletCtx.wallet.stop();

    const verdict = !!rotationTx && sdkAutoRotated ? 'PASS' : 'PARTIAL';
    return {
      verdict,
      txHash: rotationTx ?? undefined,
      note:
        verdict === 'PASS'
          ? 'authority rotated; SDK auto-updated local pSP signing key (per docstring)'
          : `rotation tx ok=${!!rotationTx}; local key auto-rotated=${sdkAutoRotated}`,
      details: {
        contractAddress: m.address,
        rotationResult,
        beforeKeyEqualsAfter: !sdkAutoRotated,
      },
    };
  },
});
