# TASKS — VetBrief (Mon 9 Nov 2026; hard close 14:30 IST)

## Sunday build (8 Nov — done ahead of the Monday slices, at Pintu's call)
- [x] Scaffold the single-package TypeScript project: wallet.ts (attribution-wrapped
      viem client), identity.ts, buy.ts (quote → cap/allowlist → pay → receipts over the
      project-local @celo/buy CLI), sources.ts (sanctions flag OFF), brief.ts, bot.ts
      (mock mode without a token), index.ts CLI, fixture gateway for $0 runs.
- [x] Spend rails exactly per spec (per-call $0.03, per-brief $0.12, trial cap 10,
      allowlist, quote-before-pay, no blind retry) with tests: 27 passing, typecheck
      clean — including an over-cap quote refused before any payment.
- [x] Web surface (form amendment): server.ts (Express, `npm start`, PORT env) serving
      the single-page UI, POST /api/brief with per-IP rate limit + global trial cap,
      GET /api/receipts; key from env only (AGENT_PRIVATE_KEY); sandbox/no-key modes
      label output REHEARSAL. Verified locally with a mock brief through the API.
- [x] Screenshots of the live UI (desktop width) in `screenshots/` for the form's
      required 1–4 images.
- [x] Agent wallet generated (viem); key in a 600-perms file outside the repo; only the
      address reported. `buy setup --import` done for the Sepolia account (file
      keystore). MAINNET import is blocked by the CLI itself: the plaintext file
      backend refuses mainnet ("for development only") and this VM has no OS keychain —
      Monday fix: import on a machine with an OS keychain, or run buy where
      secret-service exists. Same wallet, no second wallet.
- [x] buy CLI findings recorded in SANDBOX-REHEARSAL.md: 0.8.5's global `--json` flag
      means "print as JSON", NOT a request body (bodies go via curl `--data`);
      a sandbox quote for the X search route returned $5.00 against a $0.005 catalogue
      price (sandbox pricing discrepancy — under the rails that quote is refused;
      mainnet quotes are re-checked live before any pay).
- [x] ERC-8004 Sepolia rehearsal attempted: registration flow built and run; BLOCKED at
      zero Sepolia CELO — faucet.celo.org requires sign-in + reCAPTCHA (a human step).
      Outcome recorded in `sepolia-agent.json`. Re-run `npm run identity:register-sepolia`
      after funding.
- [x] Public repo created and pushed (README marked build-in-progress where Monday
      artefacts are pending).

## Slice 0 — De-risk (09:00–09:30)
- [x] Open Pintu's logged-in Loops space; create the project, track = Build with buy,
      read EVERY submission field; note required fields in research.md.
      Done means: no unknown required field remains.
      (Done 8 Nov: required fields are only project name, description, 1–4 screenshots,
      repository URL, LIVE APP URL, AGENT WALLET — no track/Agent ID/PayTo field.)
- [ ] Verify every route in the basket: gateway catalog `available` flags for the Ploid
      and TikHub tools, Chainstack and Cencori quote responses, and the sanctions tool's
      availability + Celo settlement rail. Set the sanctions feature flag accordingly.
      Done means: the brief's call list is final.
- [x] Create public repo `github.com/pintu544/vetbrief` (README skeleton). Request the
      x402 seller API key (stretch dependency, starts its clock early).
      (Repo done Sunday 8 Nov. x402 seller key request still open — Monday.)
- [x] Generate the agent wallet (viem); key outside the repo (600 perms); print only the
      address; `buy setup --import` the same wallet. Done means: one address everywhere.
      (Done Sunday for the Sepolia buy account; mainnet import blocked by the CLI's
      file-backend policy — see the Sunday section. One wallet: 0x0d3F…4D64.)

## Slice 1 — Funding + buy pipeline (09:30–10:45)
- [ ] Fund: smallest onramp.money USDC purchase (~$5), Celo network verified in the
      widget before paying. Pintu in parallel: Self app USA₮ faucet claim.
      Done means: spendable mainnet balance visible on Celoscan.
- [ ] Build `buy.ts` (quote → cap/allowlist check → pay → receipts) and sandbox-rehearse
      the gateway calls end to end. Done means: a sandbox brief's data sections return
      with sandbox receipts, and an over-cap quote is refused in a test.

## Slice 2 — Brief + bot + identity (10:45–12:30)
- [ ] `sources.ts` + `brief.ts`: all basket calls wired, sections assembled, receipts
      file written per brief. Done means: a CLI mainnet brief on a sample counterparty
      prints with 6–7 settlement hashes resolving on Celoscan.
- [ ] Register ERC-8004 identity on mainnet via the attribution-wrapped client; agentId
      from the `Registered` event; verify on 8004scan.
- [ ] `bot.ts` live: /vet, 10-brief trial cap, requester logging, faucet help text.
      Draft the event-Telegram, Celo Forum and X posts (Pintu approves before posting).
      Done means: bot answers a test /vet from a second Telegram account.

## Slice 3 — Users + stretch (12:30–13:30)
- [ ] Post the bot (Pintu's one-tap approvals) and serve real briefs; log every
      independent requester into the receipts index.
- [ ] STRETCH, only if the x402 key arrived and settle verifies: ship `api.ts` paid
      endpoint; otherwise record it as designed-not-shipped in the README.
- [ ] Hard stop check at 13:00: no mainnet balance = stop, submit nothing, report.

## Slice 4 — Submit (13:30–14:15)
- [ ] README: named user and today's cost of the task in the first lines, how it works,
      services + proof table (buy receipts → Celoscan links), wallet, agentId, spend
      rails, honest limits, "where our users came from". Push.
- [ ] Fill the Loops form from verified mainnet artefacts only (fields: project name,
      description, 1–4 screenshots from `screenshots/`, repository URL, LIVE APP URL —
      the deployed server — AGENT WALLET address); submit; reopen and verify the stored
      state before 14:30 IST. Deploy the web app first (Render/Railway, `npm start`,
      AGENT_PRIVATE_KEY set as a platform secret) so the live URL resolves.
