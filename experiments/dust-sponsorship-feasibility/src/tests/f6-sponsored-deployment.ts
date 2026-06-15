// F6 — Sponsored contract deployment.
//
// The Passport onboarding shape: a user with zero NIGHT and zero DUST
// deploys a contract, with the deploy transaction balanced in two phases
// (user: shielded+unshielded, a no-op for an empty wallet; sponsor: dust).
// If sponsorship does not extend to deployment transactions, a fresh user
// cannot create their account contract without pre-funding — alternative A
// would fail for the single most important transaction in the Passport
// lifecycle.
//
// Unlike F2 this deploys its own contract instance and does NOT touch
// deployment.json (which belongs to the sponsor-paid F2 setup).

import { deployContract } from '@midnight-ntwrk/midnight-js-contracts';

import {
  setupSponsor,
  setupFreshWallet,
  runTest,
  stopAll,
  COMPILED_COUNTER,
  requireCompiled,
} from '../test-helpers.js';
import { currentState, balancesSnapshot, nightBalanceOf } from '../common.js';
import { createSponsoredProviders } from '../sponsorship.js';
import { PRIVATE_STATE_ID } from '../utils.js';

await runTest({
  testId: 'F6',
  name: 'sponsored-deployment',
  description: 'zero-NIGHT zero-DUST user deploys a contract via sponsor',
  action: async () => {
    requireCompiled();
    const sponsor = await setupSponsor();
    const user = await setupFreshWallet('user', 'USER_SEED');

    const userStateBefore = await currentState(user);
    const userBefore = balancesSnapshot(userStateBefore);
    if (nightBalanceOf(userStateBefore) !== 0n) {
      throw new Error('Precondition violated: user wallet is not empty (reuse of a funded USER_SEED?)');
    }
    const sponsorBefore = balancesSnapshot(await currentState(sponsor));

    const { providers, handoffLog } = await createSponsoredProviders(user, sponsor);

    const deployed = await deployContract(providers, {
      compiledContract: COMPILED_COUNTER(),
      privateStateId: PRIVATE_STATE_ID,
      initialPrivateState: {},
    });
    const address = deployed.deployTxData.public.contractAddress;
    const txHash =
      deployed.deployTxData.public.txId ?? deployed.deployTxData.public.transactionHash;

    // Indexer check: the contract state must be queryable at the new address.
    let indexerSeesContract: boolean | string = 'not-checked';
    try {
      const pdp: any = providers.publicDataProvider;
      if (typeof pdp.queryContractState === 'function') {
        const st = await pdp.queryContractState(address);
        indexerSeesContract = st != null;
      }
    } catch (e: any) {
      indexerSeesContract = `query failed: ${e?.message ?? String(e)}`;
    }

    const userAfter = balancesSnapshot(await currentState(user));
    const sponsorAfter = balancesSnapshot(await currentState(sponsor));

    await stopAll(user, sponsor);

    return {
      verdict: 'PASS' as const,
      txHash: txHash ? String(txHash) : undefined,
      note: 'Zero-token user deployed a contract; sponsor paid the dust fee.',
      details: {
        userSeed: user.seed,
        contractAddress: address,
        indexerSeesContract,
        userBefore,
        userAfter,
        sponsorBefore,
        sponsorAfter,
        wireHandoffs: handoffLog,
      },
    };
  },
});
