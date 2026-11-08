# Celo — Agents on Open Rails: Research

- **Event:** Agents on Open Rails Hackathon, Loops House × Celo Core Co.
- **Event page:** https://www.loops.house/agents-on-open-rails
- **Builder:** Pintu Kumar, enrolled. **Attribution tag: `celo_a0202d2af02f`** (issued at enrolment).
- **Deadline (registration AND submission): Mon 9 Nov 2026, 09:00 GMT = 14:30 IST.** Winners announced Fri 13 Nov 2026.
- **Date checked for everything below: Sunday 8 Nov 2026.**
- Anything not confirmed from a source is marked **UNVERIFIED**. Nothing in this file is implementation code.

---

## TL;DR — the shape of a valid Monday entry

A *valid* (not necessarily competitive) entry needs, in this order:

1. A **public GitHub repo** that exists at registration/judging time (create it first thing Monday).
2. An **agent wallet on Celo mainnet, funded** — this is the critical path (see §5). Pintu has **no EVM wallet and no crypto at all** today.
3. An **ERC-8004 Agent ID** registered on Celo mainnet — required for *every* track; "your project will only be valid with an ERC-8004 identity."
4. The **attribution tag wired into the transaction-building code before the first transaction** — it cannot be backfilled; untagged transactions do not count.
5. For the intended track, **Build with buy**: at least one *real, verified paid call* from the agent into a service it does not control (via `buy` / x402 on Celo mainnet), with the services used and proof of payment stated in the submission.
6. A **Loops House project submission** before 14:30 IST (exact form fields for this event: **UNVERIFIED**, see §1.5).

**Biggest honest warning:** validity is achievable in a morning; *competitiveness* mostly is not. Build with buy is judged on verified paid calls **and independent users as a qualifier** — a wallet that is yours, or first funded by you/your funder, does **not** count as an independent user, and "spamming the cheapest call scores nothing." A solo builder self-funding a fresh wallet on Monday morning will have zero independent users. Expect a valid submission and a Builder Graph / Certify credential, not a prize, unless a genuinely independent user transacts.

---

## 1. Event rules (Loops House event page)

Source for this whole section unless noted: https://www.loops.house/agents-on-open-rails (checked 8 Nov 2026).

### 1.1 Tracks — three tracks, $5,000 total (exact names)

| Track | What it requires | Prizes |
|---|---|---|
| **Stable Agents: LatAm** (Ripio × Celo Core Co.) | Agents that charge, pay, save and settle **directly in Ripio local-currency stablecoins** — wARS, wBRL, wMXN, wCOP, wPEN, wCLP. Payroll, subscriptions, remittances, merchant tools that never leave local currency. | 🥇 $1,500 · 🥈 $500 |
| **Stable Agents: Open Corridors** — subtrack **Textile FX** | Agents that quote and settle FX on **Textile** (permissionless onchain FX marketplace; cNGN, wARS, wBRL, USDC against USD₮): smarter pricing, or treasury agents managing a business's currency exposure. | 🥇 $750 · 🥈 $250 |
| **Stable Agents: Open Corridors** — subtrack **USA₮ with x402** | Products with **real users settling USA₮** through Celo's hosted x402 facilitator. | 🥇 $750 · 🥈 $250 |
| **Build with buy** | "Solve a real problem with a product that pays for services it doesn't own, from compute and browsers to data and inference." Uses **buy** (usebuy.ai), Celo's agent service marketplace (700+ services; partners Chainstack, Cencori, SQD). | **$1,000 across 5 projects** (so effectively $200 each if split evenly — the page does not state the per-project split; the even split is an inference, marked as such) |

Prize total check: $2,000 + $1,000 + $1,000 + $1,000 = $5,000. Plus non-cash: every team gets **3 months of Chainstack Growth Plan free**; Prezenti grant consideration ($165K season pool; hackathon performance adds to the track record, it is not a prize).

**The intended track "Build with buy" is the correct exact name** — verified on the event page.

You may enter as many tracks as you want; a team can win only one prize per track. If a project fits no track, enter the closest and say so in the submission.

### 1.2 Hard rules (verbatim substance from the event FAQ, "What are the rules?")

- **Celo mainnet only** (testnet references in the repo are fine).
- **Public GitHub repo at registration, which still resolves at judging.**
- **Sponsored gas is not builder contribution.**
- **Attribution tag must be implemented.**
- **Code is written during the hackathon.**
- **No particular agent framework is required** ("Any framework works. What matters is what happens onchain and whether a real person uses it.").
- Every track is **scored on real onchain activity**; each track is scored by a published query and a live leaderboard runs on that same query; a **human panel makes the final call** using query data plus the Loops judge's reading of the repository.

### 1.3 Judging criteria per track

