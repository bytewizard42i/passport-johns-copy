// Shared helpers for individual test runners under src/tests/.
//
// Each test under src/tests/ should:
//   1. import setupContract() to deploy-or-find the v1 contract instance
//   2. await the test action (a maintenance tx, a circuit call, …)
//   3. write evidence via writeEvidence() with verdict + tx hash or error code
//
// Adapted from contract-custody-feasibility/src/test-helpers.ts. The only
// structural change is: no `slot` parameter (this experiment runs against a
// single deployed v1 instance), plus a small block of maintenance-API
// wrappers tailored to the U1–U10 test set.

import * as fs from 'node:fs';
import * as path from 'node:path';
import { firstValueFrom } from 'rxjs';

import {
  deployContract,
  findDeployedContract,
  createContractMaintenanceTxInterface,
  createCircuitMaintenanceTxInterface,
  createCircuitMaintenanceTxInterfaces,
  submitReplaceAuthorityTx,
  submitRemoveVerifierKeyTx,
  submitInsertVerifierKeyTx,
} from '@midnight-ntwrk/midnight-js-contracts';
import { CompiledContract } from '@midnight-ntwrk/compact-js';

import {
  createWallet,
  createProviders,
  UpgradableV1,
  zkConfigPathV1,
  zkConfigPathV2,
  loadV2,
  PRIVATE_STATE_ID,
} from './utils.js';
import { syncWallet, printBalances, writeEvidence, type Verdict, type Evidence } from './common.js';

export interface ContractHandle {
  address: string;
  found: any; // The deployed contract handle from midnight-js-contracts
}

export const compiledV1 = () =>
  CompiledContract.make('upgradable_v1', UpgradableV1.Contract).pipe(
    CompiledContract.withVacantWitnesses,
    CompiledContract.withCompiledFileAssets(zkConfigPathV1),
  );

// v2 is only compiled — never deployed. Used to source new verifier keys
// (U6, U7) and to reason about a wider ledger shape (U8).
export const compiledV2 = async () => {
  const v2 = await loadV2();
  return CompiledContract.make('upgradable_v2', v2.Contract).pipe(
    CompiledContract.withVacantWitnesses,
    CompiledContract.withCompiledFileAssets(zkConfigPathV2),
  );
};

const DEPLOYMENT_FILE = 'deployment.json';
const AUTHORITY_FILE = 'authority.json';

// Read the persisted contract address without spinning up a wallet. Useful
// for code paths that take the address and bring up providers themselves.
export function readDeployedAddress(): string {
  if (!fs.existsSync(DEPLOYMENT_FILE)) {
    throw new Error('No deployment.json — run npm run deploy first.');
  }
  return JSON.parse(fs.readFileSync(DEPLOYMENT_FILE, 'utf-8')).contractAddress;
}

// Wallet + providers + address but NO findDeployedContract bind. After any
// `removeVerifierKey` the contract's on-chain VK set diverges from the
// local v1 compile; the SDK refuses to bind, throwing "Following
// operations: increment, are undefined or have mismatched verifier keys".
// Tests that exercise maintenance after that point must use the low-level
// `submitInsertVerifierKeyTx` / `submitRemoveVerifierKeyTx` calls, which
// don't require a find — they take only providers + compiled + address.
export async function setupForMaintenance(opts: {
  walletSeed?: string;
} = {}): Promise<{ providers: any; walletCtx: any; address: string }> {
  const seed = opts.walletSeed ?? process.env.WALLET_SEED;
  if (!seed) throw new Error('WALLET_SEED env var or opts.walletSeed required');
  if (!fs.existsSync(path.join(zkConfigPathV1, 'contract', 'index.js'))) {
    throw new Error('Contract not compiled. Run: npm run compile');
  }
  const walletCtx = await createWallet(seed);
  await syncWallet(walletCtx, 'wallet');
  printBalances(await firstValueFrom(walletCtx.wallet.state()));
  const providers = await createProviders(walletCtx);
  const address = readDeployedAddress();
  console.log(`Maintenance-only setup for ${address}`);
  return { providers, walletCtx, address };
}

export async function setupContract(opts: {
  walletSeed?: string;
  reuseDeployment?: boolean; // default true
} = {}): Promise<{ providers: any; walletCtx: any; contract: ContractHandle }> {
  const reuse = opts.reuseDeployment ?? true;
  const seed = opts.walletSeed ?? process.env.WALLET_SEED;
  if (!seed) throw new Error('WALLET_SEED env var or opts.walletSeed required');

  if (!fs.existsSync(path.join(zkConfigPathV1, 'contract', 'index.js'))) {
    throw new Error(`Contract not compiled. Run: npm run compile`);
  }

  const walletCtx = await createWallet(seed);
  await syncWallet(walletCtx, 'wallet');
  printBalances(await firstValueFrom(walletCtx.wallet.state()));
  const providers = await createProviders(walletCtx);

  const compiled = compiledV1();

  let address: string;
  let found: any;
  if (reuse && fs.existsSync(DEPLOYMENT_FILE)) {
    address = JSON.parse(fs.readFileSync(DEPLOYMENT_FILE, 'utf-8')).contractAddress;
    console.log(`Connecting to v1 contract @ ${address}`);
    found = await (findDeployedContract as any)(providers, {
      contractAddress: address,
      compiledContract: compiled,
      privateStateId: PRIVATE_STATE_ID,
      initialPrivateState: {},
    });
  } else {
    console.log('Deploying upgradable_v1 contract...');
    const deployed = await deployContract(providers, {
      compiledContract: compiled,
      privateStateId: PRIVATE_STATE_ID,
      initialPrivateState: {},
    });
    address = deployed.deployTxData.public.contractAddress;
    fs.writeFileSync(
      DEPLOYMENT_FILE,
      JSON.stringify(
        { contractAddress: address, deployedAt: new Date().toISOString() },
        null,
        2,
      ),
    );
    console.log(`Deployed @ ${address}`);
    found = deployed;
  }

  return { providers, walletCtx, contract: { address, found } };
}

