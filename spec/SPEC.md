# SPEC — VetBrief (Celo, Agents on Open Rails, Build with buy)

**Problem.** Before paying or signing with a new counterparty, a founder checks them by
hand: LinkedIn, X, Reddit, wallet history, sanctions lists. VetBrief does that vetting in
one Telegram message. For each brief it buys the data and inference it does not own from
five independent sellers on Celo's buy marketplace, and proves every purchase onchain.

**Users.** Primary: a founder/ops lead vetting a client, vendor or partner (the named
user). Secondary: hackathon participants trying the live bot, and agents calling the
paid API (stretch).

## Functional requirements
1. The system SHALL run as a Telegram bot plus a CLI runner sharing one brief pipeline:
   input = a counterparty (name, plus any of LinkedIn URL, X handle, wallet address).
2. The system SHALL hold one agent wallet on Celo mainnet (42220) for buy calls,
   ERC-8004 registration and as the PayTo address.
3. The system SHALL wire the ERC-8021 attribution suffix `celo_a0202d2af02f` into its
   viem wallet client before sending any transaction.
4. The system SHALL register an ERC-8004 identity on Celo mainnet (Identity Registry
   `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432`), reading the agentId from the
   `Registered` event, never the simulated return value.
5. Per brief, the system SHALL make these paid calls through buy, each feeding the
   brief: Ploid LinkedIn company posts; Ploid LinkedIn profile posts; TikHub X search;
   TikHub Reddit search; one Chainstack batched RPC body (wallet balance, tx count,
   latest block); a sanctions screen (only if its Monday availability/Celo-rail check
   passes, otherwise the brief states it was skipped); Cencori synthesis.
6. The system SHALL enforce spend rails: per-call max $0.03, per-brief max $0.12,
   sponsored-trial cap of 10 briefs, route allowlist, quote before pay, no blind retry.
7. The system SHALL record per brief: requester, services used, amounts, settlement
   transaction hashes (from `buy receipts`), and SHALL publish the running table in the
   repo (`receipts/`) and the README.
8. The system SHALL rehearse the gateway calls in buy sandbox mode (Sepolia) before
   mainnet spend; partner routes (Chainstack, Cencori) SHALL be rehearsed by quote.
9. The submission SHALL be the public repo plus a Loops House project stating services
   used, proof of payment, wallet address, ERC-8004 agentId, and where its users came
   from, submitted before Mon 9 Nov 2026, 14:30 IST. (Form verified in the signed-in
   space 8 Nov: required fields are only project name, description, 1–4 screenshots,
   repository URL, LIVE APP URL and AGENT WALLET — there is no track, Agent ID or
   PayTo field, so those artefacts live in the README and the live app.)
10. The system SHALL provide a live web app judges can try in the browser (a required
    form field): one page where a judge can request a trial brief through the same
    pipeline and view real briefs with their receipts. The Telegram bot alone does
    NOT satisfy this.
11. STRETCH: the system MAY expose the brief as a paid x402 API endpoint where callers
    pay for their own briefs; the entry SHALL NOT depend on it.

**Deadline note (8 Nov).** The signed-in space's countdown points to 12 Nov 00:00 IST
while the public event page says 9 Nov 09:00 GMT. The entry is built to the EARLIER
target (submit by Mon 9 Nov 2026, 14:30 IST); 12 Nov is an unverified buffer only.

## Non-functional
- Brief cost $0.078–$0.081 at verified prices; total entry spend under $1 (about $5 of
  USDC purchased for headroom and minimums).
- Private key never in the repo, never printed; 600-permission file outside the repo.
- Every submitted artefact verified as mainnet (42220) on Celoscan / 8004scan.

## Judging map (published weights)
- Use-case quality 40% → FR1 (a real task a named user already does; one message in,
  one brief out; no crypto knowledge needed).
- Depth of integration 35% → FR5 (7 verified paid calls, 5 sellers, 4 categories,
  every call load-bearing in the brief).
- Demand created 25% → FR1 + FR7 (live bot used by independent requesters, each brief
  paying five sellers; requester logged per brief; paid API stretch adds paying callers).

## Out of scope
A product web UI beyond the judges' live demo page (FR10); the x402 seller flow beyond the stretch endpoint; Self Agent ID; Validation
Registry (not deployed); other tracks; funding users' wallets (disqualifying, never);
a demo video (optional, after a valid submission).
