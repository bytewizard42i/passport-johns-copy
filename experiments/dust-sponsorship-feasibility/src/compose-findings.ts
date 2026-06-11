// Regenerate FINDINGS.md's results table mechanically from evidence/*.json.
//
// Reads every JSON file in evidence/, looks up the matching test id, and
// rewrites the section between the markers
//
//   <!-- BEGIN-RESULTS-TABLE -->
//   ...
//   <!-- END-RESULTS-TABLE -->
//
// in FINDINGS.md.

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const EVIDENCE_DIR = path.join(ROOT, 'evidence');
const FINDINGS = path.join(ROOT, 'FINDINGS.md');

const TEST_ORDER = ['F1', 'F2', 'F3', 'F4', 'F5', 'F6'];
const TEST_DESCRIPTIONS: Record<string, string> = {
  F1: 'happy path: user balances tokens, sponsor balances dust',
  F2: 'zero-NIGHT zero-DUST user circuit call',
  F3: "re-balance corruption: sponsor balances 'all' (negative)",
  F4: 'TTL expiry across the user→sponsor round-trip (negative)',
  F5: 'sponsor with insufficient DUST (negative)',
  F6: 'sponsored contract deployment (Passport onboarding shape)',
};

interface Evidence {
  test: string;
  name: string;
  verdict: 'PASS' | 'FAIL' | 'PARTIAL' | 'PENDING';
  txHash?: string;
  errorCode?: string;
  note: string;
}

function loadEvidence(): Map<string, Evidence> {
  const out = new Map<string, Evidence>();
  if (!fs.existsSync(EVIDENCE_DIR)) return out;
  for (const f of fs.readdirSync(EVIDENCE_DIR)) {
    if (!f.endsWith('.json')) continue;
    try {
      const data = JSON.parse(fs.readFileSync(path.join(EVIDENCE_DIR, f), 'utf-8')) as Evidence;
      if (data.test) {
        const existing = out.get(data.test);
        if (!existing || (data as any).ranAt > (existing as any).ranAt) out.set(data.test, data);
      }
    } catch {
      // Skip unparseable files.
    }
  }
  return out;
}

function buildTable(evidence: Map<string, Evidence>): string {
  const lines: string[] = [];
  lines.push('| Test | Status  | Tx hash / error code | Note                                         |');
  lines.push('| ---- | ------- | -------------------- | -------------------------------------------- |');
  for (const id of TEST_ORDER) {
    const e = evidence.get(id);
    if (!e) {
      lines.push(`| ${id}   | PENDING | —                    | ${TEST_DESCRIPTIONS[id]}`.padEnd(94) + '|');
      continue;
    }
    const tx = e.txHash ? trimTx(e.txHash) : e.errorCode ?? '—';
    lines.push(`| ${id}   | ${e.verdict.padEnd(7)} | ${tx.padEnd(20)} | ${(e.note || TEST_DESCRIPTIONS[id]).slice(0, 44).padEnd(44)} |`);
  }
  return lines.join('\n');
}

function trimTx(tx: string): string {
  return tx.length > 20 ? tx.slice(0, 8) + '...' + tx.slice(-7) : tx;
}

function rewriteFindings(newTable: string): void {
  const text = fs.readFileSync(FINDINGS, 'utf-8');
  const begin = '<!-- BEGIN-RESULTS-TABLE -->';
  const end = '<!-- END-RESULTS-TABLE -->';

  if (text.includes(begin) && text.includes(end)) {
    const re = new RegExp(`${begin}[\\s\\S]*?${end}`);
    const out = text.replace(re, `${begin}\n\n${newTable}\n\n${end}`);
    fs.writeFileSync(FINDINGS, out);
    console.log(`Updated FINDINGS.md results table (${TEST_ORDER.length} rows).`);
    return;
  }

  console.warn('Could not locate results-table markers in FINDINGS.md; appending instead.');
  fs.appendFileSync(FINDINGS, `\n\n${newTable}\n`);
}

const ev = loadEvidence();
console.log(`Loaded ${ev.size} evidence file(s).`);
rewriteFindings(buildTable(ev));
