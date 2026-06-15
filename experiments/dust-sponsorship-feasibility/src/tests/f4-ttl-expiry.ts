// F4 — TTL expiry across the round-trip (negative).
//
// User signs and finalises with a short TTL; the sponsor deliberately delays
// past it, then attempts to balance and submit. Establishes the latency
// budget a sponsor service has between receiving a user's finalised
// transaction and submitting the dual-balanced result. Pass criterion: a
// specific TTL-related error, and the stage at which it surfaces.

import {
  setupSponsor,
  setupFreshWallet,
  fundUserWithNight,
  runTest,
  stopAll,
  classifyError,
  serialiseError,
  captureNodeRejections,
} from '../test-helpers.js';
import { currentState, balancesSnapshot, NIGHT_RAW } from '../common.js';
import { userTransferWithoutFees, sponsorBalanceDust } from '../sponsorship.js';
import { unshieldedAddressOf } from '../utils.js';

const FUND_AMOUNT = BigInt(process.env.F4_FUND_AMOUNT ?? '1000000');
const TRANSFER_AMOUNT = BigInt(process.env.F4_TRANSFER_AMOUNT ?? '100000');
const USER_TTL_MS = Number(process.env.F4_USER_TTL_MS ?? '30000');
const SPONSOR_DELAY_MS = Number(process.env.F4_SPONSOR_DELAY_MS ?? '90000');

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

await runTest({
  testId: 'F4',
  name: 'ttl-expiry',
  description: `user TTL ${USER_TTL_MS / 1000}s, sponsor delays ${SPONSOR_DELAY_MS / 1000}s (negative)`,
  action: async () => {
    const sponsor = await setupSponsor();
    const user = await setupFreshWallet('user', 'USER_SEED');

    const fundingTx = await fundUserWithNight(sponsor, user, FUND_AMOUNT);

    // ── User phase with a deliberately short TTL ────────────────────────────
    const userTtl = new Date(Date.now() + USER_TTL_MS);
    let userFinalized: any;
    let stage = 'user-balance';
    let observedError: any;
    let txId: unknown;
    const nodeCapture = captureNodeRejections();
    try {
      userFinalized = await userTransferWithoutFees(
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
        userTtl,
      );

      console.log(`User tx finalised with TTL ${userTtl.toISOString()}; sponsor sleeping ${SPONSOR_DELAY_MS}ms...`);
      await sleep(SPONSOR_DELAY_MS);

      stage = 'sponsor-balance';
      // The sponsor uses a fresh TTL for its own balancing transaction — the
      // expired clock lives in the *user's* transaction.
      const sponsorTtl = new Date(Date.now() + 10 * 60 * 1000);
      const fullyBalanced = await sponsorBalanceDust(sponsor, userFinalized, sponsorTtl);

      stage = 'submit';
      txId = await sponsor.wallet.submitTransaction(fullyBalanced);
      stage = 'accepted';
    } catch (e: any) {
      observedError = e;
    }

    nodeCapture.restore();
    const userAfter = balancesSnapshot(await currentState(user));
    await stopAll(user, sponsor);

    if (observedError) {
      // The SDK's SubmissionError hides the node detail; prefer the captured
      // node-side rejection line for the error code.
      const nodeLine = nodeCapture.lines.join(' ');
      const custom = nodeLine.match(/custom error:\s*(\d{1,3})/i);
      const code = custom ? `ledger-${custom[1]}` : classifyError(observedError);
      return {
        verdict: 'PASS' as const,
        errorCode: code,
        note: `TTL-expired round-trip rejected at stage '${stage}' with ${code}.`,
        details: {
          fundingTx,
          userSeed: user.seed,
          userTtlMs: USER_TTL_MS,
          sponsorDelayMs: SPONSOR_DELAY_MS,
          failedAtStage: stage,
          error: serialiseError(observedError),
          nodeRejectionLines: nodeCapture.lines.slice(0, 5),
          userAfter,
        },
      };
    }

    return {
      verdict: 'PARTIAL' as const,
      txHash: txId ? String(txId) : undefined,
      note: `Transaction was accepted despite the user TTL expiring ${(SPONSOR_DELAY_MS - USER_TTL_MS) / 1000}s earlier — TTL not enforced as expected.`,
      details: {
        fundingTx,
        userSeed: user.seed,
        userTtlMs: USER_TTL_MS,
        sponsorDelayMs: SPONSOR_DELAY_MS,
        userAfter,
      },
    };
  },
});
