import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import express, { type Express, type Request, type Response } from 'express';
import { privateKeyToAccount } from 'viem/accounts';
import { BuyGateway, type BuyMode } from './buy.js';
import { runBrief } from './brief.js';
import { fixtureGateway } from './fixtureGateway.js';
import {
  CHAINSTACK_ROUTE,
  CENCORI_ROUTE,
  GATEWAY_BASE,
  SPEND_RAILS,
} from './config.js';
import {
  explorerTxUrl,
  TrialLedger,
  type BriefReceipt,
} from './receipts.js';
import type { CounterpartyInput } from './sources.js';

/**
 * VetBrief web surface (spec amendment, 8 Nov 2026): the Loops House
 * submission form REQUIRES a live app URL judges can try in the browser,
 * so the Telegram bot alone is not a valid entry. This server is that
 * surface — one Node service (`npm start`, PORT env) serving the UI, the
 * brief API (same pipeline, same spend rails, plus a per-IP rate limit
 * and the global sponsored-trial cap) and the receipts index.
 *
 * Modes:
 *  - mainnet: only when BUY_MODE=mainnet AND AGENT_PRIVATE_KEY is set.
 *    The key comes from the environment ONLY and is never logged.
 *  - sandbox: the buy CLI against Celo Sepolia (default when no key).
 *  - mock: fixture gateway ($0, deterministic) when BUY_MODE=mock or the
 *    sandbox gateway fails to initialise.
 * Any non-mainnet mode labels its output REHEARSAL, in the API and the UI.
 */

export interface ServerDeps {
  gateway: BuyGateway;
  mode: BuyMode | 'mock';
  receiptsDir: string;
  ledger: TrialLedger;
  agentWallet?: string;
  rateLimitPerHour?: number;
}

/** Rolling one-hour per-IP limiter. Exported for tests. */
export function createRateLimiter(limitPerHour: number) {
  const hits = new Map<string, number[]>();
  return {
    allow(ip: string, now = Date.now()): boolean {
      const windowStart = now - 3_600_000;
      const recent = (hits.get(ip) ?? []).filter((t) => t > windowStart);
      if (recent.length >= limitPerHour) {
        hits.set(ip, recent);
        return false;
      }
      recent.push(now);
      hits.set(ip, recent);
      return true;
    },
  };
}

