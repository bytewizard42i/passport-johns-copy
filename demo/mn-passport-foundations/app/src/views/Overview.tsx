import React from 'react';

import { ViewHeader, Mono, Chip, Field, X } from '../ui.js';
import { FlowDiagram } from './FlowDiagram.js';
import type { AppContext } from '../App.js';

function bytesHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Machine-readable-zone line: uppercase, non-alphanumerics become fillers,
// padded to the classic 44 characters.
function mrzLine(s: string): string {
  return (s.toUpperCase().replace(/[^A-Z0-9]/g, '<') + '<'.repeat(44)).slice(0, 44);
}

export function OverviewView({ ctx }: { ctx: AppContext }) {
  const { session, ledger } = ctx;
  const grants = ledger ? [...ledger.grants] : [];
  const epoch = ledger ? ledger.device_epoch : 0n;
  const activeGrants = grants.filter(([, g]) => g.active && g.epoch === epoch).length;
  const shares = ledger ? Number(ledger.recovery_shares.size()) : 0;
  const holder = (
    session.alias ??
    (session.devMode ? 'bearer' : (session.passkey?.label ?? 'bearer'))
  ).toUpperCase();
  const reissued = epoch > 0n;
  const nightTotal = ledger
    ? [...ledger.night_balances].reduce((acc, [, v]) => acc + v, 0n)
    : 0n;
  const coinCount = ledger ? [...ledger.coins].filter(([, q]) => q.value > 0n).length : 0;
  const activeDevices = ledger
    ? [...ledger.devices].filter(([, e]) => e === epoch).length
    : 0;

  const mrz1 = mrzLine(`N<FI${holder}<<MN PASSPORT<WALLET`);
  const mrz2 = mrzLine(
    `${session.accountAddress.slice(0, 20)}<MN<E${String(epoch)}<R${ledger ? String(ledger.round) : ''}`,
  );
  const explorerSnapshot = {
    network: 'Midnight localnet',
    owner_identity: `${session.alias ?? 'bearer'}.night`,
    account_custody_contract: session.accountAddress,
    identity_registry_contract: session.identityRegistryAddress ?? null,
    identity_registration_tx: session.identityRegistrationTxId ?? null,
    ledger_round: ledger ? String(ledger.round) : null,
    device_epoch: String(epoch),
    balances: {
      night_unshielded: String(nightTotal),
      shielded_coin_count: coinCount,
      recovery_shares: shares,
    },
    devices: ledger
      ? [...ledger.devices].map(([commitment, deviceEpoch]) => ({
          commitment: commitment.toString(),
          epoch: String(deviceEpoch),
          active: deviceEpoch === epoch,
        }))
      : [],
    grants: ledger
      ? [...ledger.grants].map(([grant, value]) => ({
          grant: grant.toString(),
          epoch: String(value.epoch),
          color: bytesHex(value.color),
          cap: String(value.cap),
          spent: String(value.spent),
          active: value.active && value.epoch === epoch,
        }))
      : [],
  };

  return (
    <>
      <ViewHeader
        title="Your MN Passport wallet is a contract"
        narration="A personal Compact contract on the Midnight ledger holds this wallet. Everything on this page is read live from chain state — hover any dotted term for what it means."
      />

      <section className="station-section">
        <div className="section-head">
          <div>
            <p className="eyebrow">App Store</p>
            <h2>Launch a dApp from Passport</h2>
          </div>
          <Chip tone="info">single account demo</Chip>
        </div>
        <div className="app-store-grid">
          <button
            className="app-card app-card-live"
            onClick={() => ctx.goToView('flow')}
            data-x="NightFi is intentionally separate from MN Passport. It receives the account context and asks the custody contract to sign the deposit flow."
          >
            <span className="app-logo app-logo-night">N</span>
            <span className="app-copy">
              <strong>NightFi</strong>
              <small>Private yield deposits</small>
            </span>
            <span className="app-action">Open</span>
          </button>
          <button className="app-card" disabled>
            <span className="app-logo app-logo-city">MC</span>
            <span className="app-copy">
              <strong>Midnight City</strong>
              <small>Coming next</small>
            </span>
            <span className="app-action muted">Soon</span>
          </button>
          <button className="app-card" disabled>
            <span className="app-logo app-logo-sig">S</span>
            <span className="app-copy">
              <strong>Sig Network</strong>
              <small>C2C claim path</small>
            </span>
            <span className="app-action muted">Soon</span>
          </button>
        </div>
      </section>

      <section className="doc">
        <header className="doc-head">
          <span className="doc-authority">MN Passport · Localnet</span>
          <span className="doc-type">Private yield custody</span>
        </header>
        <span
          className="doc-chipmark"
          aria-hidden="true"
          data-x="MN Passport wallet cryptography: your device derives the key, the contract verifies the proof, and the app reads the result from ledger state."
        />
        <div className="doc-grid">
          <Field
            k="Holder"
            v={
              <X x="The owner label for this MN Passport wallet. The account is operated by whoever can prove knowledge of an enrolled device secret — derived from your passkey, never stored anywhere (P1).">
                {holder}
              </X>
            }
            big
          />
          <Field
            k="Status"
            v={
              <span data-x="Status derived from on-chain state. VALID means devices at the current epoch are enrolled; REISSUED means the account has been recovered and re-keyed at a new epoch.">
                <Chip stamp tone={reissued ? 'warn' : 'ok'}>
                  {reissued ? `reissued · epoch ${String(epoch)}` : 'valid'}
                </Chip>
              </span>
            }
          />
          <Field
            k="Custody account contract"
            v={
              <X x="The address of your personal MN Passport custody contract. Anyone can verify this wallet state against the ledger; no issuing authority is involved (P8).">
                <Mono v={session.accountAddress} short group />
              </X>
            }
            wide
          />
          <Field
            k="MN Passport ID registry"
            v={
              <X x="The identity registry contract that recorded this handle during onboarding. The readable alias is a UI label; the registry transaction binds it to the custody account contract.">
                <Mono v={session.identityRegistryAddress ?? 'deploying'} short group />
              </X>
            }
            wide
          />
          <Field
            k="Identity tx"
            v={
              <X x="The transaction that registered this Night ID to the MN Passport custody account.">
                <Mono v={session.identityRegistrationTxId ?? 'pending'} short group />
              </X>
            }
            wide
          />
          <Field
            k="Issuing round"
            v={
              <X x="The current ledger round. Every authorised operation bumps an internal round counter, so a captured transaction can never be replayed.">
                {ledger ? String(ledger.round) : '…'}
              </X>
            }
          />
          <Field
            k="Device epoch"
            v={
              <X x="Bumped by recovery: every device and grant from an earlier epoch instantly stops being honoured by the contract (P4, P5).">
                {String(epoch)}
              </X>
            }
          />
          <Field
            k="Devices"
            v={
              <X x="Devices enrolled at the current epoch. Every one is a first-class peer: any device can act, enrol another, or revoke one (P3).">
                {ledger ? String(activeDevices) : '…'}
              </X>
            }
          />
          <Field
            k="Active grants"
            v={
              <X x="Scoped credentials issued to dApps — operation × token colour × cumulative cap, enforced by the contract circuit, not by the dApp (P7).">
                {ledger ? String(activeGrants) : '…'}
              </X>
            }
          />
          <Field
            k="Recovery shares"
            v={
              <X x="The recovery secret is split 2-of-3. Any two shares reconstruct it, re-key the account, and retire every old device — total loss is survivable (P5).">
                {ledger ? `${shares} — any 2 of 3` : '…'}
              </X>
            }
          />
        </div>
        <div
          className="doc-mrz"
          data-x="Machine-readable wallet line — decorative here, derived from the holder, the contract address, the epoch, and the round."
        >
          <span>{mrz1}</span>
          <span>{mrz2}</span>
        </div>
      </section>

      <div className="tiles">
        <button
          className="tile"
          onClick={() => ctx.goToView('assets')}
          data-x="Assets held by your contract — custody is enforced by its circuits, not by this app. Balances are read live from the ledger."
        >
          <span className="tile-k">Holdings</span>
          <span className="tile-v">
            {ledger ? String(nightTotal) : '…'} <small>NIGHT</small>
          </span>
          <span className="tile-sub">
            {coinCount > 0 ? `+ ${coinCount} shielded asset${coinCount > 1 ? 's' : ''}` : 'no shielded assets yet'}
          </span>
        </button>
        <button
          className="tile"
          onClick={() => ctx.goToView('grants')}
          data-x="Connections are scoped credentials handed to dApps — like OAuth scopes, except the ledger itself enforces them at proof verification (P7)."
        >
          <span className="tile-k">Connections</span>
          <span className="tile-v">{ledger ? activeGrants : '…'}</span>
          <span className="tile-sub">active scoped grants</span>
        </button>
        <button
          className="tile"
          onClick={() => ctx.goToView('devices')}
          data-x="Every enrolled device is a first-class peer — no primary device, no backup hierarchy (P3)."
        >
          <span className="tile-k">Devices</span>
          <span className="tile-v">{ledger ? activeDevices : '…'}</span>
          <span className="tile-sub">enrolled at epoch {String(epoch)}</span>
        </button>
        <button
          className="tile"
          onClick={() => ctx.goToView('recovery')}
          data-x="Losing every device does not lose the account: any two of the three on-chain shares restore the same account — same name, balances, and history (P5)."
        >
          <span className="tile-k">Recovery</span>
          <span className="tile-v">
            2 <small>of</small> 3
          </span>
          <span className="tile-sub">{shares === 3 ? 'kit ready' : `${shares} shares on-chain`}</span>
        </button>
      </div>

      <section className="station-section explorer-section">
        <div className="section-head">
          <div>
            <p className="eyebrow">Local explorer</p>
            <h2>Account custody inspection</h2>
          </div>
          <Chip tone={ledger ? 'ok' : 'muted'}>{ledger ? 'synced' : 'syncing'}</Chip>
        </div>
        <div className="explorer-grid">
          <div className="explorer-kpis">
            <div>
              <span>Contract</span>
              <Mono v={session.accountAddress} short group />
            </div>
            <div>
              <span>Identity tx</span>
              <Mono v={session.identityRegistrationTxId ?? 'pending'} short group />
            </div>
            <div>
              <span>Devices</span>
              <strong>{ledger ? activeDevices : '...'}</strong>
            </div>
            <div>
              <span>Grants</span>
              <strong>{ledger ? activeGrants : '...'}</strong>
            </div>
          </div>
          <pre className="explorer-json">
            {JSON.stringify(explorerSnapshot, null, 2)}
          </pre>
        </div>
      </section>

      <FlowDiagram ctx={ctx} />
    </>
  );
}
