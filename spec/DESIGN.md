# DESIGN — VetBrief

**Architecture (one package).**
- `wallet.ts` — loads the agent key from outside the repo; builds the viem wallet client
  on celo (42220) extended with `withAttribution` (@celo/attribution-tags,
  `celo_a0202d2af02f`). The only sending path in the system.
- `identity.ts` — ERC-8004 registration: registration JSON carried as a `data:` URI
  (spec-legal, no hosting dependency; the repo also holds registration.json), services
  list the bot and the wallet, `register(agentURI)` on the Identity Registry,
  agentId parsed from the `Registered` event, artefacts written to `agent.json`.
  USDC `feeCurrency` if the CELO balance is zero.
- `buy.ts` — wrapper over @celo/buy CLI: quote → allowlist + cap check → curl pay →
  receipts resolve. This is the ONLY way brief code pays for anything; caps cannot be
  bypassed by a caller.
- `sources.ts` — one function per bought input (ploidCompany, ploidProfile, tikhubX,
  tikhubReddit, chainstackWalletRead, sanctionsScreen, cencoriSynthesize), each returning
  brief sections plus its payment record. Sanctions sits behind a feature flag set by
  the Monday availability check.
- `brief.ts` — assembles sections into the one-page brief: who they are, public voice,
  onchain footprint, risk flags, verdict line — every claim tied to a bought source.
- `bot.ts` — Telegram bot: /vet command, trial counter (10 sponsored briefs), requester
  logging, help text pointing paid users to the USA₮ faucet. `index.ts` — CLI runner
  with the same pipeline for Muse's own proof runs.
- `server.ts` — Express server, the judges' live app (required by the form): serves an
  Impeccable-standard single-page UI (request a trial brief, view real briefs and the
  receipts table with Celoscan links), POST /api/brief over the same pipeline (same
  spend rails + per-IP limit + global trial cap), GET /api/receipts. Agent key from env
  only; sandbox/no-key mode labels outputs as rehearsal. One Node service deploy
  (Render/Railway), `npm start`, PORT env. Screenshots for the form come from this UI.
- Stretch `api.ts` — x402 paid endpoint over the same pipeline (seller API key from
  x402.celo.org); shipped only if the key and settle flow work by 12:30.

**Data model.** Files only: registration JSON; `agent.json` (wallet, agentId, registry);
`receipts/<brief-id>.json` and a cumulative `receipts/INDEX.md` table (requester,
services, amounts, tx hashes, Celoscan links) rendered into the README at submit time.

**Key decisions.**
- Bot first, API stretch: the bot is the fastest surface a non-crypto user can actually
  use, and the trial log is the Demand evidence; the seller-side x402 flow has a key
  dependency outside our control (research §3.4 of spec/research.md).
- All payments through one capped wrapper: Depth is judged on verified calls, and the
  rails (caps, allowlist, quote-first, no blind retry) are themselves a README feature.
- Sanctions behind a flag: its Celo rail is UNVERIFIED per-tool; the brief is complete
  at 6 calls and honest about the skip.

**Risks and de-risking.**
1. Funding never lands. Wallet first, onramp attempt in the first hour (network verified
   before paying), Self claim in parallel, sandbox rehearsal regardless; 13:00 hard stop.
2. A named route is `available:false` or the sanctions rail is not Celo. Checked in
   Slice 0 before any code depends on it; sources are modular, one drop does not break
   the brief.
3. Submission form has an unknown required field. First 15 minutes Monday: open the
   logged-in space, create the project, read every field.
4. No independent users by 14:30. Bot live by ~12:30, posts drafted during the build and
   posted on Pintu's approval the moment the bot is live; trial cap sized so the budget
   survives real interest.
