// Post-hoc balance check: sync a wallet from a seed recorded in evidence and
// print its settled balances. Used to characterise F3 (whether the user's
// change output survived the sponsor's 'all' re-balance).
//
// Usage: CHECK_SEED=<hex> tsx src/check-balance.ts

import { createWallet } from './utils.js';
import { syncWallet, currentState, balancesSnapshot } from './common.js';

const seed = process.env.CHECK_SEED;
if (!seed) throw new Error('CHECK_SEED env var required');

const ctx = await createWallet(seed);
await syncWallet(ctx, 'check');
console.log(JSON.stringify(balancesSnapshot(await currentState(ctx)), null, 1));
await ctx.wallet.stop();
setTimeout(() => process.exit(0), 100).unref();
