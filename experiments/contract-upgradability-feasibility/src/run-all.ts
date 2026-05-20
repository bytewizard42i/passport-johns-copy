// Sequential test orchestrator — alternative entry-point to ./run-all.sh.
//
// Useful when the devnet is already up and you just want to re-run every
// test in TypeScript without re-bringing-up Docker. After every test,
// regenerates FINDINGS.md.

import { spawnSync } from 'node:child_process';
import * as path from 'node:path';

// Execution order sequenced by on-chain VK-set compatibility — see
// run-all.sh for the full reasoning.
const TESTS = [
  'tests/u1-deploy-and-authority.ts',
  'tests/u2-rotate-authority.ts',
  'tests/u3-authority-loss.ts',
  'tests/u4-disable-circuit.ts',
  'tests/u5-reenable-same-key.ts',
  'tests/u9-in-flight-call.ts',
  'tests/u10-indexer-visibility.ts',
  'tests/u6-reenable-new-key.ts',
  'tests/u7-add-circuit.ts',
  'tests/u8-evolve-ledger.ts',
];

const HERE = path.dirname(new URL(import.meta.url).pathname);

let passed = 0,
  failed = 0,
  pending = 0;

for (const t of TESTS) {
  console.log('\n' + '─'.repeat(70));
  console.log(`▶ ${t}`);
  console.log('─'.repeat(70));
  const r = spawnSync('npx', ['tsx', path.join(HERE, t)], {
    stdio: 'inherit',
    cwd: path.resolve(HERE, '..'),
  });
  if (r.status === 0) passed++;
  else failed++;
}

console.log('\nRegenerating FINDINGS.md…');
spawnSync('npx', ['tsx', path.join(HERE, 'compose-findings.ts')], {
  stdio: 'inherit',
  cwd: path.resolve(HERE, '..'),
});

console.log('\n' + '═'.repeat(70));
console.log(` Summary: ${passed} passed, ${failed} failed, ${pending} pending`);
console.log('═'.repeat(70));
process.exit(failed > 0 ? 1 : 0);
