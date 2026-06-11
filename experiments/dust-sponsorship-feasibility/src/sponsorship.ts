// The two-party wallet-level DUST sponsorship flow under test.
//
// User phase:    balance every token kind EXCEPT dust, sign, finalize.
// Sponsor phase: balanceFinalizedTransaction(..., ['dust']), sign, finalize,
//                submit.
//
// Per the brief (EXPERIMENT_GUIDELINE.md § Pattern summary), the result is a
// single fully-balanced transaction with both parties' contributions baked
// in. No contract-paymaster fee branch is involved.

import * as Rx from 'rxjs';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';

import { CONFIG, zkConfigPath, PRIVATE_STATE_ID, type WalletCtx } from './utils.js';

export const DEFAULT_TTL_MS = 10 * 60 * 1000;

export type TokenKinds = 'all' | ('dust' | 'shielded' | 'unshielded')[];

export function signerFor(ctx: WalletCtx) {
  return (data: Uint8Array) => ctx.unshieldedKeystore.signData(data);
}

// Sign a balancing recipe with the given wallet's unshielded keystore and
// finalize it (proving happens inside finalizeRecipe, via the facade's
// proving service).
export async function finalizeRecipeAs(ctx: WalletCtx, recipe: any) {
  const signed = await ctx.wallet.signRecipe(recipe, signerFor(ctx));
  return ctx.wallet.finalizeRecipe(signed);
}

// ── User phase ──────────────────────────────────────────────────────────────

// For unbound transactions (contract calls and deployments coming out of
// midnight-js): the user balances shielded + unshielded only, leaving the
// dust branch open for the sponsor.
export async function userBalanceUnbound(userCtx: WalletCtx, tx: any, ttl: Date) {
  const recipe = await userCtx.wallet.balanceUnboundTransaction(
    tx,
    {
      shieldedSecretKeys: userCtx.shieldedSecretKeys,
      dustSecretKey: userCtx.dustSecretKey,
    },
    { ttl, tokenKindsToBalance: ['shielded', 'unshielded'] },
  );
  return finalizeRecipeAs(userCtx, recipe);
}

// For plain transfers: transferTransaction with payFees: false builds the
// user's intent (their own coins in, recipient out) without a dust action.
export async function userTransferWithoutFees(
  userCtx: WalletCtx,
  outputs: any[],
  ttl: Date,
) {
  const recipe = await userCtx.wallet.transferTransaction(
    outputs,
    {
      shieldedSecretKeys: userCtx.shieldedSecretKeys,
      dustSecretKey: userCtx.dustSecretKey,
    },
    { ttl, payFees: false },
  );
  return finalizeRecipeAs(userCtx, recipe);
}

// ── Sponsor phase ───────────────────────────────────────────────────────────

export async function sponsorBalanceDust(
  sponsorCtx: WalletCtx,
  finalizedTx: any,
  ttl: Date,
  tokenKindsToBalance: TokenKinds = ['dust'],
) {
  const recipe = await sponsorCtx.wallet.balanceFinalizedTransaction(
    finalizedTx,
    {
      shieldedSecretKeys: sponsorCtx.shieldedSecretKeys,
      dustSecretKey: sponsorCtx.dustSecretKey,
    },
    { ttl, tokenKindsToBalance },
  );
  return finalizeRecipeAs(sponsorCtx, recipe);
}

// ── Wire-handoff probe ──────────────────────────────────────────────────────
//
// In a real sponsor service the user→sponsor handoff crosses a network
// boundary. Probe whether the finalized transaction serialises and
// deserialises; record the outcome in evidence but never fail a test on it —
// node acceptance is the question, wire format is a bonus observation.

export function probeWireRoundtrip(finalizedTx: any): Record<string, unknown> {
  try {
    if (typeof finalizedTx?.serialize !== 'function') {
      return { serializable: false, reason: 'no serialize() on FinalizedTransaction' };
    }
    const bytes = finalizedTx.serialize();
    const ctor: any = finalizedTx.constructor;
    if (typeof ctor?.deserialize === 'function') {
      try {
        // Common signatures: (raw) or (marker..., raw). Try plain first.
        ctor.deserialize(bytes);
        return { serializable: true, bytes: bytes.length, roundtrip: true };
      } catch (e: any) {
        return { serializable: true, bytes: bytes.length, roundtrip: false, deserializeError: e?.message };
      }
    }
    return { serializable: true, bytes: bytes.length, roundtrip: 'no static deserialize' };
  } catch (e: any) {
    return { serializable: false, error: e?.message ?? String(e) };
  }
}

// ── Sponsored providers for midnight-js ─────────────────────────────────────
//
// Drop-in providers where fee balancing is split across the two wallets:
// every transaction midnight-js asks to balance goes through the user phase
// (shielded + unshielded, user signs) and then the sponsor phase (dust,
// sponsor signs); submission goes through the sponsor's wallet. This IS the
// sponsor service in miniature — F2 and F6 exercise it for a circuit call
// and a deployment respectively.

export async function createSponsoredProviders(userCtx: WalletCtx, sponsorCtx: WalletCtx) {
  const userState = await Rx.firstValueFrom(
    userCtx.wallet.state().pipe(Rx.filter((s) => s.isSynced)),
  );

  const handoffLog: Record<string, unknown>[] = [];

  const walletProvider = {
    getCoinPublicKey: () => userState.shielded.coinPublicKey.toHexString(),
    getEncryptionPublicKey: () => userState.shielded.encryptionPublicKey.toHexString(),
    async balanceTx(tx: any, ttl?: Date) {
      const effectiveTtl = ttl ?? new Date(Date.now() + DEFAULT_TTL_MS);
      const userFinalized = await userBalanceUnbound(userCtx, tx, effectiveTtl);
      handoffLog.push(probeWireRoundtrip(userFinalized));
      return sponsorBalanceDust(sponsorCtx, userFinalized, effectiveTtl);
    },
    submitTx: (tx: any) => sponsorCtx.wallet.submitTransaction(tx) as any,
  };

  const zkConfigProvider = new NodeZkConfigProvider(zkConfigPath);

  return {
    providers: {
      privateStateProvider: levelPrivateStateProvider({
        midnightDbName: `midnight-level-db`,
        privateStateStoreName: PRIVATE_STATE_ID,
        privateStoragePasswordProvider: () => 'DustSponsorship!exp',
        accountId: userState.shielded.encryptionPublicKey.toHexString().slice(0, 16),
        walletProvider,
      }),
      publicDataProvider: indexerPublicDataProvider(CONFIG.indexer, CONFIG.indexerWS),
      zkConfigProvider,
      proofProvider: httpClientProofProvider(CONFIG.proofServer, zkConfigProvider),
      walletProvider,
      midnightProvider: walletProvider,
    },
    handoffLog,
  };
}
