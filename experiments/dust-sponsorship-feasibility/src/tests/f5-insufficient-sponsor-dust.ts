// F5 — Sponsor with insufficient DUST (negative).
//
// The sponsoring wallet has no DUST capacity at all (a fresh wallet — the
// degenerate case of "below the fee required"). Pass criterion: the broke
// sponsor's balanceFinalizedTransaction call fails locally, before
// submission, with a clear error. Confirms the failure mode is detectable
// client-side, not silent or post-submission.
//
// The genesis wallet still plays a role here — it funds the user (setup),
// but the *sponsor under test* is the broke wallet.

import {
  setupSponsor,
  setupFreshWallet,
  fundUserWithNight,
  runTest,
  stopAll,
  classifyError,
  serialiseError,
} from '../test-helpers.js';
import { currentState, balancesSnapshot, dustBalanceOf, NIGHT_RAW } from '../common.js';
import { userTransferWithoutFees, sponsorBalanceDust, DEFAULT_TTL_MS } from '../sponsorship.js';
import { unshieldedAddressOf } from '../utils.js';

const FUND_AMOUNT = BigInt(process.env.F5_FUND_AMOUNT ?? '1000000');
const TRANSFER_AMOUNT = BigInt(process.env.F5_TRANSFER_AMOUNT ?? '100000');

await runTest({
  testId: 'F5',
  name: 'insufficient-sponsor-dust',
  description: 'sponsor with zero DUST capacity fails client-side (negative)',
  action: async () => {
    const funder = await setupSponsor();
    const user = await setupFreshWallet('user', 'USER_SEED');
    const brokeSponsor = await setupFreshWallet('broke-sponsor', 'BROKE_SPONSOR_SEED');

    const brokeState = await currentState(brokeSponsor);
    const brokeDust = dustBalanceOf(brokeState);
    const brokeBefore = balancesSnapshot(brokeState);

    const fundingTx = await fundUserWithNight(funder, user, FUND_AMOUNT);

    const ttl = new Date(Date.now() + DEFAULT_TTL_MS);
    const userFinalized = await userTransferWithoutFees(
      user,
      [
        {
          type: 'unshielded',
          outputs: [
            {
              type: NIGHT_RAW,
              receiverAddress: unshieldedAddressOf(funder),
              amount: TRANSFER_AMOUNT,
            },
          ],
        },
      ],
      ttl,
    );

    let stage = 'sponsor-balance';
    let observedError: any;
    let txId: unknown;
    try {
      const fullyBalanced = await sponsorBalanceDust(brokeSponsor, userFinalized, ttl);
      stage = 'submit';
      txId = await brokeSponsor.wallet.submitTransaction(fullyBalanced);
      stage = 'accepted';
    } catch (e: any) {
      observedError = e;
    }

    await stopAll(user, funder, brokeSponsor);

    if (observedError && stage === 'sponsor-balance') {
      return {
        verdict: 'PASS' as const,
        errorCode: classifyError(observedError),
        note: `Broke sponsor failed locally at balanceFinalizedTransaction: ${String(observedError?.message ?? observedError).slice(0, 110)}`,
        details: {
          fundingTx,
          userSeed: user.seed,
          brokeSponsorSeed: brokeSponsor.seed,
          brokeSponsorDust: brokeDust?.toString() ?? '(unreadable)',
          brokeBefore,
          failedAtStage: stage,
          error: serialiseError(observedError),
        },
      };
    }

    if (observedError) {
      return {
        verdict: 'PARTIAL' as const,
        errorCode: classifyError(observedError),
        note: `Failure surfaced at stage '${stage}', not client-side at balancing — detectability weaker than hoped.`,
        details: {
          fundingTx,
          userSeed: user.seed,
          brokeSponsorSeed: brokeSponsor.seed,
          failedAtStage: stage,
          error: serialiseError(observedError),
        },
      };
    }

    return {
      verdict: 'FAIL' as const,
      txHash: txId ? String(txId) : undefined,
      errorCode: 'no-error-observed',
      note: 'A sponsor with zero DUST capacity produced an accepted transaction — investigate (who paid the fee?).',
      details: {
        fundingTx,
        userSeed: user.seed,
        brokeSponsorSeed: brokeSponsor.seed,
        brokeSponsorDust: brokeDust?.toString() ?? '(unreadable)',
      },
    };
  },
});
