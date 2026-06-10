import React, { useState } from 'react';

import { hexToBytes, bytesToHex, randomBytes32 } from '../../../src/wallet/hex.js';

import { userAddressBytes } from '../lib/providers.js';
import { ViewHeader, Panel, ActionButton, Mono, Chip, CapBar } from '../ui.js';
import type { AppContext } from '../App.js';

export function GrantsPanel({ ctx, revokeBeat }: { ctx: AppContext; revokeBeat?: boolean }) {
  const { ledger, account, mid, log, nightColor } = ctx;
  const [cap, setCap] = useState('300');
  const [issuedSecret, setIssuedSecret] = useState<string | null>(null);
  const [dappSecret, setDappSecret] = useState('');
  const [dappAmount, setDappAmount] = useState('50');

  const epoch = ledger?.device_epoch ?? 0n;
  const grants = ledger ? [...ledger.grants] : [];

  return (
    <>
      <ViewHeader
        numeral={revokeBeat ? '04' : '03'}
        title={revokeBeat ? 'Revoke the grant' : 'Spend via a scoped grant'}
        narration={
          revokeBeat
            ? 'One circuit call flips the grant inactive. The dApp still holds the secret — and it is now worthless. The contract, not the dApp, was always the enforcer.'
            : 'Issue the dApp a credential scoped to operation × token colour × cumulative cap. Hand over the secret once; the contract enforces the boundary.'
        }
      />

      <Panel
        title="Grants on-chain"
        sub="Live from the ledger: each grant's cumulative spend against its cap, and whether the contract still honours it."
      >
        <table>
          <thead>
            <tr>
              <th>grant</th>
              <th>spent / cap</th>
              <th>status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {grants.length === 0 && (
              <tr>
                <td className="dim" colSpan={4}>
                  no grants issued yet
                </td>
              </tr>
            )}
            {grants.map(([commitment, info]) => (
              <tr key={String(commitment)}>
                <td>
                  <Mono v={commitment.toString(16)} short />
                </td>
                <td className="cell-capbar">
                  <CapBar spent={info.spent} cap={info.cap} />
                </td>
                <td>
                  {!info.active ? (
                    <Chip tone="danger">revoked</Chip>
                  ) : info.epoch !== epoch ? (
                    <Chip tone="muted">stale epoch</Chip>
                  ) : (
                    <Chip tone="ok">active</Chip>
                  )}
                </td>
                <td className="row-actions">
                  {info.active && (
                    <ActionButton
                      label="revoke"
                      busyLabel="revoking…"
                      kind="danger"
                      task={{ label: 'Revoking the grant', circuit: 'revoke_grant' }}
                      onRun={async () => {
                        const r = await account.revokeGrantByCommitment(commitment);
                        log(`revoke_grant → tx ${r.txId}`);
                        await ctx.refreshLedger();
                        return r.txId;
                      }}
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="row controls">
          <label className="field field-inline">
            <span className="field-label">cap</span>
            <input value={cap} onChange={(e) => setCap(e.target.value)} size={8} />
          </label>
          <ActionButton
            label="Issue grant (Night, capped)"
            busyLabel="issuing…"
            task={{ label: 'Issuing a scoped grant', circuit: 'add_grant' }}
            onRun={async () => {
              const grantSecret = randomBytes32();
              const r = await account.addGrant(grantSecret, nightColor, BigInt(cap));
              setIssuedSecret(bytesToHex(grantSecret));
              log(`add_grant cap=${cap} → tx ${r.txId}`);
              await ctx.refreshLedger();
              return r.txId;
            }}
          />
        </div>
        {issuedSecret && (
          <div className="secret-callout">
            <div className="secret-head">
              <Chip tone="warn">grant secret — shown once</Chip>
              <span className="dim">hand this to the dApp; it is the entire credential</span>
            </div>
            <Mono v={issuedSecret} />
          </div>
        )}
      </Panel>

      <Panel
        title="The dApp's console"
        sub="A separate connection holding only the grant secret — exactly what a dApp backend would hold. No device key, no recovery secret."
        tone="dapp"
      >
        <div className="row controls">
          <label className="field field-inline grow">
            <span className="field-label">grant secret</span>
            <input value={dappSecret} onChange={(e) => setDappSecret(e.target.value)} />
          </label>
          <input value={dappAmount} onChange={(e) => setDappAmount(e.target.value)} size={6} />
          <ActionButton
            label="Spend via grant"
            busyLabel="spending…"
            disabled={!dappSecret}
            task={{ label: 'dApp spending through the grant', circuit: 'grant_withdraw_night' }}
            onRun={async () => {
              // A separate connection holding ONLY the grant secret — exactly
              // what a dApp backend would hold.
              const dapp = await ctx.reconnect({ grantSecret: hexToBytes(dappSecret.trim()) });
              const r = await dapp.grantWithdrawNight(
                nightColor,
                BigInt(dappAmount),
                userAddressBytes(mid.walletCtx),
              );
              log(`grant_withdraw_night ${dappAmount} → tx ${r.txId}`);
              await ctx.refreshLedger();
              return r.txId;
            }}
          />
        </div>
        <p className="dim">
          Spending over the cap, or after revocation, fails in the circuit — try it.
        </p>
      </Panel>
    </>
  );
}
