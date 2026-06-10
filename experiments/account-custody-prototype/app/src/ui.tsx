// Shared UI atoms for the demo shell.

import React, { useState } from 'react';

import { beginTask, completeTask, failTask } from './lib/txTracker.js';

/** Card with brand "page furniture" header. */
export function Panel(props: {
  title: string;
  sub?: string;
  children: React.ReactNode;
  tone?: 'default' | 'dapp' | 'scaffold';
  className?: string;
}) {
  const tone = props.tone ?? 'default';
  return (
    <section className={`panel panel-${tone} ${props.className ?? ''}`}>
      <header className="panel-head">
        <h2 className="eyebrow">{props.title}</h2>
        {props.sub && <p className="panel-sub">{props.sub}</p>}
      </header>
      {props.children}
    </section>
  );
}

/** Numbered view header — the presenter's beat. */
export function ViewHeader(props: { numeral?: string; title: string; narration: string }) {
  return (
    <header className="view-head">
      {props.numeral && <span className="view-num">{props.numeral}</span>}
      <div>
        <h1 className="view-title">{props.title}</h1>
        <p className="view-narration">{props.narration}</p>
      </div>
    </header>
  );
}

export function Busy(props: { label: string }) {
  return (
    <span className="busy">
      <span className="spinner" /> {props.label}
    </span>
  );
}

/** Copyable hash / address. */
export function Mono(props: { v: string; short?: boolean; className?: string }) {
  const [copied, setCopied] = useState(false);
  const text =
    props.short && props.v.length > 24 ? `${props.v.slice(0, 12)}…${props.v.slice(-8)}` : props.v;
  return (
    <code
      className={`mono ${copied ? 'copied' : ''} ${props.className ?? ''}`}
      title={copied ? 'copied' : `${props.v} — click to copy`}
      onClick={() => {
        navigator.clipboard?.writeText(props.v);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }}
    >
      {copied ? 'copied ✓' : text}
    </code>
  );
}

export function Chip(props: {
  tone: 'ok' | 'muted' | 'danger' | 'warn' | 'info';
  children: React.ReactNode;
}) {
  return <span className={`chip chip-${props.tone}`}>{props.children}</span>;
}

export function StatTile(props: { label: string; value: string }) {
  return (
    <div className="stat">
      <span className="stat-k">{props.label}</span>
      {/* keyed so a value change re-mounts and replays the pulse animation */}
      <span className="stat-v" key={props.value}>
        {props.value}
      </span>
    </div>
  );
}

/** Spent-against-cap meter for grants. */
export function CapBar(props: { spent: bigint; cap: bigint }) {
  const pct = props.cap > 0n ? Math.min(100, Number((props.spent * 100n) / props.cap)) : 0;
  return (
    <div className="capbar" title={`${props.spent} of ${props.cap} spent`}>
      <div className="capbar-track">
        <div className="capbar-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="capbar-label">
        {String(props.spent)} <span className="dim">/ {String(props.cap)}</span>
      </span>
    </div>
  );
}

/**
 * Async action button. When `task` is given the run is tracked in the
 * proving dock (build → prove → submit); `onRun` may return the landed tx
 * id so the dock can show it.
 */
export function ActionButton(props: {
  label: string;
  busyLabel?: string;
  onRun: () => Promise<string | void>;
  disabled?: boolean;
  kind?: 'primary' | 'ghost' | 'danger';
  block?: boolean;
  task?: { label: string; circuit: string };
  onError?: (message: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const kind = props.kind ?? 'primary';
  return (
    <button
      className={`btn btn-${kind} ${props.block ? 'btn-block' : ''}`}
      disabled={busy || props.disabled}
      onClick={async () => {
        setBusy(true);
        if (props.task) beginTask(props.task.label, props.task.circuit);
        try {
          const txId = await props.onRun();
          if (props.task) completeTask(typeof txId === 'string' ? txId : undefined);
        } catch (e: any) {
          const message = String(e?.message ?? e);
          if (props.task) failTask(message);
          props.onError?.(message);
          console.error(`[passport] action failed: ${message}`, e);
        } finally {
          setBusy(false);
        }
      }}
    >
      {busy ? (
        <>
          <span className="spinner spinner-btn" /> {props.busyLabel ?? 'working…'}
        </>
      ) : (
        props.label
      )}
    </button>
  );
}
