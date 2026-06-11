// Deploy the counter contract with the sponsor paying its own fees — this is
// setup for F2 (the zero-start user needs a pre-existing contract to call),
// not the pattern under test. F6 deploys its own instance through the
// sponsored flow.
//
// Usage:
//   npm run deploy

import { createProviders } from './utils.js';
import { setupSponsor, setupCounter } from './test-helpers.js';

async function main() {
  console.log('═══ Deploy counter contract (sponsor-paid, setup for F2) ═══\n');

  const sponsorCtx = await setupSponsor();
  const providers = await createProviders(sponsorCtx);
  const { address } = await setupCounter(providers, { reuseDeployment: false });
  console.log(`\nDeployed @ ${address}`);
  await sponsorCtx.wallet.stop();
  setTimeout(() => process.exit(0), 100).unref();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
