# Sandbox rehearsal — evidence (Sunday 8 Nov 2026)

Everything below was run against the buy CLI in **sandbox mode (Celo Sepolia)** or
against the live gateway catalogue. **No mainnet call was paid. Total spent: $0.**

## Environment

- Node v24.22.1, npm 10.9.4. `@celo/buy` 0.8.5 installed project-locally
  (`node_modules/.bin/buy`), never globally.
- This VM's egress proxy URL contains credentials that the buy CLI's spawned
  `curl` rejects (`curl: (3) URL rejected: Port number was not a decimal`).
  Fix used throughout: the local egress forwarder on `127.0.0.1:8888`
  (`~/workspace/bin/egress-forwarder.py`) with `https_proxy=http://127.0.0.1:8888`.
- Gateway calls from this VM are SLOW: 60–110+ seconds per round trip through the
  proxy. That latency, not the code, is the binding constraint on rehearsal depth.

## 1. Gateway catalogue (live, mainnet)

```
curl https://gateway.usebuy.ai/v1/catalog   →  283,213 bytes, 170 capabilities
trust: chainId 42220 · Identity Registry 0x8004A169FB4a3325136EB29fA0ceB6D2e539a432
```

All four curated basket routes present with `available: true` and input schemas
matching the researched prices:

| Route | Seller | Catalogue price |
|---|---|---|
| POST /v1/social/linkedin/company/posts | Ploid (ERC-8004 #9898) | $0.023 |
| POST /v1/social/linkedin/profile/posts | Ploid (ERC-8004 #9898) | $0.023 |
| POST /v1/social/x/posts/search | TikHub (ERC-8004 #9895) | $0.005 |
| POST /v1/social/reddit/posts/search | TikHub (ERC-8004 #9895) | $0.005 |

## 2. Wallet + buy account

```
npm run wallet:generate   →  Agent wallet address: 0x0d3F22CaD8e5D1CeD980f1511E14544320464D64
                             (key written only to a 600-perms file outside the repo)

buy setup --import --name vetbrief            (file backend, mainnet)
  → ERROR signer_backend_unavailable: "mainnet is not supported; the plaintext
    file backend is for development only"

buy setup --import --name vetbrief --network sepolia   (file backend)
  → ✓ created account vetbrief · network: sepolia
    address: 0x0d3F22CaD8e5D1CeD980f1511E14544320464D64 (imported)

buy --sandbox --account vetbrief whoami
  → vetbrief on celo-sepolia · pays from 0x0d3F22CaD8e5D1CeD980f1511E14544320464D64 (imported key)
    (the balance read then timed out against forno.celo-sepolia — see §5)
```

Consequence for Monday: the mainnet buy account must be imported on a machine
with an OS keychain (the CLI's default backend). Same wallet — do NOT generate
a second one.

## 3. CLI semantics finding (cost an hour; read this first on Monday)

In @celo/buy 0.8.5 the **global `--json` flag means "print the result as JSON"**,
not "this is the request body". Passing a body after `--json` leaves it as a bare
positional argument, which the CLI's probe curl then parses as a second URL and
rejects (`Port number was not a decimal`). Request bodies go via curl's own
flags: `--data '<json>' -H 'Content-Type: application/json'` (what `buy.ts` does).

## 4. Sandbox quote + pay attempt

```
buy --sandbox --account vetbrief quote -X POST \
  https://gateway.usebuy.ai/v1/social/x/posts/search \
  -H 'content-type: application/json' -d '{"query":"Celo","type":"latest"}'

→ (after 107 s) 402 Payment Required
  Amount: $5.00
  Network: celo-sepolia · Token: USDC · Recipient: 0xC2… (gateway)
```

**Price discrepancy, recorded honestly:** the sandbox quote is **$5.00** against a
$0.005 mainnet catalogue price for the same route. Sandbox settlement uses test
funds, so the sandbox price is nominal; either way, VetBrief's rails treat any
quote above $0.03 as refuse-before-signing, and mainnet quotes are re-checked
live on Monday before any payment.

A full pay attempt through the project's own wrapper (`BuyGateway.pay`, quote →
rail check → pay) was then run: the quote call inside it failed on a CLI/curl
timeout through the slow proxy before any payment step. `spentUsd: 0`. No blind
retry was made (spec FR6). The pipeline's pay path is instead proven end-to-end
in mock mode (§6) and the rails' refusal behaviour is unit-tested.

## 5. RPC endpoints

- `https://forno.celo-sepolia.celo-testnet.org` — repeated 60 s timeouts from this VM.
- `https://rpc.ankr.com/celo_sepolia` — answers instantly (block + balance reads used
  for the ERC-8004 rehearsal). `CELO_SEPOLIA_RPC_URL` env override exists in
  `wallet.ts` for exactly this.
- Mainnet Forno was not needed today (no mainnet transactions permitted).

## 6. End-to-end pipeline (mock gateway, $0)

- `npm test` — 27 passing (spend rails incl. over-cap refusal, brief assembly from
  fixtures, receipts + trial ledger, bot core, web server incl. rate limit and
  trial cap), `npm run typecheck` clean.
- CLI mock run: `npm run vet -- "Acme Corp" --linkedin acme-corp --profile … --x @acmecorp --wallet 0x1111… --mock`
  → full brief, 6 bought calls + sanctions honestly skipped, total $0.076, receipt written.
- Web app (amendment surface): `npm start` (BUY_MODE=mock, PORT=3000):
  - `GET /` → 200, single-page UI; `GET /api/status` → `{"mode":"mock","rehearsal":true,…}`
  - `POST /api/brief` (Acme Corp, all identifiers) → brief JSON, total $0.076,
    6 bought + 1 skipped; `GET /api/receipts` → the brief listed with explorer links.
  - Screenshots in `screenshots/` (1440 px wide): `01-landing.png`,
    `02-brief-result.png`, `03-receipts.png` — all labelled REHEARSAL, as the
    outputs are. Server killed by exact PID after capture; port verified free.

## 7. ERC-8004 rehearsal (Celo Sepolia)

```
npm run identity:register-sepolia   (Ankr RPC override)
→ Sepolia wallet: 0x0d3F22CaD8e5D1CeD980f1511E14544320464D64
  Sepolia CELO balance: 0
  BLOCKED: zero Sepolia CELO.
```

The registration code path is complete (attribution-wrapped client, register(),
agentId from the `Registered` event) and ran up to the balance check. Funding
routes that need no human were tried: the gateway sandbox fund endpoint returned
nothing for a bare address POST, and https://faucet.celo.org/celo-sepolia
requires account sign-in + reCAPTCHA — a human step (recorded in
`sepolia-agent.json` as `blocked-zero-balance`). After any Sepolia CELO lands,
re-run the same command; no code change is needed.

## 8. Partner routes (Chainstack, Cencori) — quote-only rule

Not paid (mainnet-only, and mainnet spend is out of bounds today). Their prices
($0.01 each) come from the gateway's partner-route documentation captured in
`spec/research-winning.md`; the routes are allowlisted in `src/config.ts`, and
Monday's flow re-quotes them live before paying, under the same rails.
