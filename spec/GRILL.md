# GRILL — Celo Agents on Open Rails (Build with buy) — VetBrief shape

REVISED 8 Nov 2026 after the winning-shape research (spec/research-winning.md).
Supersedes the BuyScout draft. Deadline: Mon 9 Nov 2026, 14:30 IST. Build: Monday morning.

**Q1. What is the one demo that proves it works?**
A live Telegram bot: someone sends a company name, gets back a one-page due-diligence
brief, and the repo shows the receipt table for that exact brief — 7 paid calls, 5 sellers,
every settlement hash resolving on Celoscan — plus the agent's ERC-8004 identity on 8004scan.

**Q2. Who is the named user (Use-case, 40%)?**
A founder or ops lead vetting a counterparty before money moves — a new client, vendor or
partner. Today they Google the firm, skim LinkedIn and X, and guess. VetBrief does that
task in one message; the user never needs to know Celo, x402 or stablecoins are underneath.

**Q3. What does one brief buy, exactly?**
Seven calls, each feeding the brief (Depth, 35% — spam scores nothing):
Ploid LinkedIn company posts ($0.023) + Ploid LinkedIn profile posts ($0.023) +
TikHub X search ($0.005) + TikHub Reddit search ($0.005) +
Chainstack batched Celo RPC wallet read ($0.01, one body) +
sanctions screen ($0.002–$0.005, availability/Celo rail verified Monday first) +
Cencori synthesis ($0.01). Total $0.078–$0.081 per brief, 5 sellers, 4 categories.
If the sanctions route fails its Monday check, the brief ships at 6 calls and says so.

**Q4. Which surfaces?**
Telegram bot is the shipped surface (free trial, sponsored, capped, requester logged per
brief — that log is the Demand evidence, 25%). A paid x402 API endpoint where callers pay
for their own briefs is a stretch slice only: it needs a seller API key from x402.celo.org,
requested first thing Monday; if it stalls, bot-only ships and the README says so.

**Q5. Wallet, key, attribution?**
One wallet for buy calls, ERC-8004 registration and PayTo. Generated externally with viem
(buy key export is UNVERIFIED), imported into buy. Key outside the repo, 600 perms, never
printed. ERC-8021 attribution suffix (celo_a0202d2af02f) wired into the viem client BEFORE
the first transaction — it cannot be backfilled. Submission also states the wallet address
and the tx table (FAQ vs JUDGING contradiction: do both).

**Q6. Funding, given Pintu has no wallet and no crypto?**
Primary: smallest onramp.money USDC purchase delivered on the Celo network to the agent
wallet (network + INR/UPI verified in the widget BEFORE paying). Budget: buy about $5 of
USDC — roughly 60 briefs of headroom; actual spend target under $1. Parallel, Pintu-only:
Self app USA₮ faucet claim as backup. Hard stop: no spendable mainnet balance by 13:00 IST
Monday means no valid entry; we stop, we never file testnet artefacts.

**Q7. Spend rails?**
Per-call max $0.03, per-brief max $0.12, sponsored-trial cap 10 briefs total, gateway-route
allowlist only, quote before every pay, no blind retry on a failed paid call.

**Q8. How do independent users happen, honestly?**
The bot goes live before the submission, posted in the event Telegram, the Celo Forum and
X (drafts prepared by Muse, posted on Pintu's one-tap approval). Participants' wallets are
textbook independent users; trial briefs are sponsored by the agent (signers count even
with sponsored gas) and every requester is logged. Paid-mode users fund themselves via the
USA₮ faucet link in the bot's help text. We never fund a user wallet — that would
disqualify the user and we will not do it.

**Q9. Stack and layout?**
Single-package TypeScript, Node 24 (verified here; buy needs 22+). viem (celo 42220) +
@celo/attribution-tags + @celo/buy CLI wrapper + a Telegram bot library. No database;
state is files (agent.json, receipts per brief). Repo: github.com/pintu544/vetbrief, public.

**Q10. Honest expectation and out of scope?**
This shape takes validity off the table as a worry and competes on all three criteria,
which no public entry currently does. A prize still needs real independent users before
14:30 — achievable via the event Telegram, not guaranteed, and never manufactured.
Out of scope: web UI, selling anything beyond the stretch API, Self Agent ID, other tracks,
a demo video (optional, only after a valid submission is stored).
