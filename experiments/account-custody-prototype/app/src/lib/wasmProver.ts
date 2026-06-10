// Browser-side proving (Phase 0 spike, see ../../BROWSER-PROVING-SCOPE.md).
//
// The upstream zkir-v2 wasm prover plugged into the midnight-js ProofProvider
// seam: `Transaction.prove(provingProvider, costModel)` with a provider that
// computes the PLONK proof in this browser instead of POSTing the preimage to
// the proof server. Key material resolves through the SAME FetchZkConfigProvider
// the HTTP path uses (binary .bzkir + prover/verifier keys from /zk); SRS
// slices are served from /zk-params — byte-identical to the files the proof
// server itself downloads and verifies from the public bucket.
//
// Selected with `?prover=browser` (see providers.ts). The wallet's balancing
// proofs (zswap and dust) are covered too: WalletFacade.init accepts a
// custom provingService, and the system-circuit key material lives in
// /zk-params alongside the SRS (same files the proof server downloads).

import * as zkir from '@midnight-ntwrk/zkir-v2';
import { CostModel } from '@midnight-ntwrk/ledger-v8';
import { zkConfigToProvingKeyMaterial } from '@midnight-ntwrk/midnight-js-types';

import { proveStarted, proveEnded } from './txTracker.js';

interface ZkConfigProviderLike {
  get(keyLocation: string): Promise<unknown>;
}

async function fetchBytes(path: string, what: string): Promise<Uint8Array> {
  const resp = await fetch(path);
  if (!resp.ok) {
    throw new Error(
      `missing ${what} (${path}) — run scripts/fetch-zk-params.mjs to stage app/public/zk-params`,
    );
  }
  return new Uint8Array(await resp.arrayBuffer());
}

const getParams = async (k: number) => {
  console.debug(`[wasm-prover] getParams: k=${k}`);
  return fetchBytes(`/zk-params/bls_midnight_2p${k}`, `SRS slice for k=${k}`);
};

// System (balancing) circuits, mirroring the proof server's key layout.
const SYSTEM_KEYS: Record<string, string> = {
  'midnight/zswap/spend': 'zswap/9/spend',
  'midnight/zswap/output': 'zswap/9/output',
  'midnight/zswap/sign': 'zswap/9/sign',
  'midnight/dust/spend': 'dust/9/spend',
};

async function lookupSystemKey(keyLocation: string) {
  const path = SYSTEM_KEYS[keyLocation];
  if (!path) return undefined;
  const [proverKey, verifierKey, ir] = await Promise.all([
    fetchBytes(`/zk-params/${path}.prover`, `${keyLocation} prover key`),
    fetchBytes(`/zk-params/${path}.verifier`, `${keyLocation} verifier key`),
    fetchBytes(`/zk-params/${path}.bzkir`, `${keyLocation} IR`),
  ]);
  return { proverKey, verifierKey, ir };
}

export function wasmProofProvider(zkConfigProvider: ZkConfigProviderLike): any {
  const kmProvider = {
    lookupKey: async (keyLocation: string) => {
      console.debug(`[wasm-prover] lookupKey: ${keyLocation}`);
      const system = await lookupSystemKey(keyLocation);
      if (system) return system;
      const zkConfig = await zkConfigProvider.get(keyLocation);
      return zkConfigToProvingKeyMaterial(zkConfig as any);
    },
    getParams,
  };

  const provingProvider = zkir.provingProvider(kmProvider);

  return {
    async proveTx(unprovenTx: any) {
      proveStarted();
      try {
        return await unprovenTx.prove(provingProvider, CostModel.initialCostModel());
      } finally {
        proveEnded();
      }
    },
  };
}

/**
 * Wallet-side proving service (balancing: zswap spends/outputs/signs and
 * dust fee spends). Same shape the wallet SDK's makeWasmProvingService
 * builds; injected through WalletFacade.init({ provingService }).
 */
export function wasmWalletProvingService(): { prove(tx: any): Promise<any> } {
  const kmProvider = {
    lookupKey: async (keyLocation: string) => {
      console.debug(`[wasm-prover/wallet] lookupKey: ${keyLocation}`);
      return lookupSystemKey(keyLocation);
    },
    getParams,
  };
  const provingProvider = zkir.provingProvider(kmProvider);
  return {
    prove: (tx: any) => tx.prove(provingProvider, CostModel.initialCostModel()),
  };
}
