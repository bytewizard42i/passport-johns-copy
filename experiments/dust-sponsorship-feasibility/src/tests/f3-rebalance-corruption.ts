// F3 — Re-balance corruption (negative).
//
// Sponsor incorrectly calls balanceFinalizedTransaction with
// tokenKindsToBalance: 'all' instead of ['dust'], attempting to re-balance
// the user's already-balanced unshielded portion. The tutorial warns this
// produces double-spending errors. The error shape — local exception or
// post-submission rejection, error code, recovery path — is the deliverable.
//
// Verdict semantics: PASS = a failure was observed and characterised.
// PARTIAL = the transaction was accepted anyway (the warning is refuted —
// itself a finding). FAIL = the harness could not reach the sponsor phase.

import {
  setupSponsor,
  setupFreshWallet,
  fundUserWithNight,
  runTest,
  stopAll,
  classifyError,
  serialiseError,
} from '../test-helpers.js';
import { currentState, balancesSnapshot, NIGHT_RAW } from '../common.js';
import { userTransferWithoutFees, sponsorBalanceDust, DEFAULT_TTL_MS } from '../sponsorship.js';
import { unshieldedAddressOf } from '../utils.js';

const FUND_AMOUNT = BigInt(process.env.F3_FUND_AMOUNT ?? '1000000');
const TRANSFER_AMOUNT = BigInt(process.env.F3_TRANSFER_AMOUNT ?? '100000');

await runTest({
  testId: 'F3',
  name: 'rebalance-corruption',
  description: "sponsor re-balances with 'all' instead of ['dust'] (negative)",
  action: async () => {
    const sponsor = await setupSponsor();
    const user = await setupFreshWallet('user', 'USER_SEED');

    const fundingTx = await fundUserWithNight(sponsor, user, FUND_AMOUNT);
    const userBefore = balancesSnapshot(await currentState(user));

    const ttl = new Date(Date.now() + DEFAULT_TTL_MS);
    const userFinalized = await userTransferWithoutFees(
      user,
      [
        {
          type: 'unshielded',
          outputs: [
            {
              type: NIGHT_RAW,
              receiverAddress: unshieldedAddressOf(sponsor),
              amount: TRANSFER_AMOUNT,
            },
          ],
        },
      ],
      ttl,
    );

    let stage = 'sponsor-balance';
    let txId: unknown;
    let observedError: any;
    try {
      const fullyBalanced = await sponsorBalanceDust(sponsor, userFinalized, ttl, 'all');
      stage = 'submit';
      txId = await sponsor.wallet.submitTransaction(fullyBalanced);
      stage = 'accepted';
    } catch (e: any) {
      observedError = e;
    }

    const userAfter = balancesSnapshot(await currentState(user));
    const sponsorAfter = balancesSnapshot(await currentState(sponsor));
    await stopAll(user, sponsor);

    if (observedError) {
      return {
        verdict: 'PASS' as const,
        errorCode: classifyError(observedError),
        note: `Failure observed at stage '${stage}': ${String(observedError?.message ?? observedError).slice(0, 120)}`,
        details: {
          fundingTx,
          userSeed: user.seed,
          failedAtStage: stage,
          error: serialiseError(observedError),
          userBefore,
          userAfter,
          sponsorAfter,
          tutorialWarningConfirmed: true,
        },
      };
    }

    return {
      verdict: 'PARTIAL' as const,
      txHash: txId ? String(txId) : undefined,
      note: "Sponsor 'all' re-balance was accepted by the node — the tutorial's double-spend warning did not reproduce.",
      details: {
        fundingTx,
        userSeed: user.seed,
        userBefore,
        userAfter,
        sponsorAfter,
        tutorialWarningConfirmed: false,
      },
    };
  },
});
