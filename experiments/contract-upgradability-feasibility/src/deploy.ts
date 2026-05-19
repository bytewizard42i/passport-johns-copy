// Deploy the upgradable_v1 contract. This is the single deployed contract
// for the entire experiment — every U1–U10 test acts on this one instance.

import { setupContract } from './test-helpers.js';

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║   Deploy upgradable_v1 contract                              ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');

  const { walletCtx, contract } = await setupContract({ reuseDeployment: false });
  console.log(`\nDeployed @ ${contract.address}`);
  await walletCtx.wallet.stop();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
