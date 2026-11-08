# Winning-shape research — summary (8 Nov 2026)

Full report: ~/workspace/research_notes/celo-build-with-buy-winning-project-20261108-0633/report.md
(built into the page "How to Build a Winning Celo Project"). Web-derived; prices checked
against notes/source-buy-catalogue.md (gateway catalog verified live by the researcher).

## Judging (Loops JUDGING tab, verified live by researcher)
- Use-case quality 40% — a task a named person/business already does today; the user should
  not need to know Celo/x402/stablecoins are underneath; independent users act as qualifier.
- Depth of integration 35% — verified paid calls from the project's tagged wallet;
  repeating the cheapest call scores nothing.
- Demand created 25% — new paying counterparties and transactions from real users.
- FAQ still says "no attribution tag needed here" while JUDGING says "tagged wallet" —
  do both: ERC-8021 tag in code + wallet address + tx table in the submission.

## The field
No public leaderboard/submissions visible signed-out. Only one public entry documents
using buy at all: AR Data Agent — one service (Cencori), one category, behind a flag that
is OFF in production. Gap: no entry with 3+ categories in a live, on-by-default flow
aimed at a named non-crypto user.

## The buy basket that creates depth (verified prices, per call)
- Ploid (ERC-8004 #9898): LinkedIn company posts $0.023; LinkedIn profile posts $0.023.
- TikHub (#9895): X search $0.005; Reddit search $0.005.
- Chainstack partner route: $0.01 per request body, batch up to 2,000 RPC calls in one body.
- Sanctions/address screening: $0.002–$0.005 (via Agent402 — per-tool Celo rail UNVERIFIED;
  verify availability + rail Monday before counting it).
- Cencori partner route: $0.01 flat (model maximo-atlas-1.3).
VetBrief basket: 7 calls, 5 sellers, 4 categories, $0.078–$0.081 per brief.
Sandbox (--sandbox, Sepolia) covers gateway /v1/* free; partner routes are mainnet-only
(quote-only rehearsal). Some catalog tools are available:false — check before building on one.
buy receipts is the proof-of-payment source.

## Independent users (rules definition)
A wallet that is not yours, not first funded by you/your funder; new-to-Celo users do not
disqualify; signers count even with sponsored gas. Tactics: post the live bot in the event
Telegram (t.me/realworldagentshackathon), Celo Forum post, X post; bot trial sponsored and
capped with the requester logged per call; paid mode where callers pay themselves (point
them to the Google Cloud USA₮ faucet, Self-verified). NEVER fund user wallets yourself.
