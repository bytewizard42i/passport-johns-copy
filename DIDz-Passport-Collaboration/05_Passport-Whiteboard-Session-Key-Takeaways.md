# Passport Whiteboard Session — Key Takeaways & Cross-Pollination

Distilled from `references/Passport-Product-Presentation-Whiteboard-Transcript-2026.md`
(Charles Hoskinson intro; Karmel product lead; Hector technical demo). Captured 2026-07-04.

---

## 1. New / confirmed facts

- **Ambition:** Passport is Midnight's **first billion-user product**, "Tier 1," framed by
  Charles as "the missing piece to the entire cryptocurrency ecosystem."
- **Team confirmed:** **Karmel ("Carmel") is the product lead**, backed by **ARC ("Ark")**
  and cryptographers. **Hector** runs the technical demo. Resolves our earlier
  product-lead ambiguity (see README contacts).
- **NightForce = first beta testers / vanguard** (alongside Decrypt, Midnight City, Offer
  Files). John is NightForce Bravo, so we are explicitly invited to break/enhance it.
- **Three market trends driving Passport:** (1) Web3 top-of-funnel/onboarding problem,
  (2) agentic AI & agentic commerce, (3) the identity shift (airport biometrics,
  age-verification regulation).
- **Three abstractions:** Account Creation & Ownership, Account Abstraction, Chain
  Abstraction.
- **Four personas:** Individual, Managed Persona, Enterprise, Agent.
- **UX targets:** account creation **< 60 seconds**, first transaction **< 2 minutes**,
  "hear about it to running" **< 1 minute**. Face ID / passkeys, no seed phrase.
- **Alias** hides desk / unshielded / shielded addresses **and** managed ETH/BTC addresses
  (chain abstraction).
- **Names:** claim `hector.night`, `charles.night` instead of raw addresses.
- **On-chain:** a **compact smart contract instance** holds identity, manages multi-device
  keys, and handles app permissions; assets flow into an **account custody contract**.
- **SDK** ships bridging + account setup + recovery **out of the box**.
- **Credentialing:** issue verified credentials on-chain, ZK selective disclosure (prove
  "accredited investor" / "over 18"), credential **stored on device**.
- **Recovery:** revoke-and-continue on device loss; social recovery; secure cloud backup;
  total-loss recovery, no seed phrase.
- **Security framing (Charles):** CIA triad (Confidentiality, Integrity, Availability);
  phone biometrics + trusted execution hardware as building blocks; user in the driver's
  seat.
- **Contingent settlement:** a business transaction can sit in **"pending"** until criteria
  (ZK proofs, contract signatures) are met — built-in audit trail.

## 2. Agentic commerce (the big one for us)

- **Explorer 2** initiative/foundation: **160 million agent payments** processed in under a
  year. (Cross-reference the emerging **AP2 / Agent Payments** direction.)
- **Two missing pieces Passport targets:**
  1. **Principal Privacy** — the agent proves it is authorised by a real human and has a
     defined scope (spending limits, duration), **without publishing the human's identity
     on-chain**.
  2. **Legal Compliance** — agent transactions comply with legal context.
- **Flow:** human signs a **mandate** granting scope (e.g., DeFi budget $10,000) → agent
  proves "I am this human's agent" privately → each request is evaluated against the
  **pact**: in-scope settles, out-of-scope is rejected.
- **Agents as first-class citizens;** agents resist phishing because they verify signatures
  and cryptographic proofs (humans misread characters). **ZK provides provability of
  intention.**

## 3. What this validates in the DIDzM ecosystem

| Passport point | Our prior art it validates |
|---|---|
| Agent = persona with mandate + scope + principal privacy | **AgenticDID** — this is essentially AgenticDID's thesis, now on Midnight's roadmap |
| Midnight DID + credentialing + selective disclosure | **DIDz.io** + **KYCz** |
| Credential stored on device, prove-the-minimum | **DIDz.io binary ZKQuery** |
| Recovery without seed (social / cloud / total-loss) | **John's m-of-n soulbound recovery vision** (file `01`) |
| Contingent settlement (pending until ZK criteria) | **SCIFz** gating; escrow patterns |
| Names (`x.night`) | **DIDz.io / C2 name service** |

## 4. Cross-pollination performed (2026-07-04)

- **AgenticDID:** added `docs/PASSPORT_AGENTIC_COMMERCE_ALIGNMENT.md` — mandate/pact,
  principal privacy, scope (spend limit + duration), Explorer 2 / 160M payments,
  first-class agents, contingent settlement.
- **DIDz.io:** added `docs/PASSPORT_IDENTITY_CREDENTIAL_ALIGNMENT.md` — Midnight DID,
  credentialing, selective disclosure, alias/name, recovery, four personas.
- **DIDzM KB:** updated `monolith-docs/midnight/MIDNIGHT_PASSPORT_ALIGNMENT.md` with these
  facts + confirmed contacts; timeline entry appended.
- **This fork:** transcript preserved in `references/`; contacts in `README.md` updated
  (Karmel = product lead).

## 5. Where it feeds our first PR

- The **agentic mandate/pact + principal privacy** model is a strong candidate to align
  with a future agent-authorisation MIP and reinforces our recovery (MIP-4) and
  credentials (MIP-6) contributions. See `04_First-PR-to-Passport-Origin-Strategy.md`.

_Last updated: 2026-07-04._
