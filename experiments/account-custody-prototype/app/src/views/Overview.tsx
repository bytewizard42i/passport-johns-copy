import React from 'react';

import { ViewHeader, Panel, Mono, StatTile, Chip } from '../ui.js';
import type { AppContext } from '../App.js';

export function OverviewView({ ctx }: { ctx: AppContext }) {
  const { session, ledger } = ctx;
  const grants = ledger ? [...ledger.grants] : [];
  const activeGrants = grants.filter(([, g]) => g.active).length;
  const shares = ledger ? Number(ledger.recovery_shares.size()) : 0;

  return (
    <>
      <ViewHeader
        numeral="01"
        title="Your account is a contract"
        narration="Onboarding created a passkey, split a recovery secret 2-of-3, and deployed a personal Compact contract. Everything below is read live from the Midnight ledger."
      />

      <Panel
        title="Account contract"
        sub="The address of your personal account-custody contract on the localnet."
      >
        <Mono v={session.accountAddress} className="addr-hero" />
        <div className="stat-row">
          <StatTile label="round" value={ledger ? String(ledger.round) : '…'} />
          <StatTile label="device epoch" value={ledger ? String(ledger.device_epoch) : '…'} />
          <StatTile label="devices" value={ledger ? String(ledger.device_count) : '…'} />
          <StatTile label="active grants" value={ledger ? String(activeGrants) : '…'} />
          <StatTile label="recovery shares" value={ledger ? String(shares) : '…'} />
        </div>
      </Panel>

      <Panel
        title="How custody works here"
        sub="Three commitments in public state; every move is a proved circuit call."
      >
        <div className="explain-row">
          <div className="explain">
            <Chip tone="ok">devices</Chip>
            <p>
              Each device's secret is committed on-chain. Any active device authorises moves
              (1-of-n). A device epoch bump invalidates all of them at once.
            </p>
          </div>
          <div className="explain">
            <Chip tone="info">grants</Chip>
            <p>
              A grant is a scoped credential for a dApp: one operation, one token colour, a
              cumulative cap. The contract enforces the scope — not the dApp.
            </p>
          </div>
          <div className="explain">
            <Chip tone="warn">recovery</Chip>
            <p>
              Losing every device is survivable: 2 of 3 shares reconstruct the recovery secret,
              which re-keys the account and orphans everything else.
            </p>
          </div>
        </div>
        <div className="next-cue">
          <button className="btn btn-primary" onClick={() => ctx.goToStep(2)}>
            Next — fund the account →
          </button>
        </div>
      </Panel>
    </>
  );
}