- **Stable Agents: LatAm** (five Ripio criteria): works on mainnet with a real wFIAT token; makes real use of wFIAT and the Celo stack; agent is autonomous and useful; a real person can use the UX; impact for LatAm is clear.
- **Open Corridors, Textile FX:** strategy P&L, volume quoted and filled, originality.
- **Open Corridors, USA₮ over x402:** real settlement between **independent parties**, currency choice justified by the user it serves.
- **Build with buy:** the problem you solve + depth of integration = **verified paid calls from your tagged wallet into services you don't control**, and the growth they create for those services. **Independent users are a qualifier. Spamming the cheapest call scores nothing.** Submission must **state what services you are using and provide proof of payment. "No attribution tag needed here"** (this sentence is in the Build-with-buy judging FAQ — see the contradiction note in §1.4).

**Definition of an independent user (all tracks):** a wallet that is not yours, was not first funded by you or your main funder, and had its own activity on Celo before the hackathon started. Wallets that exist only because you created and funded them do not count. Onboarding brand-new users is explicitly welcomed and "measured in other ways," and sponsored-gas users still count as signers/authorisers — but the self-funded-wallet exclusion is explicit.

### 1.4 Attribution tag — how it must be used

Sources: event page FAQ (above); Celo Docs, Attribution Tags, https://docs.celo.org/build/agents/attribution-tags (checked 8 Nov 2026); SDK repo https://github.com/celo-org/attribution-tags.