/** Read every brief receipt in a directory, newest first. Exported for tests. */
export function listReceipts(receiptsDir: string): BriefReceipt[] {
  if (!existsSync(receiptsDir)) return [];
  const out: BriefReceipt[] = [];
  for (const file of readdirSync(receiptsDir)) {
    if (!file.endsWith('.json') || file === 'trial-ledger.json') continue;
    try {
      out.push(JSON.parse(readFileSync(join(receiptsDir, file), 'utf8')) as BriefReceipt);
    } catch {
      // A half-written receipt must not break the index.
    }
  }
  return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function cleanField(value: unknown, max = 300): string | undefined {
  if (typeof value !== 'string') return undefined;
  const v = value.trim();
  return v ? v.slice(0, max) : undefined;
}

export function createApp(deps: ServerDeps): Express {
  const app = express();
  const rehearsal = deps.mode !== 'mainnet';
  const limiter = createRateLimiter(deps.rateLimitPerHour ?? 5);
  app.disable('x-powered-by');
  app.use(express.json({ limit: '16kb' }));
  app.use(express.static(new URL('../public', import.meta.url).pathname));

  app.get('/api/status', (_req: Request, res: Response) => {
    res.json({
      mode: deps.mode,
      rehearsal,
      agentWallet: deps.agentWallet ?? null,
      trialUsed: deps.ledger.used,
      trialCap: SPEND_RAILS.sponsoredTrialCap,
      rails: {
        perCallMaxUsd: SPEND_RAILS.perCallMaxUsd,
        perBriefMaxUsd: SPEND_RAILS.perBriefMaxUsd,
      },
    });
  });

  app.get('/api/receipts', (_req: Request, res: Response) => {
    const receipts = listReceipts(deps.receiptsDir).map((r) => ({
      ...r,
      payments: r.payments.map((p) => ({
        ...p,
        explorerUrl: p.txHash ? explorerTxUrl(r.mode, p.txHash) : null,
      })),
    }));
    res.json({ receipts });
  });

  app.post('/api/brief', async (req: Request, res: Response) => {
    const ip = (req.ip ?? 'unknown').replace('::ffff:', '');
    if (!limiter.allow(ip)) {
      res.status(429).json({ error: 'rate_limited', message: 'Too many briefs from this address in the last hour. Try again later.' });
      return;
    }
    const body = (req.body ?? {}) as Record<string, unknown>;
    const name = cleanField(body.name, 120);
    if (!name) {
      res.status(400).json({ error: 'name_required', message: 'A counterparty name is required.' });
      return;
    }
    if (!deps.ledger.canSponsor()) {
      res.status(429).json({
        error: 'trial_full',
        message: `The sponsored trial (${SPEND_RAILS.sponsoredTrialCap} briefs) is exhausted. Paid briefs run from your own wallet — see the project README.`,
      });
      return;
    }
    const input: CounterpartyInput = {
      name,
      linkedinCompany: cleanField(body.linkedin),
      linkedinProfile: cleanField(body.profile),
      xHandle: cleanField(body.x),
      walletAddress: cleanField(body.wallet),
    };
    try {
      const result = await runBrief(
        deps.gateway,
        input,
        {
          requester: `web:${ip}`,
          mode: deps.mode === 'mainnet' ? 'mainnet' : 'sandbox',
          sanctionsEnabled: process.env.SANCTIONS_ENABLED === 'true',
          receiptsDir: deps.receiptsDir,
        },
        deps.agentWallet,
      );
      deps.ledger.record({ at: new Date().toISOString(), requester: `web:${ip}`, briefId: result.briefId });
      res.json({
        briefId: result.briefId,
        markdown: result.markdown,
        receipt: result.receipt,
        mode: deps.mode,
        rehearsal,
      });
    } catch (err) {
      res.status(502).json({
        error: 'brief_failed',
        message: err instanceof Error ? err.message : String(err),
      });
    }
  });

  return app;
}

/** Load the fixture responses for mock mode (same files the CLI uses). */
export function loadFixtureGateway(): BuyGateway {
  const root = new URL('../fixtures/', import.meta.url);
  const load = (file: string) =>
    JSON.parse(readFileSync(new URL(file, root), 'utf8')) as unknown;
  const fixtures = new Map<string, unknown>([
    [`${GATEWAY_BASE}/v1/social/linkedin/company/posts`, load('ploid-company.json')],
    [`${GATEWAY_BASE}/v1/social/linkedin/profile/posts`, load('ploid-profile.json')],
    [`${GATEWAY_BASE}/v1/social/x/posts/search`, load('tikhub-x.json')],
    [`${GATEWAY_BASE}/v1/social/reddit/posts/search`, load('tikhub-reddit.json')],
    [CHAINSTACK_ROUTE, load('chainstack-batch.json')],
    [CENCORI_ROUTE, load('cencori.json')],
  ]);
  return fixtureGateway(fixtures, 'sandbox');
}

export function resolveServerDeps(): ServerDeps {
  const receiptsDir = process.env.RECEIPTS_DIR ?? 'receipts';
  const ledger = new TrialLedger(
    join(receiptsDir, 'trial-ledger.json'),
    SPEND_RAILS.sponsoredTrialCap,
  );
  const key = process.env.AGENT_PRIVATE_KEY;
  const wantMainnet = process.env.BUY_MODE === 'mainnet';
  if (wantMainnet && key) {
    const agentWallet = privateKeyToAccount(key as `0x${string}`).address;
    return { gateway: new BuyGateway('mainnet'), mode: 'mainnet', receiptsDir, ledger, agentWallet };
  }
  if (process.env.BUY_MODE === 'mock') {
    return {
      gateway: loadFixtureGateway(),
      mode: 'mock',
      receiptsDir,
      ledger,
      agentWallet: process.env.AGENT_WALLET_ADDRESS,
    };
  }
  // Default: sandbox (Sepolia) via the buy CLI. In sandbox the CLI signs
  // with the imported agent account, so no key is needed in this process.
  return {
    gateway: new BuyGateway('sandbox'),
    mode: 'sandbox',
    receiptsDir,
    ledger,
    agentWallet: process.env.AGENT_WALLET_ADDRESS,
  };
}

export function main(): void {
  const port = Number(process.env.PORT ?? 3000);
  const deps = resolveServerDeps();
  const app = createApp(deps);
  app.listen(port, () => {
    console.log(
      `[vetbrief] listening on http://localhost:${port} · mode=${deps.mode}${deps.mode !== 'mainnet' ? ' (REHEARSAL)' : ''} · wallet=${deps.agentWallet ?? 'n/a'}`,
    );
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
