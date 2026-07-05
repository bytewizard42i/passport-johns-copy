# Discussion Post for midnight-improvement-proposals (AS POSTED)

_This is the final version John posted (2026/07/05) as a **Discussion** on
`midnightntwrk/midnight-improvement-proposals`, following PR #91. Recorded
here verbatim so our archive matches what actually went out._

---

**Title:** Interoperability conventions between Passport accounts and an
external identity engine — offering shipped prior art

**Body:**

Hello Passport and MIP maintainers,

I am John Santi (johnny5i), a Midnight Aliit Cohort-0 (inactive) & NightForce
Bravo.

Alongside a small team I have been building a multi-faceted identity engine on
Midnight, a set of Compact primitives and products (decentralised identifiers,
real-world-asset titles, private contact exchange, agent identity) that
compile today against compiler 0.31.1 with full ZK key generation.

Reading the Midnight Passport component canvases, it struck me how cleanly our two
efforts compose rather than compete. Passport answers *which key or device
may act for an account, and how that account is recovered*. Our engine
answers *who or what an entity is, whether it is currently alive and in good
standing, and what has been attested about it*. In our model a Passport
account is naturally one kind of controller of a DIDz identity.

I would like to open a conversation about a handful of low-level conventions
where early alignment costs nothing now but saves an adapter layer for every
wallet and dApp later. Concretely, three:

1. **Key-commitment derivation.** We identify every principal as
   `persistentHash([domain_tag, secret_key])`, authorising by preimage
   knowledge — your C9 authentication alternative A. If the domain tag and
   preimage layout for that scheme were standardised, a Passport device key
   and one of our identities could authorise against each other with no
   translation.

2. **Domain-separation tags.** Prompted by your ADR 0001 and the
   domain-separation MPS, we now keep a registry of every hash tag we use,
   with a freeze-once-on-chain rule and versioning. We would gladly converge
   our scheme onto whatever the MPS ratifies and contribute our registry as a
   worked downstream example.

3. **Per-context nullifiers.** We use
   `persistentHash([nullifier_tag, secret, verifier_context])` for
   one-per-person actions — your C21 alternative A — so the same person is
   replay-blocked within a context yet unlinkable across contexts.

Where it is useful, I can also share compiling prior art for some of your
open questions — in particular a ZK-attested **scoped-grant** primitive
(operation × object × bounds, with chain-side enforcement) that maps onto
your C10–C12, and a **proof-of-life** module encoding "permanent identity,
renewable eligibility" that pairs with your C14 recovery work.

As a first concrete step, I have opened a small PR adding an **Alternative E**
(m-of-n soulbound-attribute recovery, with an Ai-vouch factor) to the C14
recovery canvas — offered as input to MIP-4, deferring to your DeRec
direction: <https://github.com/midnightntwrk/passport/pull/91>. A fuller
technical overview of how our engine is structured (the five conventions
above, in depth) is here:
<https://github.com/bytewizard42i/passport-johns-copy/blob/main/DIDz-Passport-Collaboration/07_DIDz-Engine-Architecture-Overview-for-Passport.md>

For context, this foundation carries a broader product line — self-custodied
KYC, patient-held health records, civic voting, estate automation, animal
provenance — all resolving identity and liveness through the same engine, so
the payoff from aligning these conventions compounds across every one of
them. Public repositories, with more being opened as they are readied:

- DIDz (identity registry): <https://github.com/bytewizard42i/didz-dapp-system>
- AgenticDID (Ai-agent identity): <https://github.com/bytewizard42i/AgenticDID_io_me>
- SelectConnect (private contact exchange): <https://github.com/bytewizard42i/selectConnect_app_pro>
- realVote (private verifiable voting): <https://github.com/bytewizard42i/realVote>
- RWAz (real-world-asset titles): <https://github.com/bytewizard42i/RWAz>

I am offering context and working code, and asking whether it is worth
comparing notes on these conventions before either side freezes them. "An oz.
of prevention beats a lb. of cure".

I am hopeful that together we can create a comprehensive system that will
revolutionise online interactions with privacy-preserving digital identity for
the world's digital systems.

With thanks for the open component canvases, they made this easy to reason
about.

— John Santi

cc   https://github.com/hbulgarini
re: https://github.com/midnightntwrk/passport

---

## Notes for us (do not post)

- **Rung fit:** this is Rung 0/1 from file 04 — presence + a genuine offer,
  no controversial PR. It name-drops the exact components (C9, C10–C12, C14,
  C21, ADR 0001, MIP-4) to show we speak their model.
- **Before posting:** confirm the discussions surface is open to non-members;
  check DCO/CLA; consider warming up Hector Bulgarini (`@hectorest06` /
  `hbulgarini`) first per file 04, Rung 0.
- **Attach nothing** from `DIDz-Passport-Collaboration/`. If they bite, the
  next artefact is the C14 Alternative E patch (file 04, Rung 2).
- **Repo visibility (checked 2026/07/05):** didz-dapp-system, AgenticDID_io_me,
  selectConnect_app_pro, realVote, RWAz, equineProData, petProData are PUBLIC.
  midnight-modules, safeHealthData_me, KYCz_us_app, SCIFz, DownMan, GeoZ,
  huddlebridge are still PRIVATE — do NOT link them until John flips them
  public (GitHub → repo Settings → Danger Zone → Change visibility) AND they
  are scanned clean of secrets.
- **Tone check:** every "we offer / we would gladly / we are not proposing you
  adopt" is deliberate — the strategy doc's core lesson is that "conform to
  us" becomes shelfware; "useful, in your format, easy to say yes to" gets
  merged.
