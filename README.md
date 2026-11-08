# VetBrief

**For a founder or ops lead about to pay a new vendor, freelancer or partner.**
Today that check costs you half an hour of tab-hopping — LinkedIn, X, Reddit, a
block explorer — and you still mostly go on gut. VetBrief does it in one request:
send a company name, get back a one-page brief with a verdict, where **every fact
was bought live from an independent data seller and every purchase is provable
onchain**.

Built for Celo — Agents on Open Rails, **Build with buy**.

> **Build status (Sunday 8 Nov 2026):** the full system is built and verified in
> sandbox/mock rehearsal — see `SANDBOX-REHEARSAL.md`. Mainnet artefacts marked
> PENDING below land on Monday 9 Nov after funding, before the 14:30 IST close.

## Try it

- **Live app (judges):** PENDING DEPLOY — one Node service from this repo
  (`npm start`, `PORT` env). Locally: `npm start` then open http://localhost:3000.
  A judge enters a counterparty, runs a trial brief through the same pipeline,
  and sees real briefs with their receipts and Celoscan links.
- **Telegram bot:** PENDING BotFather token — `/vet <Company Name>` with optional
  `linkedin=`, `profile=`, `x=`, `wallet=` parts.
- **CLI:** `npm run vet -- "Acme Corp" --linkedin acme-corp --x @acmecorp --wallet 0x…`
  (`--mock` runs the whole pipeline on fixtures for $0.)

## What a brief buys

Each brief makes up to 7 paid calls through the buy marketplace, each one
load-bearing in the output — nothing is bought for show:

| # | Call | Seller | Price | Feeds |
|---|---|---|---|---|
| 1 | LinkedIn company posts | Ploid (ERC-8004 #9898) | $0.023 | Who they are |
| 2 | LinkedIn profile posts (the principal) | Ploid (ERC-8004 #9898) | $0.023 | The principal in public |
| 3 | X posts search | TikHub (ERC-8004 #9895) | $0.005 | Public voice on X |
| 4 | Reddit posts search | TikHub (ERC-8004 #9895) | $0.005 | Reddit mentions |
| 5 | Batched Celo RPC read (balance, tx count, block) | Chainstack (partner route) | $0.010 | Onchain footprint |
| 6 | Sanctions / address screen | Agent402 (per-tool rail unverified) | ~$0.002–0.005 | Risk flags — **skipped, and the brief says so, until its Celo rail is verified** |
| 7 | Synthesis over the bought evidence | Cencori (partner route) | $0.010 | Verdict |

**Total per full brief: $0.076** (6 calls today; $0.078–0.081 with the screen).
Sources with nothing to buy (no profile supplied, no wallet given) are skipped
and listed in the brief under "Not bought, and why" — a brief never silently
presents unbought claims.

## Proof of payment

PENDING MAINNET — after Monday's funded runs, this table is generated from
`buy receipts` and each brief's receipt JSON in `receipts/`:

| Brief | Requester | Services | Total | Settlements |
|---|---|---|---|---|
| _(Monday)_ | | | | |

Rehearsal proof (sandbox/mock, $0 spent) is in `SANDBOX-REHEARSAL.md`.

## Identity

- **Agent wallet (also the form's AGENT WALLET field and the PayTo address):**
  `0x0d3F22CaD8e5D1CeD980f1511E14544320464D64`
- **ERC-8004 agentId:** PENDING — mainnet registration on Identity Registry
  `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432` happens Monday after funding;
  the agentId is read from the `Registered` event, never the return value.
  The Sepolia rehearsal of the identical flow is built and run; it is blocked
  only on testnet CELO (the faucet needs a human sign-in) — see
  `sepolia-agent.json`.
- **Attribution:** every transaction the agent sends carries the ERC-8021
  suffix `celo_a0202d2af02f`, wired into the viem wallet client via
  `@celo/attribution-tags` before the first transaction, in the only sending
  path (`src/wallet.ts`).

Note: the Loops submission form has no field for the agentId or the proof
table (verified in the signed-in space, 8 Nov — its fields are project name,
description, screenshots, repository URL, live app URL, agent wallet), so both
live here and in the live app, as the form intends.

## Spend rails (a feature, not a footnote)

All payments flow through one wrapper (`src/buy.ts`). Nothing else in the
codebase can pay.

- Per-call max **$0.03**; per-brief max **$0.12** — enforced against the **live
  quote**, before signing. (In rehearsal a sandbox quote of $5.00 for a $0.005
  route was refused by exactly this rail.)
- **Quote before pay**, always; **no blind retries** — a failed call fails the
  brief loudly rather than half-buying it.
- **Route allowlist** — only the 7 basket routes can ever be paid.
- **Sponsored trial cap: 10 briefs**, shared by the bot and the web app, with a
  per-IP rate limit on the web surface. After the cap, briefs are paid from the
  requester's own wallet — we never fund user wallets (that would also
  disqualify them as independent users).

## Where our users came from

PENDING MONDAY — the bot and live app launch into the event's own channels
(event Telegram, Celo Forum, X) on Monday morning; every requester is logged
per brief in `receipts/` and summarised here at submission time.

## Honest limits

- A brief is public-footprint diligence, not a credit check or a background
  check. A clean brief means "no flags in the bought sources", nothing more.
- Public sources can be gamed; the verdict weighs consistency across
  independent sellers, which is harder to fake than any single profile.
- The sanctions screen is off until its settlement rail is verified; briefs
  state the skip rather than implying a clear screen.

## Run it yourself

```bash
npm install
npm test            # 27 tests: rails, brief assembly, receipts, bot, web server
npm run typecheck
npm start           # web app on $PORT (default 3000)
npm run bot         # Telegram bot (mock mode without TELEGRAM_BOT_TOKEN)
npm run vet -- "Acme Corp" --mock
```

Configuration is environment-only (`.env.example`): `AGENT_PRIVATE_KEY` for a
deployed mainnet service (platform secret store — never committed), `BUY_MODE`
(`sandbox` default, `mainnet`, `mock`), `PORT`, `RECEIPTS_DIR`,
`TELEGRAM_BOT_TOKEN`, `SANCTIONS_ENABLED` (default false).

## Layout

`src/wallet.ts` (only sending path, attribution-wrapped) · `src/identity.ts`
(ERC-8004) · `src/buy.ts` (the only payment path, rails inside) · `src/sources.ts`
(one function per bought input) · `src/brief.ts` (pipeline + assembly) ·
`src/bot.ts` (Telegram) · `src/server.ts` + `public/` (live web app) ·
`src/index.ts` (CLI) · `spec/` (the approved spec pack this was built from) ·
`receipts/` (per-brief proof) · `screenshots/` (form images).
