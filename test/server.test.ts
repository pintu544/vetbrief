import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Server } from 'node:http';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp, createRateLimiter, listReceipts, loadFixtureGateway } from '../src/server.js';
import { TrialLedger } from '../src/receipts.js';
import { SPEND_RAILS } from '../src/config.js';

const FULL_INPUT = {
  name: 'Acme Corp',
  linkedin: 'acme-corp',
  profile: 'https://www.linkedin.com/in/ada-acme',
  x: '@acmecorp',
  wallet: '0x1111111111111111111111111111111111111111',
};

function startApp(opts: { rateLimitPerHour?: number; trialCap?: number } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'vetbrief-server-'));
  const ledger = new TrialLedger(join(dir, 'trial-ledger.json'), opts.trialCap ?? SPEND_RAILS.sponsoredTrialCap);
  const app = createApp({
    gateway: loadFixtureGateway(),
    mode: 'mock',
    receiptsDir: dir,
    ledger,
    rateLimitPerHour: opts.rateLimitPerHour,
    agentWallet: '0x2222222222222222222222222222222222222222',
  });
  return new Promise<{ server: Server; base: string; dir: string }>((resolve) => {
    const server = app.listen(0, () => {
      const addr = server.address();
      const port = typeof addr === 'object' && addr ? addr.port : 0;
      resolve({ server, base: `http://127.0.0.1:${port}`, dir });
    });
  });
}

async function postBrief(base: string, body: unknown) {
  return fetch(`${base}/api/brief`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('rate limiter', () => {
  it('allows up to the hourly limit per IP, then refuses', () => {
    const limiter = createRateLimiter(2);
    const now = Date.now();
    expect(limiter.allow('1.1.1.1', now)).toBe(true);
    expect(limiter.allow('1.1.1.1', now)).toBe(true);
    expect(limiter.allow('1.1.1.1', now)).toBe(false);
    expect(limiter.allow('2.2.2.2', now)).toBe(true);
    expect(limiter.allow('1.1.1.1', now + 3_600_001)).toBe(true);
  });
});

describe('web surface (amendment: live app URL)', () => {
  let ctx: Awaited<ReturnType<typeof startApp>>;
  beforeAll(async () => {
    ctx = await startApp();
  });
  afterAll(() => ctx.server.close());

  it('serves the single-page UI', async () => {
    const res = await fetch(`${ctx.base}/`);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('VetBrief');
    expect(html).toContain('Know who you are paying');
  });

  it('reports rehearsal status honestly', async () => {
    const res = await fetch(`${ctx.base}/api/status`);
    const body = (await res.json()) as { mode: string; rehearsal: boolean };
    expect(body.mode).toBe('mock');
    expect(body.rehearsal).toBe(true);
  });

  it('runs a brief through the API and lists it in receipts', async () => {
    const res = await postBrief(ctx.base, FULL_INPUT);
    expect(res.status).toBe(200);
    const data = (await res.json()) as {
      markdown: string;
      rehearsal: boolean;
      receipt: { totalUsd: number };
    };
    expect(data.rehearsal).toBe(true);
    expect(data.markdown).toContain('# VetBrief — Acme Corp');
    expect(data.receipt.totalUsd).toBeCloseTo(0.076);

    const receiptsRes = await fetch(`${ctx.base}/api/receipts`);
    const { receipts } = (await receiptsRes.json()) as {
      receipts: Array<{ counterparty: string; payments: Array<{ explorerUrl: string | null }> }>;
    };
    expect(receipts).toHaveLength(1);
    expect(receipts[0].counterparty).toBe('Acme Corp');
    expect(receipts[0].payments[0].explorerUrl).toContain('blockscout.com/tx/0x');
    expect(listReceipts(ctx.dir)).toHaveLength(1);
  });

  it('rejects a brief with no name', async () => {
    const res = await postBrief(ctx.base, { linkedin: 'acme' });
    expect(res.status).toBe(400);
  });
});

describe('web surface limits', () => {
  it('rate-limits per IP', async () => {
    const ctx = await startApp({ rateLimitPerHour: 1 });
    try {
      expect((await postBrief(ctx.base, FULL_INPUT)).status).toBe(200);
      const second = await postBrief(ctx.base, FULL_INPUT);
      expect(second.status).toBe(429);
      expect(((await second.json()) as { error: string }).error).toBe('rate_limited');
    } finally {
      ctx.server.close();
    }
  });

  it('stops serving sponsored briefs at the global trial cap', async () => {
    const ctx = await startApp({ trialCap: 1, rateLimitPerHour: 50 });
    try {
      expect((await postBrief(ctx.base, FULL_INPUT)).status).toBe(200);
      const second = await postBrief(ctx.base, FULL_INPUT);
      expect(second.status).toBe(429);
      expect(((await second.json()) as { error: string }).error).toBe('trial_full');
    } finally {
      ctx.server.close();
    }
  });
});