// ─── Maintenance helpers ────────────────────────────────────────────────────
//
// Thin wrappers around the SDK's maintenance APIs. The signature shapes are
// taken from sdk-reference.md § Example 5; if they drift at run time, capture
// the difference in evidence and EXPERIMENT-NOTE here.

export function contractMaintenance(providers: any, address: string) {
  return createContractMaintenanceTxInterface(providers, compiledV1(), address);
}

export function circuitMaintenance(providers: any, circuitName: string, address: string) {
  return createCircuitMaintenanceTxInterface(providers, circuitName, compiledV1(), address);
}

export function circuitMaintenanceAll(providers: any, address: string) {
  return createCircuitMaintenanceTxInterfaces(providers, compiledV1(), address);
}

// Low-level escape hatches for tests that need to sign with a specific
// (potentially stale) authority key — U3 in particular.
export const lowLevel = {
  replaceAuthority: submitReplaceAuthorityTx,
  removeVerifierKey: submitRemoveVerifierKeyTx,
  insertVerifierKey: submitInsertVerifierKeyTx,
};

// Persist the active authority signing key across tests so U2's rotated
// key is available to U3, U4, U5, etc. NOTE: the at-deploy authority is
// the wallet's signing key by default — the SDK example uses
// `sampleSigningKey()` to *replace* it with a fresh key. Once U2 rotates,
// the new key is the only way to sign maintenance txs from then on.
export function loadAuthority(): { signingKey: string | null; rotatedAt?: string } {
  if (!fs.existsSync(AUTHORITY_FILE)) return { signingKey: null };
  return JSON.parse(fs.readFileSync(AUTHORITY_FILE, 'utf-8'));
}

export function saveAuthority(signingKey: string, note?: string): void {
  fs.writeFileSync(
    AUTHORITY_FILE,
    JSON.stringify(
      { signingKey, rotatedAt: new Date().toISOString(), note: note ?? null },
      null,
      2,
    ),
  );
}

// Load the verifier key for a given circuit from the on-disk managed
// compile output. The `compact` toolchain writes one `<circuit>.verifier`
// file under `<zkConfigPath>/keys/`; the SDK's NodeZkConfigProvider reads
// these. FINDING 2026/05/18: the verifier-key value is not surfaced on
// the runtime `Contract` object — it lives on disk and is loaded
// asynchronously by `ZKConfigProvider.getVerifierKey()`.
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';

export async function verifierKeyFor(
  zkConfigPath: string,
  circuitName: string,
): Promise<unknown> {
  const provider = new NodeZkConfigProvider(zkConfigPath);
  return await provider.getVerifierKey(circuitName);
}

// ─── Test runner harness ────────────────────────────────────────────────────

export async function runTest(opts: {
  testId: string;       // 'U1', 'U2', …
  name: string;         // descriptive: 'deploy-and-authority'
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
  // even after walletCtx.wallet.stop() in the success path; on the
  // failure path stop() is never reached and the process hangs entirely.
  setTimeout(() => process.exit(result.verdict === 'FAIL' ? 1 : 0), 100).unref();
}

// Classify a thrown error into a stable code that FINDINGS.md can group on.
export function classifyError(e: any): string {
  const msg = (e?.message ?? String(e)).toLowerCase();
  const ledgerMatch = msg.match(/ledger[\s-_:]?(?:error)?[\s-_:]?(\d{3})/);
  if (ledgerMatch) return `ledger-${ledgerMatch[1]}`;
  const errorCodeMatch = msg.match(/error\s+code[\s:]+(\w+)/i);
  if (errorCodeMatch) return `node-${errorCodeMatch[1]}`;
  if (msg.includes('authority') && msg.includes('mismatch')) return 'authority-mismatch';
  if (msg.includes('verifier key')) return 'verifier-key-error';
  if (msg.includes('circuit') && msg.includes('not found')) return 'circuit-not-found';
  if (msg.includes('compile') || msg.includes('compact')) return 'compile-error';
  return 'js-error';
}

export function serialiseError(e: any): Record<string, unknown> {
  if (!e) return { value: null };
  return {
    name: e?.name ?? typeof e,
    message: e?.message ?? String(e),
    stack: e?.stack?.split('\n').slice(0, 8).join('\n') ?? null,
    cause: e?.cause ? { message: (e.cause as any)?.message } : null,
  };
}
