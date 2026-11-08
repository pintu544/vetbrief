# Deployment

## Canonical runtime

One long-lived Node service: `npm start` (Express, `PORT` env) — see
`src/server.ts`. This is the runtime the spend rails, sandbox/mainnet
modes and receipts persistence are designed for (Render/Railway style).

## Vercel (live demo URL for the Loops House submission)

**Live: https://vetbrief-nine.vercel.app** (deployed 8 Nov 2026;
verified: `/` serves the UI, `/api/status` reports `mode: mock`,
`rehearsal: true`, and a rehearsal `POST /api/brief` returns a full
brief with its proof-of-payment table).

Added 8 Nov 2026 because Railway auth was unavailable (stale CLI login;
stored token rejected) and a public LIVE APP URL was needed the same day.

- `api/index.ts` — serverless entry that wraps the **same** Express app
  from `src/server.ts` (`createApp`). No logic is duplicated; if fixture
  JSONs cannot be read in the function bundle it falls back to an empty
  fixture gateway so `/api/status` still answers honestly.
- `vercel.json` — rewrites `/api/*` to that function, serves `public/`
  as the static UI, and force-includes `fixtures/**` in the function
  bundle.
- Env (production + preview): `BUY_MODE=mock` (REHEARSAL, fixture
  gateway, $0 spent), `RECEIPTS_DIR=/tmp/receipts` (function filesystem
  is read-only apart from /tmp, so receipts/ledger are ephemeral per
  instance), `AGENT_WALLET_ADDRESS` = the agent's public address.
- **No `AGENT_PRIVATE_KEY` is set on Vercel.** Mainnet mode never runs
  from this deployment; it belongs on the long-lived host.
