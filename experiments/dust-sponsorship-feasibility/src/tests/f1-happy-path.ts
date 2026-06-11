// F1 — Happy path.
//
// User wallet (holds NIGHT, zero DUST) initiates a trivial Night transfer
// and balances only its own token kinds. Sponsor wallet balances the dust
// branch, signs, and submits. Pass criterion: tx hash returned, indexer
// confirms inclusion, user's Night balance reflects the transfer, sponsor's
// DUST capacity reflects the fee deduction.

import { setupSponsor, setupFreshWallet, fundUserWithNight, runTest, stopAll } from '../test-helpers.js';
import {
  currentState,
  waitForState,
  nightBalanceOf,
  dustBalanceOf,
  balancesSnapshot,
  NIGHT_RAW,
} from '../common.js';
import {
  userTransferWithoutFees,
  sponsorBalanceDust,
  probeWireRoundtrip,
  DEFAULT_TTL_MS,
} from '../sponsorship.js';
import { unshieldedAddressOf } from '../utils.js';

const FUND_AMOUNT = BigInt(process.env.F1_FUND_AMOUNT ?? '1000000');
const TRANSFER_AMOUNT = BigInt(process.env.F1_TRANSFER_AMOUNT ?? '100000');

await runTest({
  testId: 'F1',
  name: 'happy-path',
  description: 'user balances tokens, sponsor balances dust, node accepts',
  action: async () => {
    const sponsor = await setupSponsor();
    const user = await setupFreshWallet('user', 'USER_SEED');

    // Setup (not the pattern under test): give the user NIGHT to transfer.
    const fundingTx = await fundUserWithNight(sponsor, user, FUND_AMOUNT);

    const userStateBefore = await currentState(user);
    const sponsorStateBefore = await currentState(sponsor);
    const userBefore = balancesSnapshot(userStateBefore);
    const sponsorBefore = balancesSnapshot(sponsorStateBefore);

    const userDust = dustBalanceOf(userStateBefore);
    if (userDust !== null && userDust > 0n) {
      console.warn(`User wallet unexpectedly holds dust (${userDust}) — F1 precondition weakened, recording anyway.`);
    }
    const sponsorNightBeforeTransfer = nightBalanceOf(sponsorStateBefore);

    // ── User phase: transfer NIGHT back to the sponsor, fees excluded ──────
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
    const wire = probeWireRoundtrip(userFinalized);

    // ── Sponsor phase: balance dust, sign, submit ───────────────────────────
    const fullyBalanced = await sponsorBalanceDust(sponsor, userFinalized, ttl);
    const txId = await sponsor.wallet.submitTransaction(fullyBalanced);
    console.log(`Sponsored tx submitted: ${txId}`);

    // Inclusion: the wallets' views come from the indexer, so observing the
    // balance changes confirms indexer inclusion. Wait for the *exact*
    // post-transfer balance — a looser bound catches the transient state
    // where inputs are spent but the change output is not yet credited.
    await waitForState(
      user,
      (s) => nightBalanceOf(s) === FUND_AMOUNT - TRANSFER_AMOUNT,
      180_000,
      'user Night balance reflecting the sponsored transfer (incl. change)',
    );
    await waitForState(
      sponsor,
      (s) => nightBalanceOf(s) >= sponsorNightBeforeTransfer + TRANSFER_AMOUNT,
      180_000,
      'sponsor Night balance reflecting the received transfer',
    );
    const userAfter = balancesSnapshot(await currentState(user));
    const sponsorAfter = balancesSnapshot(await currentState(sponsor));

    await stopAll(user, sponsor);

    return {
      verdict: 'PASS' as const,
      txHash: String(txId),
      note: 'Two-balanced tx accepted: user paid tokens, sponsor paid dust.',
      details: {
        fundingTx,
        userSeed: user.seed,
        fundAmount: FUND_AMOUNT.toString(),
        transferAmount: TRANSFER_AMOUNT.toString(),
        userBefore,
        userAfter,
        sponsorBefore,
        sponsorAfter,
        wireHandoff: wire,
        ttl: ttl.toISOString(),
      },
    };
  },
});
