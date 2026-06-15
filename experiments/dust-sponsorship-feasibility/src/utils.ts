// Provider/wallet plumbing — adapted from
// experiments/contract-custody-feasibility/src/utils.ts. The custody
// contract is replaced by the minimal counter contract; everything else is
// kept as close to the reference harness as possible so that differences in
// findings cannot be blamed on harness drift.

import * as path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { WebSocket } from 'ws';
import * as Rx from 'rxjs';
import { Buffer } from 'buffer';

import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { setNetworkId, getNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import * as ledger from '@midnight-ntwrk/ledger-v8';
import { WalletFacade } from '@midnight-ntwrk/wallet-sdk-facade';
import { DustWallet } from '@midnight-ntwrk/wallet-sdk-dust-wallet';
import { HDWallet, Roles } from '@midnight-ntwrk/wallet-sdk-hd';
import { ShieldedWallet } from '@midnight-ntwrk/wallet-sdk-shielded';
import {
  UnshieldedAddress,
  MidnightBech32m,
} from '@midnight-ntwrk/wallet-sdk-address-format';
import {
  createKeystore,
  PublicKey,
  UnshieldedWallet,
} from '@midnight-ntwrk/wallet-sdk-unshielded-wallet';

// The wallet-sdk storage interface wants `upsert`, `get`, `delete`, `list`.
// We don't need history for this experiment, so supply a no-op stub.
const NoopTxHistoryStorage = {
  upsert: async (..._args: unknown[]) => undefined,
  get:    async (..._args: unknown[]) => null,
  delete: async (..._args: unknown[]) => undefined,
  list:   async (..._args: unknown[]) => [] as unknown[],
  clear:  async (..._args: unknown[]) => undefined,
};

// Enable WebSocket for GraphQL subscriptions.
// @ts-expect-error required for wallet sync
globalThis.WebSocket = WebSocket;

const NETWORK = process.env.MIDNIGHT_NETWORK ?? 'local';

const CONFIGS: Record<
  string,
  { networkId: string; indexer: string; indexerWS: string; node: string; proofServer: string }
> = {
  local: {
    networkId: 'undeployed',
    // Defaults match the linux host-network compose; on macOS run-all.sh
    // exports the 1xxxx-offset URLs matching docker-compose.macos.yml.
    indexer: process.env.INDEXER_URL ?? 'http://localhost:8088/api/v4/graphql',
    indexerWS: process.env.INDEXER_WS_URL ?? 'ws://localhost:8088/api/v4/graphql/ws',
    node: process.env.NODE_URL ?? 'http://localhost:9944',
    proofServer: process.env.PROOF_SERVER_URL ?? 'http://127.0.0.1:6300',
  },
  preprod: {
    networkId: 'preprod',
    indexer: 'https://indexer.preprod.midnight.network/api/v3/graphql',
    indexerWS: 'wss://indexer.preprod.midnight.network/api/v3/graphql/ws',
    node: 'https://rpc.preprod.midnight.network',
    proofServer: 'http://127.0.0.1:6300',
  },
};

export const CONFIG = CONFIGS[NETWORK] ?? CONFIGS.local;
setNetworkId(CONFIG.networkId as any);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const zkConfigPath = path.resolve(__dirname, '..', 'contracts', 'managed', 'counter');

const contractPath = path.join(zkConfigPath, 'contract', 'index.js');
export const CounterContract = await import(pathToFileURL(contractPath).href);

export const PRIVATE_STATE_ID = 'dust-sponsorship-state';

// ─── Wallet ─────────────────────────────────────────────────────────────────

export function deriveKeys(seed: string) {
  const hdWallet = HDWallet.fromSeed(Buffer.from(seed, 'hex'));
  if (hdWallet.type !== 'seedOk') throw new Error('Invalid seed');

  const result = hdWallet.hdWallet
    .selectAccount(0)
    .selectRoles([Roles.Zswap, Roles.NightExternal, Roles.Dust])
    .deriveKeysAt(0);

  if (result.type !== 'keysDerived') throw new Error('Key derivation failed');

  hdWallet.hdWallet.clear();
  return result.keys;
}

export async function createWallet(seed: string) {
  const keys = deriveKeys(seed);
  const networkId = getNetworkId();

  const shieldedSecretKeys = ledger.ZswapSecretKeys.fromSeed(keys[Roles.Zswap]);
  const dustSecretKey = ledger.DustSecretKey.fromSeed(keys[Roles.Dust]);
  const unshieldedKeystore = createKeystore(keys[Roles.NightExternal], networkId);

  // feeBlocksMargin: fee headroom beyond the SDK's estimate. The counter
  // circuit is tiny, but the reference harness needed 100 for its k=15
  // circuit and the margin costs nothing on a devnet. Override with
  // FEE_BLOCKS_MARGIN if a test needs a tight value.
  const feeBlocksMargin = Number(process.env.FEE_BLOCKS_MARGIN ?? '100');

  const configuration = {
    networkId,
    indexerClientConnection: {
      indexerHttpUrl: CONFIG.indexer,
      indexerWsUrl: CONFIG.indexerWS,
    },
    provingServerUrl: new URL(CONFIG.proofServer),
    relayURL: new URL(CONFIG.node.replace(/^http/, 'ws')),
    costParameters: {
      feeBlocksMargin,
    },
    txHistoryStorage: NoopTxHistoryStorage,
  };

  const wallet: WalletFacade = await (WalletFacade as any).init({
    configuration,
    shielded: (config: any) => ShieldedWallet(config).startWithSecretKeys(shieldedSecretKeys),
    unshielded: (config: any) =>
      UnshieldedWallet(config).startWithPublicKey(PublicKey.fromKeyStore(unshieldedKeystore)),
    dust: (config: any) =>
      DustWallet(config).startWithSecretKey(
        dustSecretKey,
        ledger.LedgerParameters.initialParameters().dust,
      ),
  });

  await wallet.start(shieldedSecretKeys, dustSecretKey);

  return { wallet, shieldedSecretKeys, dustSecretKey, unshieldedKeystore, seed };
}

export type WalletCtx = Awaited<ReturnType<typeof createWallet>>;

export function unshieldedAddressOf(ctx: WalletCtx): UnshieldedAddress {
  // getBech32Address() returns a MidnightBech32m instance, not a string.
  const bech32 = ctx.unshieldedKeystore.getBech32Address();
  return UnshieldedAddress.codec.decode(getNetworkId() as any, bech32 as MidnightBech32m);
}

// Standard single-wallet providers: the wallet balances and pays for its own
// transactions. Used by deploy.ts (the sponsor deploying the counter
// contract for F2) — the sponsorship-split providers live in sponsorship.ts.
export async function createProviders(walletCtx: WalletCtx) {
  const state = await Rx.firstValueFrom(walletCtx.wallet.state().pipe(Rx.filter((s) => s.isSynced)));

  const signFn = (payload: Uint8Array) => walletCtx.unshieldedKeystore.signData(payload);

  const walletProvider = {
    getCoinPublicKey: () => state.shielded.coinPublicKey.toHexString(),
    getEncryptionPublicKey: () => state.shielded.encryptionPublicKey.toHexString(),
    async balanceTx(tx: any, ttl?: Date) {
      const recipe = await walletCtx.wallet.balanceUnboundTransaction(
        tx,
        {
          shieldedSecretKeys: walletCtx.shieldedSecretKeys,
          dustSecretKey: walletCtx.dustSecretKey,
        },
        { ttl: ttl ?? new Date(Date.now() + 30 * 60 * 1000) },
      );

      const signed = await walletCtx.wallet.signRecipe(recipe, signFn);
      return walletCtx.wallet.finalizeRecipe(signed);
    },
    submitTx: (tx: any) => walletCtx.wallet.submitTransaction(tx) as any,
  };

  const zkConfigProvider = new NodeZkConfigProvider(zkConfigPath);

  return {
    privateStateProvider: levelPrivateStateProvider({
      midnightDbName: `midnight-level-db`,
      privateStateStoreName: PRIVATE_STATE_ID,
      privateStoragePasswordProvider: () => 'DustSponsorship!exp',
      accountId: state.shielded.encryptionPublicKey.toHexString().slice(0, 16),
      walletProvider,
    }),
    publicDataProvider: indexerPublicDataProvider(CONFIG.indexer, CONFIG.indexerWS),
    zkConfigProvider,
    proofProvider: httpClientProofProvider(CONFIG.proofServer, zkConfigProvider),
    walletProvider,
    midnightProvider: walletProvider,
  };
}
