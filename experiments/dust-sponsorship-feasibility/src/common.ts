// Shared helpers — wallet sync, balance reading, evidence serialisation.
//
// Adapted from experiments/contract-custody-feasibility/src/common.ts. The
// interactive mnemonic entry is dropped: every wallet in this experiment is
// driven from an env seed or a freshly generated random seed, never a prompt.

import * as rx from 'rxjs';
import { Buffer } from 'node:buffer';
import { randomBytes } from 'node:crypto';
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import { ZswapChainState, nativeToken } from '@midnight-ntwrk/ledger-v8';

import type { createWallet } from './utils.js';

// Workaround for ledger-v8 bug: MerkleTree::collapse panics on non-empty
// trees when producing shielded outputs. Inherited from contract-custody-
// feasibility — drop on the day this issue is verified fixed and leave a
// comment in FINDINGS.md if so.
const _origTryApply = ZswapChainState.prototype.tryApply;
ZswapChainState.prototype.tryApply = function (...args: unknown[]) {
  try {
    return _origTryApply.apply(this, args as any);
  } catch {
    return [this, new Map()];
  }
};

export const NIGHT_RAW = nativeToken().raw;

export function hexToBytes32(hex: string): Uint8Array {
  const cleanHex = hex.replace(/^0x/, '');
  const buffer = Buffer.from(cleanHex, 'hex');
  const bytes = new Uint8Array(32);
  bytes.set(buffer.subarray(0, Math.min(32, buffer.length)));
  return bytes;
}

export function randomSeed(): string {
  return randomBytes(32).toString('hex');
}

export async function syncWallet(
  walletCtx: Awaited<ReturnType<typeof createWallet>>,
  label: string,
): Promise<void> {
  process.stdout.write(`Syncing ${label} to network`);
  await rx.firstValueFrom(
    walletCtx.wallet.state().pipe(
      rx.throttleTime(5_000),
      rx.tap(() => process.stdout.write(' .')),
      rx.filter((state) => state.isSynced === true),
    ),
  );
  console.log('\nWallet Synced!');
}

export async function currentState(
  walletCtx: Awaited<ReturnType<typeof createWallet>>,
): Promise<any> {
  return rx.firstValueFrom(walletCtx.wallet.state());
}

// Wait until the wallet state satisfies a predicate, or time out.
export async function waitForState(
  walletCtx: Awaited<ReturnType<typeof createWallet>>,
  predicate: (state: any) => boolean,
  timeoutMs = 120_000,
  label = 'condition',
): Promise<any> {
  return rx.firstValueFrom(
    walletCtx.wallet.state().pipe(
      rx.filter(predicate),
      rx.timeout({ first: timeoutMs, with: () => rx.throwError(() => new Error(`Timed out after ${timeoutMs}ms waiting for ${label}`)) }),
    ),
  );
}

export function nightBalanceOf(state: any): bigint {
  const balances = state?.unshielded?.balances as Record<string, bigint> | undefined;
  if (!balances) return 0n;
  return BigInt(balances[NIGHT_RAW] ?? 0n);
}

// The Dust wallet exposes its balance behind a couple of API shapes,
// depending on SDK minor. Probe them in order; null means unreadable, which
// is itself worth recording in evidence.
export function dustBalanceOf(state: any): bigint | null {
  try {
    const dustState = state?.dust;
    const viaCapabilities =
      dustState?.capabilities?.coinsAndBalances?.getWalletBalance?.(dustState.state, new Date());
    if (viaCapabilities !== undefined) return BigInt(viaCapabilities);
    const viaMethod = dustState?.walletBalance?.(new Date());
    if (viaMethod !== undefined) return BigInt(viaMethod);
    return null;
  } catch {
    return null;
  }
}

export function balancesSnapshot(state: any): Record<string, string> {
  return {
    night: nightBalanceOf(state).toString(),
    dust: dustBalanceOf(state)?.toString() ?? '(unreadable)',
  };
}

// ─── Evidence file writer ────────────────────────────────────────────────────
//
// Every test case writes one JSON file under evidence/. The shape is fixed so
// FINDINGS.md can be regenerated mechanically.

export type Verdict = 'PASS' | 'FAIL' | 'PARTIAL' | 'PENDING';

export interface Evidence {
  test: string;            // brief test ID, e.g. 'F1'
  name: string;            // descriptive name, e.g. 'happy-path'
  verdict: Verdict;
  txHash?: string;         // present when verdict === 'PASS'
  errorCode?: string;      // present when verdict === 'FAIL' (e.g. 'ledger-168')
  note: string;            // one-line summary
  evidence: Record<string, unknown>;  // full request/response/log payload
  ranAt: string;           // ISO timestamp
  sdkVersions: Record<string, string>;
  nodeVersion: string;
}

export function writeEvidence(testId: string, payload: Omit<Evidence, 'ranAt' | 'sdkVersions' | 'nodeVersion'>): string {
  const evidenceDir = resolve(dirname(new URL(import.meta.url).pathname), '..', 'evidence');
  mkdirSync(evidenceDir, { recursive: true });
  const filePath = resolve(evidenceDir, `${testId.toLowerCase()}-${payload.name}.json`);
  const sdkVersions = readSdkVersions();
  const full: Evidence = {
    ...payload,
    ranAt: new Date().toISOString(),
    sdkVersions,
    nodeVersion: process.env.MIDNIGHT_NODE_IMAGE ?? 'midnightntwrk/midnight-node:1.0.0',
  };
  writeFileSync(filePath, JSON.stringify(full, (_k, v) => (typeof v === 'bigint' ? v.toString() : v), 2) + '\n');
  return filePath;
}

function readSdkVersions(): Record<string, string> {
  const pkgPath = resolve(dirname(new URL(import.meta.url).pathname), '..', 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
  const out: Record<string, string> = {};
  for (const [name, version] of Object.entries(pkg.dependencies as Record<string, string>)) {
    if (name.startsWith('@midnight-ntwrk/')) out[name] = version;
  }
  return out;
}
