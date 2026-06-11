// F2 — True zero-NIGHT, zero-DUST onboarding.
//
// Same two-phase flow as F1, but the user wallet holds nothing at all. The
// user's only on-chain action is a trivial circuit call (bump_counter) whose
// only economic component is the fee. If F1 passes but F2 fails, the user
// must hold *some* NIGHT for sponsorship to work — material for the
// bootstrap UX (see brief).

import { setupSponsor, setupFreshWallet, setupCounter, runTest, stopAll } from '../test-helpers.js';
import { currentState, balancesSnapshot, nightBalanceOf } from '../common.js';
import { createSponsoredProviders } from '../sponsorship.js';

await runTest({
  testId: 'F2',
  name: 'zero-start-onboarding',
  description: 'zero-NIGHT zero-DUST user lands a circuit call via sponsor',
  action: async () => {
    const sponsor = await setupSponsor();
    const user = await setupFreshWallet('user', 'USER_SEED');

    const userStateBefore = await currentState(user);
    const userBefore = balancesSnapshot(userStateBefore);
    if (nightBalanceOf(userStateBefore) !== 0n) {
      throw new Error('Precondition violated: user wallet is not empty (reuse of a funded USER_SEED?)');
    }
    const sponsorBefore = balancesSnapshot(await currentState(sponsor));

    // The counter must already exist (deployed by `npm run deploy`, sponsor-
    // paid). F2 is about the user's circuit call, not the deployment — the
    // deployment shape is F6's question.
    const { providers, handoffLog } = await createSponsoredProviders(user, sponsor);
    const { address, found } = await setupCounter(providers, { reuseDeployment: true });

    const result = await found.callTx.bump_counter();
    const txHash = result?.public?.txId ?? result?.public?.transactionHash;

    const userAfter = balancesSnapshot(await currentState(user));
    const sponsorAfter = balancesSnapshot(await currentState(sponsor));

    await stopAll(user, sponsor);

    return {
      verdict: txHash ? ('PASS' as const) : ('PARTIAL' as const),
      txHash: txHash ? String(txHash) : undefined,
      note: txHash
        ? 'User with zero NIGHT and zero DUST landed a sponsored circuit call.'
        : 'callTx returned without surfacing a tx hash.',
      details: {
        userSeed: user.seed,
        contractAddress: address,
        userBefore,
        userAfter,
        sponsorBefore,
        sponsorAfter,
        wireHandoffs: handoffLog,
      },
    };
  },
});
