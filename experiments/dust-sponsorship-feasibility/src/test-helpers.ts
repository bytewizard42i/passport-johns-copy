// Shared helpers for individual test runners under src/tests/.
//
// Each test under src/tests/ should:
//   1. set up its wallets (sponsor from WALLET_SEED, user from a fresh seed)
//   2. await the test action (the two-phase sponsorship flow)
//   3. write evidence via writeEvidence() with verdict + tx hash or error code
//
// The intent is that adding a test is no more than one small file.

import * as fs from 'node:fs';
import * as path from 'node:path';

import { deployContract, findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { CompiledContract } from '@midnight-ntwrk/compact-js';

import { createWallet, CounterContract, zkConfigPath, PRIVATE_STATE_ID, unshieldedAddressOf, type WalletCtx } from './utils.js';
import {
  syncWallet,
  currentState,
  waitForState,
  nightBalanceOf,
  randomSeed,
  writeEvidence,
  NIGHT_RAW,
  type Verdict,
} from './common.js';
import { finalizeRecipeAs, DEFAULT_TTL_MS } from './sponsorship.js';

export const COMPILED_COUNTER = () =>
  CompiledContract.make('counter', CounterContract.Contract).pipe(
    CompiledContract.withVacantWitnesses,
    CompiledContract.withCompiledFileAssets(zkConfigPath),
  );

export const DEPLOYMENT_FILE = 'deployment.json';

// ── Wallet setup ────────────────────────────────────────────────────────────

export async function setupSponsor(): Promise<WalletCtx> {
  const seed = process.env.WALLET_SEED;
  if (!seed) throw new Error('WALLET_SEED env var required (sponsor wallet)');
  const ctx = await createWallet(seed);
  await syncWallet(ctx, 'sponsor');
  return ctx;
}

export async function setupFreshWallet(label: string, envOverride?: string): Promise<WalletCtx> {
  const seed = (envOverride && process.env[envOverride]) || randomSeed();
  const ctx = await createWallet(seed);
  await syncWallet(ctx, label);
  return ctx;
}

// Fund a user wallet with Night from the sponsor (sponsor pays its own fees —
// this is setup, not the pattern under test). Waits until the user wallet
// sees the funds.
export async function fundUserWithNight(
  sponsorCtx: WalletCtx,
  userCtx: WalletCtx,
  amount: bigint,
): Promise<string> {
  const sponsorNightBefore = nightBalanceOf(await currentState(sponsorCtx));
  const ttl = new Date(Date.now() + DEFAULT_TTL_MS);
  const recipe = await sponsorCtx.wallet.transferTransaction(
    [
      {
        type: 'unshielded',
        outputs: [
          {
            type: NIGHT_RAW,
            receiverAddress: unshieldedAddressOf(userCtx),
            amount,
          },
        ],
      },
    ] as any,
    {
      shieldedSecretKeys: sponsorCtx.shieldedSecretKeys,
      dustSecretKey: sponsorCtx.dustSecretKey,
    },
    { ttl },
  );
  const finalized = await finalizeRecipeAs(sponsorCtx, recipe);
  const txId = await sponsorCtx.wallet.submitTransaction(finalized);
  console.log(`Funding tx submitted: ${txId}`);
  await waitForState(
    userCtx,
    (s) => nightBalanceOf(s) >= amount,
    180_000,
    `user Night balance >= ${amount}`,
  );
  // The sponsor wallet must also see the funding tx applied before it
  // balances anything else: its dust wallet spent a coin in this tx, and a
  // sponsored balancing built against the stale state re-spends the same
  // dust nullifier (observed on-node as DustDoubleSpend).
  await waitForState(
    sponsorCtx,
    (s) => nightBalanceOf(s) <= sponsorNightBefore - amount,
    180_000,
    'sponsor state to reflect the funding spend',
  );
  await settle();
  return String(txId);
}

// The dust wallet's view updates on the same indexer stream as the
// unshielded one, but its state transition is not observable via balances
// alone — give it a moment after the balance waits.
export const settle = (ms = Number(process.env.SETTLE_MS ?? '8000')) =>
  new Promise((r) => setTimeout(r, ms));

// ── Counter contract ────────────────────────────────────────────────────────

export function requireCompiled(): void {
  if (!fs.existsSync(path.join(zkConfigPath, 'contract', 'index.js'))) {
    throw new Error('Contract not compiled. Run: npm run compile');
  }
}

// Deploy the counter (or reuse an existing deployment) with the given
// providers. Used by deploy.ts with the sponsor's own providers, and by F6
// with the sponsored providers (reuse=false, the deployment is the test).
export async function setupCounter(
  providers: any,
  opts: { reuseDeployment?: boolean } = {},
): Promise<{ address: string; found: any }> {
  requireCompiled();
  const reuse = opts.reuseDeployment ?? true;
  const compiled = COMPILED_COUNTER();

  if (reuse && fs.existsSync(DEPLOYMENT_FILE)) {
    const address = JSON.parse(fs.readFileSync(DEPLOYMENT_FILE, 'utf-8')).contractAddress;
    console.log(`Connecting to counter contract @ ${address}`);
    const found = await (findDeployedContract as any)(providers, {
      contractAddress: address,
      compiledContract: compiled,
      privateStateId: PRIVATE_STATE_ID,
      initialPrivateState: {},
    });
    return { address, found };
  }

  console.log('Deploying counter contract...');
  const deployed = await deployContract(providers, {
    compiledContract: compiled,
    privateStateId: PRIVATE_STATE_ID,
    initialPrivateState: {},
  });
  const address = deployed.deployTxData.public.contractAddress;
  fs.writeFileSync(
    DEPLOYMENT_FILE,
    JSON.stringify({ contractAddress: address, deployedAt: new Date().toISOString() }, null, 2),
  );
  console.log(`Deployed counter @ ${address}`);
  return { address, found: deployed };
}

// ── Test runner ─────────────────────────────────────────────────────────────

export async function runTest(opts: {
  testId: string;       // 'F1', 'F6', etc.
  name: string;         // descriptive: 'happy-path'
  description: string;
  action: () => Promise<{ verdict: Verdict; txHash?: string; errorCode?: string; note: string; details: Record<string, unknown> }>;
}): Promise<void> {
  const banner = `\n━━━ ${opts.testId}: ${opts.description} ━━━`;
  console.log(banner);
  let result: Awaited<ReturnType<typeof opts.action>>;
  try {
    result = await opts.action();
  } catch (e: any) {
    result = {
      verdict: 'FAIL',
      errorCode: classifyError(e),
      note: `Threw: ${e?.message ?? String(e)}`,
      details: { error: serialiseError(e) },
    };
  }
  const file = writeEvidence(opts.testId, {
    test: opts.testId,
    name: opts.name,
    verdict: result.verdict,
    txHash: result.txHash,
    errorCode: result.errorCode,
    note: result.note,
    evidence: result.details,
  });
  console.log(`◆ ${opts.testId} verdict: ${result.verdict}`);
  if (result.txHash) console.log(`  tx:    ${result.txHash}`);
  if (result.errorCode) console.log(`  error: ${result.errorCode}`);
  console.log(`  note:  ${result.note}`);
  console.log(`  evidence: ${path.relative(process.cwd(), file)}`);

  // Force exit. Wallet/indexer subscriptions keep the event loop alive
  // even after wallet.stop(); on the failure path stop() is never reached
  // and the process hangs entirely. The bash orchestrator captures the exit
  // code with `|| true`, so exiting non-zero on FAIL is harmless and
  // surfaces failures clearly.
  setTimeout(() => process.exit(result.verdict === 'FAIL' ? 1 : 0), 100).unref();
}

// Classify a thrown error into a stable code that FINDINGS.md can group on.
export function classifyError(e: any): string {
  // Search messages and own properties through the cause chain — but never
  // stacks: stack frames carry file paths, and this experiment's directory
  // name contains the word "dust".
  const parts: string[] = [];
  const walk = (x: any, depth = 0) => {
    if (!x || depth > 4) return;
    if (typeof x === 'string') {
      parts.push(x);
      return;
    }
    if (typeof x?.message === 'string') parts.push(x.message);
    try {
      for (const k of Object.keys(x)) {
        if (k === 'stack') continue;
        const v = (x as any)[k];
        if (typeof v === 'string') parts.push(v);
        else if (typeof v === 'object') walk(v, depth + 1);
      }
    } catch {
      // best-effort
    }
    if ((x as any).cause) walk((x as any).cause, depth + 1);
  };
  walk(e);
  const msg = parts.join(' ').toLowerCase();
  const customMatch = msg.match(/custom error[\s:]+(\d{1,3})/);
  if (customMatch) return `ledger-${customMatch[1]}`;
  const ledgerMatch = msg.match(/ledger[\s-_:]?(?:error)?[\s-_:]?(\d{3})/);
  if (ledgerMatch) return `ledger-${ledgerMatch[1]}`;
  const errorCodeMatch = msg.match(/error\s+code[\s:]+(\w+)/i);
  if (errorCodeMatch) return `node-${errorCodeMatch[1]}`;
  if (msg.includes('ttl') || msg.includes('expired')) return 'ttl-error';
  if (msg.includes('insufficient') && msg.includes('dust')) return 'insufficient-dust';
  if (msg.includes('dust')) return 'dust-error';
  if (msg.includes('double') && msg.includes('spend')) return 'double-spend';
  if (msg.includes('compile') || msg.includes('compact')) return 'compile-error';
  return 'js-error';
}

export function serialiseError(e: any): Record<string, unknown> {
  if (!e) return { value: null };
  // SubmissionError and friends carry their payload in own enumerable
  // properties (effect-ts style), not in message/cause — capture them.
  const extras: Record<string, unknown> = {};
  try {
    for (const k of Object.keys(e)) {
      if (['name', 'message', 'stack', 'cause'].includes(k)) continue;
      const v = (e as any)[k];
      extras[k] =
        typeof v === 'object' && v !== null
          ? JSON.parse(JSON.stringify(v, (_kk, vv) => (typeof vv === 'bigint' ? vv.toString() : vv)))
          : v;
    }
  } catch {
    // best-effort
  }
  return {
    name: e?.name ?? typeof e,
    message: e?.message ?? String(e),
    stack: e?.stack?.split('\n').slice(0, 8).join('\n') ?? null,
    cause: e?.cause ? { message: (e.cause as any)?.message ?? String(e.cause) } : null,
    ...extras,
  };
}

// The wallet SDK's SubmissionError does not carry the node's rejection
// detail (`1010: Invalid Transaction: Custom error: NNN`); only polkadot-js
// console logging surfaces it. Hook the console so negative tests can attach
// the actual node response to their evidence.
export function captureNodeRejections(): { lines: string[]; restore: () => void } {
  const lines: string[] = [];
  const orig = { log: console.log, warn: console.warn, error: console.error };
  const hook =
    (fn: (...a: any[]) => void) =>
    (...args: any[]) => {
      const text = args.map((a) => (typeof a === 'string' ? a : String(a))).join(' ');
      if (/invalid transaction|custom error|rejected/i.test(text)) lines.push(text);
      fn(...args);
    };
  console.log = hook(orig.log);
  console.warn = hook(orig.warn);
  console.error = hook(orig.error);
  return {
    lines,
    restore: () => {
      console.log = orig.log;
      console.warn = orig.warn;
      console.error = orig.error;
    },
  };
}

// Convenience: stop wallets, swallowing errors (tests stop both wallets in
// success paths; failure paths rely on runTest's forced exit).
export async function stopAll(...ctxs: (WalletCtx | undefined)[]): Promise<void> {
  for (const ctx of ctxs) {
    try {
      await ctx?.wallet.stop();
    } catch {
      // best-effort
    }
  }
}

export { currentState };
