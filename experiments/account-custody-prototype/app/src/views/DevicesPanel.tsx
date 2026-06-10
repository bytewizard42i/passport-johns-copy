import React, { useState } from 'react';

import { createPasskey, deriveDeviceSecret, deriveDevModeSecret } from '../lib/passkey.js';
import { ViewHeader, Panel, ActionButton, Mono, Chip } from '../ui.js';
import type { AppContext } from '../App.js';

export function DevicesPanel({ ctx }: { ctx: AppContext }) {
  const { ledger, account, log } = ctx;
  const [devPassphrase, setDevPassphrase] = useState('');

  const epoch = ledger?.device_epoch ?? 0n;
  const devices = ledger ? [...ledger.devices] : [];
  const active = devices.filter(([, e]) => e === epoch);
  const stale = devices.filter(([, e]) => e !== epoch);

  return (
    <>
      <ViewHeader
        title="Devices"
        narration="Each row is a device-secret commitment in public state, tagged with the epoch it was registered in. Only commitments at the current epoch authorise anything; recovery bumps the epoch and strands the rest."
      />

      <Panel
        title="Registered devices"
        sub="Hash-preimage auth — the prototype stand-in for C5's JubJub Schnorr. Any active device is admin (1-of-n). Removing your own device locks this browser out."
      >
        <table>
          <thead>
            <tr>
              <th>commitment</th>
              <th>epoch</th>
              <th>status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {active.map(([commitment, e]) => (
              <tr key={String(commitment)}>
                <td>
                  <Mono v={commitment.toString(16)} short />
                </td>
                <td className="num">{String(e)}</td>
                <td>
                  <Chip tone="ok">active</Chip>{' '}
                  {ctx.deviceCommitment === commitment.toString() && (
                    <Chip tone="info">this device</Chip>
                  )}
                </td>
                <td className="row-actions">
                  <ActionButton
                    label="remove"
                    busyLabel="removing…"
                    kind="danger"
                    disabled={active.length <= 1}
                    task={{ label: 'Removing the device', circuit: 'remove_device' }}
                    onRun={async () => {
                      const r = await account.removeDeviceByCommitment(commitment);
                      log(`remove_device → tx ${r.txId}`);
                      await ctx.refreshLedger();
                      return r.txId;
                    }}
                  />
                </td>
              </tr>
            ))}
            {stale.map(([commitment, e]) => (
              <tr key={String(commitment)} className="stale">
                <td>
                  <Mono v={commitment.toString(16)} short />
                </td>
                <td className="num">{String(e)}</td>
                <td>
                  <Chip tone="muted">revoked — epoch {String(e)}</Chip>
                </td>
                <td />
              </tr>
            ))}
          </tbody>
        </table>
        <div className="row controls">
          <ActionButton
            label="Add device (new passkey)"
            busyLabel="adding…"
            task={{ label: 'Registering a new device', circuit: 'add_device' }}
            onRun={async () => {
              const ref = await createPasskey(`device-${Date.now() % 10_000}`);
              const secret = await deriveDeviceSecret(ref);
              const r = await account.addDevice(secret);
              log(`add_device (passkey ${ref.label}) → tx ${r.txId}`);
              await ctx.refreshLedger();
              return r.txId;
            }}
          />
          <span className="ctrl-gap" />
          <label className="field field-inline">
            <span className="field-label">or dev-mode passphrase</span>
            <input
              type="password"
              value={devPassphrase}
              onChange={(e) => setDevPassphrase(e.target.value)}
              size={14}
            />
          </label>
          <ActionButton
            label="Add (dev mode)"
            busyLabel="adding…"
            kind="ghost"
            disabled={!devPassphrase}
            task={{ label: 'Registering a new device', circuit: 'add_device' }}
            onRun={async () => {
              const secret = await deriveDevModeSecret(devPassphrase);
              const r = await account.addDevice(secret);
              log(`add_device (dev mode) → tx ${r.txId}`);
              setDevPassphrase('');
              await ctx.refreshLedger();
              return r.txId;
            }}
          />
        </div>
      </Panel>
    </>
  );
}