- The tag is a short **ERC-8021** code (Pintu's: `celo_a0202d2af02f`) that the app **appends as a suffix to the calldata of every transaction it sends**. The EVM discards trailing calldata bytes, so it never changes execution; off-chain readers use it to credit the transaction to the app.
- It goes **in the code that builds and sends transactions** (frontend or agent backend), **not in a smart contract**.
- **It cannot be added retroactively.** Transactions sent without it cannot be counted. Wire it in *before the first transaction of any kind* — including, ideally, the ERC-8004 registration and any funding/test transfers the agent itself sends.
- Tooling: npm package **`@celo/attribution-tags`**. Patterns documented by Celo and seen in a live hackathon entry (AR Data Agent, another Open Rails entry, checked 8 Nov 2026 via https://glama.ai/mcp/servers/landingen24h/ar-data-agent):
  - viem: extend the wallet client once with `withAttribution(...)` from `@celo/attribution-tags`, so every transaction the client sends carries the code.
  - wagmi: pass `dataSuffix` to the write call; wagmi concatenates it.
  - Manual: concatenate the ERC-8021 suffix onto the encoded calldata.
  - If a program issued the code (hackathon registration did), pass that exact code — leaderboards only credit the assigned code, not a self-derived one.
- **x402 exception:** x402 settlements are submitted by the facilitator, not your wallet, so you cannot append the suffix. Attribution for x402 is via (a) your **PayTo wallet address**, which the organisers explicitly ask for, and (b) an ERC-8021 Schema-2 `builder-code` extension (`{ a: "celo_…" }`) in the 402 response, which Celo Docs says is *declared now but ignored until the facilitator update ships* (applies to x402 v2 only). So for a Build-with-buy entry, **the PayTo/agent wallet address is the attribution that actually works today**.
- **Contradiction to note honestly:** the general rules say "Attribution tag must be implemented," while the Build-with-buy judging FAQ says "No attribution tag needed here" and asks for proof of payment instead. Safest reading: implement the tag in the agent's own transaction code anyway (cheap, one wrapper) **and** state services + proof of payment in the submission. Do not rely on the "not needed" line to skip it entirely.

### 1.5 Submission requirements — what is verified vs not

Verified from the event page / rules:

- Public GitHub repo (required, must resolve at judging).
- ERC-8004 Agent ID (required for validity, every track).
- For x402-based activity: the **PayTo wallet address** must be supplied to the organisers.
- For Build with buy: submission must **state the services used and provide proof of payment** (e.g. settlement transaction hashes / Celoscan links — the exact format is not prescribed on the public page).
- Deadline: submit by **Mon 9 Nov 2026, 09:00 GMT (14:30 IST)**; the repo is read by the judging panel, so the README is part of the submission in practice.

**UNVERIFIED — the exact submission form fields for this event.** The public event page does not list the submission form fields, and the submit/playground flow sits behind a Loops House login (this research is signed-out by design, and Pintu's own login is his step). What is known from the Loops House platform pattern in *other* Loops hackathons (public skill files on GitHub for other Loops events, e.g. https://github.com/Gautam5328/codex-hackathon — checked 8 Nov 2026): a Loops "project" is the submission, created/updated with fields **name, tagline, pitch, description, repoUrl, demoUrl, videoUrl, and track/bounty selection**. Treat that field list as **the platform's generic pattern, UNVERIFIED for Agents on Open Rails specifically**. The parent agent should confirm the actual fields in Pintu's logged-in hackathon space on Monday before the build is finalised, because a required field discovered at 14:00 IST would be a deadline risk.

- **Demo video: no requirement found.** Nothing on the event page requires a demo video. The generic Loops project model has a `videoUrl` field, which suggests video is *supported, probably optional* — **UNVERIFIED for this event**. Do not plan a video as mandatory; if time remains after a valid submission, a short video can only help the human panel.
- **Demo/live link:** likewise not stated as required on the public page; the generic Loops model has a `demoUrl` field — **UNVERIFIED for this event**. A live URL is cheap insurance if the build produces one naturally (see §4), but do not let deploying a UI eat the morning if the agent + onchain proof is the substance.

### 1.6 Support / resources named by the event

- Hackathon Telegram: t.me/realworldagentshackathon; weekly Office Hours Thursdays 12:00 GMT (already past for this window — the last one was 5 Nov).
- Resource list: Celopedia (celopedia.celo.org), x402.celo.org, usebuy.ai + celo-org/buy-skill (GitHub), Textile FX (app.textilecredit.com), 8004scan.io, celo-org/attribution-tags, Chainstack, docs.celo.org.
- Build-with-buy livestream (13 Oct, with Cencori, Chainstack, SQD) is linked from the event page's timeline on YouTube.

---

## 2. ERC-8004 — agent identity on Celo

Sources: Celo Docs, ERC-8004: Agent Trust Protocol, https://docs.celo.org/build/agents/8004 (checked 8 Nov 2026); EIP-8004 spec, https://eips.ethereum.org/EIPS/eip-8004; community skill with on-chain-verified addresses, https://github.com/den-labs/agent-skills/blob/HEAD/skills/erc8004-celo/SKILL.md (checked 8 Nov 2026).

### 2.1 What it is

ERC-8004 ("Trustless Agents") is a **Draft** EIP (created Aug 2025) that gives AI agents a trust layer across organisational boundaries: discovery, identity, and reputation. It defines three per-chain singleton registries:

| Registry | What it does | Status on Celo |
|---|---|---|
| **Identity Registry** | Each agent identity is an **ERC-721 NFT**. `agentURI` points to a hosted JSON registration file listing the agent's name, description, service endpoints (web, A2A, MCP, OASF, ENS, DID, email, wallet — examples, not a closed list), and `x402Support`. | **Deployed** |
| **Reputation Registry** | Anyone *except* the agent's owner/operators can submit feedback (`giveFeedback`) — scores/tags like starred, uptime, successRate. Self-feedback reverts. | **Deployed** |
| **Validation Registry** | Third-party verification hooks (stake-secured re-execution, zkML, TEE attestation). | **NOT deployed on Celo or any chain** — that part of the spec is still under revision. Do not plan to use it. |

Agent IDs are globally addressed as `eip155:<chainId>:<identityRegistry>` + `agentId`, e.g. `eip155:42220:0x8004A169FB4a3325136EB29fA0ceB6D2e539a432` + the numeric ID. Registered agents are browsable on **8004scan.io** / 8004scan explorers.

### 2.2 Contract addresses (deterministic — same on 40+ chains)

**Celo mainnet (42220):**

- Identity Registry: `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432`
- Reputation Registry: `0x8004BAa17C55a88189AE136b182e5fdA19dE9b63`

**Celo Sepolia testnet (11142220), for rehearsal only** (testnet activity does not count for the hackathon, but the flow is identical):

- Identity Registry: `0x8004A818BFB912233c491871b3d84c89A494BD9e`
- Reputation Registry: `0x8004B663056A597Dffe9eCcC1965A193B7388713`

Both Celo Docs and the independent skill file (which states the addresses were verified on-chain on 2026-09-02) agree on these addresses.

### 2.3 Registration steps (from Celo Docs, "Register a service")

1. **Create the registration file**: a JSON document (registration-v1) describing the agent — name, description, `services` (endpoint list), `x402support`/`x402Support` flag, etc. Host it anywhere fetchable: any HTTPS URL, IPFS, or even a `data:` URI stored on-chain. The spec does not mandate a path. (For a one-morning build, serving it as a static JSON from the public GitHub repo via its raw URL, or as a `data:` URI, removes a hosting dependency — both are spec-legal per Celo Docs.)
2. **Call `register(agentURI)`** on the Identity Registry from the agent wallet. This mints the ERC-721 identity NFT to the caller and sets the agent wallet to the sending address automatically.
3. **Read the `agentId` from the `Registered` event on the transaction receipt** — do *not* trust the simulated return value: Celo Docs explicitly warn that `register()`'s return is `_lastId` at simulation time and is wrong if someone else registers first.
4. **Update the registration file** to add the `registrations` entry (agentRegistry + agentId) so file and chain cross-verify; if the URI changed (IPFS/data:), point the registry at the new file with `setAgentURI(agentId, newURI)` — a second transaction.
5. Done. The identity is then visible on 8004scan; the Agent ID + wallet address go into the Loops submission.

Tooling notes: the Celo skill file's scripts use **Foundry `cast`** and default to Sepolia; mainnet is an explicit opt-in with a confirmation prompt (its scripts pay gas in CELO — `cast` cannot set `feeCurrency`). The same calls are straightforward in **viem** (`writeContract` with the registry ABI), which is the recommended route here because viem also handles attribution suffixes and fee abstraction (see §4).

**Self Agent ID** (docs.celo.org/build/agents/self-agent-id) is a *separate* deployment of the ERC-8004 registries that adds a zero-knowledge proof-of-human via the Self app. The event requires an ERC-8004 identity; it does **not** state that it must be a Self Agent ID. Use the canonical registry above; Self Agent ID's browser/QR registration handoff is extra lead time for no stated benefit. (**UNVERIFIED** that judges give it any extra weight — nothing on the event page says so.)

### 2.4 Cost of registration

- **No protocol fee.** The only cost is gas for the mint transaction(s): `register()` is one transaction; `setAgentURI()` is a second only if the URI has to change after step 3.
- Gas magnitude: an ERC-721 mint + URI storage is a mid-weight contract call. A comparable ERC-8004 registration bundle measured on another L2 used ~273,820 gas total (source: https://www.blokz.dev/articles/erc-8004-agent-registries-onchain, checked 8 Nov 2026 — that figure is from Base, not Celo, so treat it as an order-of-magnitude guide, **not a Celo quote**).
- At Celo's current gas price (200 Gwei base, see §3.3), even 300,000 gas ≈ 0.06 CELO ≈ **well under $0.01** at CELO ≈ $0.067 (price as of 8 Nov 2026, per Bybit/Finnhub search data). Registration cost is a non-issue; *having any spendable balance at all* is the issue (§5).
- Time: Celo Docs and the event page both say registration "takes a few minutes" once the wallet is funded. There is no approval queue or lead time in the registration itself.

---

## 3. Celo mainnet essentials

Sources: Celo Docs, Network Information, https://docs.celo.org/learn/network/overview (updated 30 Oct 2026, checked 8 Nov 2026); Celo Docs protocol pages, https://docs.celo.org/learn/protocol.

### 3.1 Network parameters (verified)

| Parameter | Celo Mainnet | Celo Sepolia (rehearsal only) |
|---|---|---|
| Chain ID | **42220** (`0xa4ec`) — verified, as expected | 11142220 (`0xaa36a7`) |
| Native currency | CELO, 18 decimals | CELO (test) |
| Public RPC (best effort) | **https://forno.celo.org** (WSS: wss://forno.celo.org/ws) — run by cLabs, **rate-limited** | https://forno.celo-sepolia.celo-testnet.org |
| Block explorers | **https://celoscan.io** and **https://celo.blockscout.com** (Blockscout; also reachable historically as explorer.celo.org) | https://celo-sepolia.blockscout.com |
| Testnet faucet | — | https://faucet.celo.org/celo-sepolia |
| Block time / fees | OP Stack Ethereum L2 since March 2025; ~1-second blocks; typical transaction fee below $0.01 | — |

Other public RPC options exist (Chainstack — every hackathon team gets 3 months of its Growth Plan free; OnFinality public endpoint https://celo.api.onfinality.io/public; QuickNode, Ankr, dRPC, Infura, Alchemy all serve Celo). For a one-morning build, Forno is enough; Chainstack via the hackathon offer is the fallback if Forno rate-limits bite. Note: Chainstack is *also* buyable through the buy gateway (`gateway.usebuy.ai/chainstack/celo`, $0.01 per request body) — using the agent's own paid calls for its RPC is a legitimate Build-with-buy integration pattern (see §4).

Key token addresses on Celo mainnet (from Celo Docs / agent skill files, checked 8 Nov 2026):

- USDC: `0xcebA9300f2b948710d2653dD7B07f33A8B32118C` (6 decimals; fee-currency adapter `0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B`)
- USD₮ adapter for fee currency: `0x0e2a3e05bc9a16f5292a6170456a710cb89c6f72`
- USDm (formerly cUSD): `0x765DE816845861e75A25fCA122bb6898B8B1282a` (18 decimals, usable directly as fee currency)
- CELO token contract: `0x471EcE3750Da237f93B8E339c536989b8978a438`
- USA₮ is supported by the x402 facilitator and buy; its contract address was **not verified** in this pass — **UNVERIFIED**, read it from the 402 quote / buy CLI output at build time rather than hardcoding from memory.

### 3.2 Fee abstraction — the feature that changes the funding plan

Celo implements **CIP-64 fee abstraction at node level** (not paymasters): any EOA can pay gas in an allowlisted ERC-20 (USDm, USDC, USD₮ and others) by setting the transaction's `feeCurrency` field. **viem has native support for this field and is the recommended library**; ethers.js/web3.js do not support it, and Foundry `cast` does not expose it. Practical consequence: a wallet holding *only* a supported stablecoin can still send the ERC-8004 registration — Pintu does not strictly need CELO itself, he needs *something spendable* on Celo mainnet (see §5 for which something is fastest to get).

### 3.3 What a few transactions actually cost

Source: Celoscan Gas Tracker, https://celoscan.io/gastracker (snapshot in search results: last refreshed Sat 7 Nov 2026, 13:41 UTC) and Gem Wallet gas tracker, https://gemwallet.com/gastracker/celo/ (checked 8 Nov 2026).

- Current standard gas price: **200 Gwei base** (priority <0.001–20 Gwei). This looks high next to Ethereum L2 norms but CELO is cheap, so dollar costs stay tiny.
- Simple transfer: 21,000 gas × 200 Gwei = 0.0042 CELO ≈ **$0.0003**.
- ERC-20 transfer: ≈ **$0.001** (Celoscan tracker estimate).
- Swap-class call: ≈ **$0.003**.
- ERC-8004 `register()` (est. ~150k–300k gas, see §2.4): roughly **$0.002–$0.005**.
- **Working budget: 1 CELO (≈ ₹6.4 / $0.067 on 8 Nov 2026) covers hundreds of ordinary transactions.** A $5-equivalent purchase is vastly more than the build needs for gas; the binding constraints are minimum purchase sizes, KYC, and *which token* lands in the wallet, not gas economics.
- Buy-gateway / x402 settlements are different: the facilitator/gateway pays settlement gas (see §3.4), so paid calls cost exactly their quoted stablecoin price (typically $0.01 per call for Chainstack RPC and Cencori inference) and no CELO.

### 3.4 x402 and the Celo facilitator

Source: Celo Docs, x402: Agent Payments, https://docs.celo.org/build/agents/x402 (checked 8 Nov 2026); event page FAQ.

- x402 turns HTTP `402 Payment Required` into a payment step: server answers with a price, client signs a stablecoin authorisation, request is retried with payment attached, facilitator settles on-chain.
- Celo's hosted facilitator: dashboard **x402.celo.org**, payment API **https://api.x402.celo.org** (mainnet). It settles USDC, USD₮, USA₮ (EIP-3009, gasless for buyer and seller) and the six Ripio wFIAT tokens + cNGN (Permit2).
- Sellers need an **API key** from x402.celo.org for `/settle` (only `/settle` requires it — `/verify` and `/supported` working does *not* mean settlement will). New seller accounts get **20 free mainnet settlements**; after that, each settlement is charged gas at cost + 0.3% of payment value from a prepaid balance.
- For a Build-with-buy entry, Pintu's agent is the *buyer*, so the facilitator mechanics mostly matter through the buy CLI (§4), which handles signing/settlement itself. The seller-side key is only needed if the build also *charges* for a service.

### 3.5 How tagging is normally attached to a Celo transaction (summary)

Already covered in §1.4: ERC-8021 suffix appended to calldata, via `@celo/attribution-tags` (`withAttribution` on a viem wallet client, or wagmi `dataSuffix`). It is an app-layer convention, not a transaction field, not a memo, and not part of any contract. There is no "memo field" on Celo/EVM transactions — calldata suffix is the whole mechanism.

---

## 4. Fastest credible TypeScript stack for a Monday-morning build

Constraint recap: no framework is mandated by the event. The stack below is chosen purely for (a) event-recommended tooling, (b) fewest moving parts before 14:30 IST, (c) Pintu's existing TypeScript fluency.

### 4.1 The core: `buy` CLI as the payment engine (Build with buy)

Source: buy docs, https://www.usebuy.ai/docs (v0.8.5, checked 8 Nov 2026); skills at https://github.com/celo-org/buy-skill.

This is the single fastest path to *verified paid calls into services Pintu doesn't control*, which is exactly what the track judges:

- Install: `npm install -g @celo/buy@0.8.5` (Node.js 22+ required — note: check Monday's Node version first; this is a real, if small, setup risk).
- **Sandbox first, for free:** `buy --sandbox …` runs the identical flow on Celo Sepolia with test USDC, creates a `sandbox` account automatically, and a gateway faucet funds it (1 test USDC/day/address). Partner routes (`/chainstack`, `/cencori`) are **mainnet only**, but gateway `/v1/…` capabilities are sandbox-testable. Use sandbox to prove the agent logic in the morning without waiting on funding.
- Wallet: `buy setup --name <name>` generates a dedicated wallet, key in the OS keychain, Celo mainnet by default. This *is* the agent wallet — its address doubles as the ERC-8004 registering wallet (note: ERC-8004 registration itself is a separate viem/cast call from this same wallet; buy does not do it) and as the PayTo address for the submission.
- Funding: fund the printed address with a small amount of **USDC, USD₮ or USA₮ on Celo mainnet**. The gateway **sponsors settlement gas**, and `buy send` pays its own gas in the token sent — **this wallet never needs CELO for buy calls** (it still needs a spendable balance — CELO or a fee-currency stablecoin — for the ERC-8004 registration transaction, §3.2/§5).
- Paying: `buy curl --max-amount <cap> …` handles 402 → quote → local EIP-3009 signing → retry → settlement. Always set `--max-amount` close to the quote; payments are final, no refunds. `buy quote` prices a call without paying. `buy receipts --resolve` recovers settlement transaction hashes afterwards — **those hashes are the proof of payment for the submission**.
- Discoverable paid services (700+ in the catalogue, via `buy skills list/search/show` or the MCP tools `buy_discover`, `buy_curl`, `buy_pay_quote`, …). Two named, priced, mainnet partner routes ideal for a one-morning "agent that buys what it doesn't own" story:
  - **Chainstack Celo RPC** — `https://gateway.usebuy.ai/chainstack/celo`, **$0.01 per request body** (JSON-RPC object or batch): the agent literally buys its own blockchain access.
  - **Cencori inference** — `https://gateway.usebuy.ai/cencori/v1/chat/completions`, **$0.01 per completion** (model `maximo-atlas-1.3`, `max_tokens` ∈ {256, 1024, 4096}, non-streaming): the agent buys LLM inference it doesn't own.
  - Plus gateway `/v1/…` capabilities (e.g. social/X search at $0.001 upstream) and **one-hour GCP VMs** from $0.0168 (bigger sizes require a Self proof — avoid those on Monday).
- MCP option: `buy mcp install` registers seven tools with Claude Code / Codex (`buy_send` is opt-in behind a budget/allowlist) — useful if the "agent" is LLM-driven, but the plain CLI from a TypeScript script is simpler and more deterministic.

**Credible one-morning product shape (for the spec, not built here):** a small TypeScript agent that (1) registers its ERC-8004 identity, (2) does a real task whose inputs it must buy — e.g. buys Cencori inference to produce an answer/summary and buys Chainstack RPC to read chain state — with a hard per-call and daily spend cap, logging every settlement hash, and (3) a minimal page/CLI output a human can actually use. That is a genuine "product that pays for services it doesn't own," not a payment demo — which matters, because judging is on the problem solved, and spam-buying the cheapest call scores nothing.

### 4.2 Chain layer: viem (not ethers)

- **viem** with the built-in `celo` chain (id 42220): public client on Forno (or Chainstack), wallet client from the buy wallet's key (buy supports importing an existing key via `buy setup --import`, key on stdin; conversely the buy-generated key stays in the OS keychain — **UNVERIFIED:** whether buy can export that key for reuse in viem for the ERC-8004 call. If it cannot, Monday's flow should generate the wallet in viem/another tool first and *import it into buy*, so one wallet serves both. Check this first on Monday — it decides the wallet setup order.)
- viem is effectively **required** if paying gas via fee abstraction is part of the plan (CIP-64 `feeCurrency` is viem-only among mainstream TS libraries), and it is what the attribution SDK wraps (`withAttribution`). wagmi is only needed if there is a browser frontend; for an agent backend, plain viem is less code.
- Attribution: add `@celo/attribution-tags` to the wallet client before any transaction (§1.4).
- ERC-8004: `writeContract` to the Identity Registry `register(agentURI)`, parse the `Registered` event from the receipt for the real agentId (§2.3).
- Templates if wanted: **Celo Composer** (https://docs.celo.org/build/quickstart) generates a monorepo with templates including `x402` (seller API + buyer script) and `ai-chat`. For a Monday-morning deadline, scaffolding from Composer's x402 template is credible, but a single-package viem + buy-CLI script is fewer files to understand; Composer is the fallback if buy integration stalls. **UNVERIFIED:** Composer templates target Celo Sepolia in the x402 example (per Celo Docs) — budget a mainnet config change if used.

### 4.3 What the event REQUIRES vs recommends

- **Required (validity):** Celo mainnet; ERC-8004 identity; attribution tag implemented; public GitHub repo; code written during the hackathon; for Build with buy, real paid calls via buy/x402 into third-party services with proof stated in the submission.
- **Recommended/named, not required:** buy CLI/skills (the natural way to satisfy the track, but the track's requirement is the paid calls, and buy is the marketplace the track is built around — treat it as required-in-practice), x402 facilitator, Chainstack, Celopedia, Textile (other tracks), Para, AskBots.
- **Explicitly not required:** any specific agent framework, Self Agent ID, Validation Registry (doesn't exist), a demo video (not stated — §1.5).

---

## 5. Risks that could kill a one-morning build

Ordered by kill probability for **Mon 9 Nov, submission 14:30 IST**.

### 5.1 🔴 FUNDING — the deal-breaker risk

Pintu starts Monday with **no EVM wallet, no CELO, no stablecoins, and (per his profile) no existing crypto exchange account on file**. Two separate balances are needed:

| Need | What satisfies it | Amount |
|---|---|---|
| ERC-8004 registration gas | CELO, **or** USDm/USDC/USD₮ used as CIP-64 fee currency via viem | < $0.01 of value (§2.4) |
| Build-with-buy paid calls | **USDC, USD₮ or USA₮ on Celo mainnet** in the buy wallet (gateway sponsors settlement gas; no CELO needed) | Realistically $1–$5 total (calls are $0.001–$0.01 each; minimum purchase sizes dominate) |

Funding routes, fastest first — all checked 8 Nov 2026, none of them pre-verified end-to-end for Pintu:

1. **Free USA₮ faucet (Google Cloud Web3 × Self) — the only zero-purchase route, and it only solves the buy-calls balance.** The event page and the buy docs both point to it: verify once with Self (government ID, in the Self app, proof is zero-knowledge) and claim real USA₮ on Celo mainnet to the buy wallet's address; then pay with `--token USAT` (default token is USDC; paying in the wrong token is refused *before* signing, so this fails safe). Sources: event page ("Where do I get stablecoins to build with?"); https://www.usebuy.ai/docs ("Get free USA₮ from Google Cloud"). **Risks:** it is Pintu-only (his ID, his phone, his Self app — Muse cannot do this step); one claim per person; the **amount is not stated on either page — UNVERIFIED** (if it is a few cents, it covers only a handful of $0.01 calls); Self verification can snag on document/app issues with no support loop on a Monday morning. It also gives **no CELO and no fee-currency token**, so registration gas still needs route 2 or 3.
2. **Onramp.money (direct-to-wallet CELO/USDC).** Claims: paste any wallet address, pay with local payment methods, KYC ≈ 3 minutes one-time, settles on-chain in minutes, no exchange account (source: https://onramp.money/coins/celo, checked 8 Nov 2026). **UNVERIFIED:** that INR/UPI is offered for a CELO purchase specifically, the minimum INR amount, and that the delivered CELO lands on the *Celo network* (not an ERC-20 representation). Verify all three in the widget *before* paying. If it works as claimed, this is the fastest route to registration gas.
3. **Indian exchange (CoinDCX etc.).** CoinDCX sells CELO for INR (IMPS deposit; buy from ₹100; source: https://coindcx.com/how-to-buy/celo/, checked 8 Nov 2026). **Risks:** Pintu would need a fresh account + full KYC on Monday morning (time UNVERIFIED, typically the long pole); **whether CoinDCX allows CELO *withdrawal* to an external wallet, and on the native Celo network, is UNVERIFIED** — many Indian exchanges restrict withdrawals. An exchange balance that cannot leave the exchange does not fund anything. Bitget similarly advertises INR/UPI CELO purchases via third-party/P2P with a $5 spot minimum (https://www.BITGET.com/how-to-buy/celo/india) — same KYC + withdrawal-network caveats, all **UNVERIFIED** for this use.
4. **A person Pintu knows sending a small amount to his new address** — fastest of all if such a person exists and is awake Monday morning; none is known to Muse. (Do not count self-funded sybil wallets as "users" for judging either way — §1.3.)

**Mitigation order for Monday:** (a) create the wallet first thing and get its address; (b) Pintu starts the Self/USA₮ claim *in parallel* with the build (it is his phone step anyway); (c) in parallel, attempt the smallest onramp purchase for registration gas; (d) build and rehearse everything on **buy `--sandbox` (Celo Sepolia, free faucet)** and ERC-8004-on-Sepolia so that the *only* step waiting on money is re-running the same commands on mainnet. If no mainnet balance exists by ~13:00 IST, there is no valid entry — registration and paid calls are both mainnet-only requirements, and no testnet substitute counts.

### 5.2 🟠 Independent-user qualifier (scores, not validity)

Even a perfect technical entry has **zero independent users**: every wallet involved will be Pintu's, created and funded by him on the day — expressly excluded from counting (§1.3). Build with buy says independent users are "a qualifier" and spam calls score nothing. Realistic expectation-setting for Pintu: **plan for a valid submission + Builder Graph/Certify credential + Prezenti track record, not for one of the five $200-ish prizes**, unless an independent person genuinely uses the agent before 14:30 IST (e.g. someone else paying for one real call from their own pre-existing Celo wallet — do not manufacture this).

### 5.3 🟠 Submission-form unknowns

The exact Loops form fields for this event are **UNVERIFIED** (§1.5) because they sit behind Pintu's login. Risks hiding there: a required demo/video URL, a required track selection made *before* building, a required PayTo/Agent-ID field format, or a "public repo at registration" gate that needs the repo linked in the hackathon space *before* any build transaction. **Mitigation:** Monday's first 15 minutes (Pintu-side or supervised): open the hackathon space, create the project with the repo URL + track = Build with buy, and read every field of the submit form before writing code.

### 5.4 🟡 One wallet, two tools (key custody)

The buy wallet's key lives in the OS keychain via `@celo/buy`; the ERC-8004 registration needs the same wallet signing through viem/cast. Whether buy can export its generated key is **UNVERIFIED** (§4.2). If it can't, generate the wallet outside buy and `buy setup --import` it (key via stdin). Getting this backwards costs a re-funding round-trip. Related: the VM this build may run on has no guaranteed OS-keychain behaviour — **UNVERIFIED**; keep the wallet on Pintu's own machine if the keychain misbehaves. A dedicated, low-balance wallet is also the buy docs' own safety advice (payments are irreversible, software is pre-1.0 beta with no external security review — their words).

### 5.5 🟡 Order-of-operations traps (all cheap to avoid, fatal if missed)

- **Tag before transacting:** any agent transaction sent before `withAttribution` is wired in is invisible to the leaderboard, permanently (§1.4).
- **agentId from the event, not the return value** (§2.3) — a wrong ID in the submission is a self-inflicted invalid entry.
- **Sepolia/mainnet mixups:** buy sandbox, ERC-8004 Sepolia scripts, and Composer templates all default to testnet. Every artefact in the submission (agentId, tx hashes, wallet) must be the mainnet one; double-check chain 42220 on Celoscan links.
- **x402 seller trap (only if the build also charges):** `/settle` fails 401 without an API key even when everything else looks healthy (§3.4).
- **buy sandbox caps:** partner routes are mainnet-only and sandbox upstream spend is capped ($0.10/payer/day) — rehearse partner calls with `buy quote` (free) and save paid mainnet calls for the real run.

### 5.6 🟢 Minor / manageable

- **ERC-8004 lead time:** none — permissionless, minutes, sub-cent (§2.4). The Draft status of the EIP is a standards risk, not a Monday risk; contracts are deployed and the event requires them.
- **Gas price spike:** even a 10× spike keeps the whole morning's on-chain costs under ~$0.10 (§3.3).
- **Forno rate limits:** real but unlikely to bite a single agent; Chainstack free tier (hackathon offer) is the fallback — claiming it is a signup step, so only do it if Forno actually fails.
- **Node version:** `@celo/buy` needs Node 22+; verify before relying on it.
- **Ripio/Textile tracks:** not applicable — they need LatAm currency context, KYB-gated ramps (Ripio B2B) or FX capital; Build with buy is the only track compatible with Pintu's situation, confirming the earlier intended-track note.

---

## 6. Source index (all checked 8 Nov 2026)

**Event**
- Loops House event page: https://www.loops.house/agents-on-open-rails
- Chainstack Builders Club (corroborates $5,000 across four tracks + Prezenti): https://chainstack.com/builders-club/

**Celo official docs**
- ERC-8004: https://docs.celo.org/build/agents/8004
- Attribution Tags: https://docs.celo.org/build/agents/attribution-tags
- Build with AI / agents overview: https://docs.celo.org/build/agents/overview
- x402: https://docs.celo.org/build/agents/x402
- Self Agent ID: https://docs.celo.org/build/agents/self-agent-id
- Network Information: https://docs.celo.org/learn/network/overview
- Protocol / fee abstraction: https://docs.celo.org/learn/protocol
- Quickstart / Celo Composer: https://docs.celo.org/build/quickstart

**ERC-8004 ecosystem**
- EIP-8004 spec: https://eips.ethereum.org/EIPS/eip-8004
- ERC-8004 on Celo skill (addresses verified on-chain 2026-09-02): https://github.com/den-labs/agent-skills/blob/HEAD/skills/erc8004-celo/SKILL.md
- Registration gas anatomy (Base, order-of-magnitude only): https://www.blokz.dev/articles/erc-8004-agent-registries-onchain

**buy / Build with buy**
- buy docs: https://www.usebuy.ai/docs
- buy skills: https://github.com/celo-org/buy-skill
- A live Open Rails entry's README (attribution + buy proof pattern in practice): https://glama.ai/mcp/servers/landingen24h/ar-data-agent

**Network data**
- Celoscan Gas Tracker: https://celoscan.io/gastracker
- Gem Wallet Celo gas tracker: https://gemwallet.com/gastracker/celo/

**Funding routes (claims as published; caveats in §5.1)**
- Onramp.money, CELO page: https://onramp.money/coins/celo
- CoinDCX, buy CELO in India: https://coindcx.com/how-to-buy/celo/
- Bitget, buy CELO in India: https://www.BITGET.com/how-to-buy/celo/india

**Loops platform pattern (generic, UNVERIFIED for this event)**
- Loops project fields in another Loops hackathon's public skill: https://github.com/Gautam5328/codex-hackathon
