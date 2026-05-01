# C6 · Proof generation

**Serves:** P6 · P8.

## Outcome

Client-side ZK proof generation. The user is the prover, the node is the
verifier. No hosted prover holds user data. Runs in the browser or in a
local proving sidecar.

## Dependencies

- **C7** — witnesses pass through to proof generation.
- **C5** — signing inputs feed into witnesses.
- **C16** — wallet storage holds private state used as witness.
- **External** — Midnight proof server (local Rust process per design
  doc § 3.2).

## Open questions

**Proving location.** Browser (WASM) vs local sidecar (Rust process)?
Browser is most user-friendly; sidecar is faster. Design doc default is
local sidecar.

**Performance at user scale.** Proof generation is ~18 – 21 s for typical
circuits per design doc § 3.3. Acceptable for v1.0 user UX, or do we need
progress callbacks / pre-computed proofs / circuit optimisation?

**Multi-platform support.** iOS, Android, web — different proof-gen
environments. Design doc references a `compact-runtime` library; what's
actually shipped per platform?

**Proof-server portability.** A Rust proof server doesn't run unmodified
in a browser, on iOS, or on Android. Single committed location, or
portable subset across all three? Porting cost is a real risk, not a
footnote.

## Failure modes

**Browser-side proof too slow.** User abandonment due to wait time.
*Detection:* time-to-first-proof telemetry.

**Hosted-prover regression.** v1.0 inadvertently routes proof generation
to a hosted server (P8 violation). *Detection:* any code path sending
witnesses across a network boundary.

**Memory exhaustion.** Large circuits exceed mobile-device memory.
*Detection:* proof generation crashes on supported target devices.

**Proof-server porting cost overrun.** A target platform has no usable
proof-generation path by the time the MVP needs it. *Detection:* WASM
throughput insufficient or mobile-native port stalls past the phase
boundary.

## Alternatives

**A — Local Rust proof server** (design doc default; fastest).

**B — Browser WASM** (fully client-side; slower; simpler deployment).

**C — Hybrid** (browser for small proofs; local sidecar for large).
