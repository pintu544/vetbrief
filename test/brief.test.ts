import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { assembleBrief, fallbackVerdict, runBrief } from '../src/brief.js';
import { fixtureGateway } from '../src/fixtureGateway.js';
import {
  CHAINSTACK_ROUTE,
  CENCORI_ROUTE,
  GATEWAY_BASE,
} from '../src/config.js';
import type { PaymentRecord } from '../src/receipts.js';
import type { SourceSection } from '../src/sources.js';

function loadFixtures(): Map<string, unknown> {
  const root = new URL('../fixtures/', import.meta.url);
  const map = new Map<string, unknown>();
  const load = (file: string) =>
    JSON.parse(readFileSync(new URL(file, root), 'utf8')) as unknown;
  map.set(`${GATEWAY_BASE}/v1/social/linkedin/company/posts`, load('ploid-company.json'));
  map.set(`${GATEWAY_BASE}/v1/social/linkedin/profile/posts`, load('ploid-profile.json'));
  map.set(`${GATEWAY_BASE}/v1/social/x/posts/search`, load('tikhub-x.json'));
  map.set(`${GATEWAY_BASE}/v1/social/reddit/posts/search`, load('tikhub-reddit.json'));
  map.set(CHAINSTACK_ROUTE, load('chainstack-batch.json'));
  map.set(CENCORI_ROUTE, load('cencori.json'));
  return map;
}

describe('runBrief end-to-end (fixture gateway, $0 real spend)', () => {
  it('buys the full basket, assembles the brief and writes receipts', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'vetbrief-'));
    const gateway = fixtureGateway(loadFixtures());
    const result = await runBrief(
      gateway,
      {
        name: 'Acme Corp',
        linkedinCompany: 'acme-corp',
        linkedinProfile: 'https://www.linkedin.com/in/ada-acme',
        xHandle: '@acmecorp',
        walletAddress: '0x1111111111111111111111111111111111111111',
      },
      { requester: 'test', mode: 'sandbox', sanctionsEnabled: false, receiptsDir: dir },
      '0x2222222222222222222222222222222222222222',
    );

    // 6 paid calls (sanctions skipped, flag off): .023+.023+.005+.005+.01+.01
    expect(result.receipt.totalUsd).toBeCloseTo(0.076);
    expect(result.receipt.payments.filter((p) => !p.skipped)).toHaveLength(6);
    const sanctions = result.receipt.payments.find((p) => p.service.startsWith('Sanctions'));
    expect(sanctions?.skipped).toBe(true);

    // Brief carries the bought evidence and the verdict.
    expect(result.markdown).toContain('# VetBrief — Acme Corp');
    expect(result.markdown).toContain('seed round');
    expect(result.markdown).toContain('VERDICT: PROCEED WITH CARE');
    expect(result.markdown).toContain('Outgoing transactions: 42');
    expect(result.markdown).toContain('Not bought, and why');
    expect(result.markdown).toContain('$0.076');

    // Receipts: JSON file + INDEX.md row.
    expect(existsSync(result.receiptFile)).toBe(true);
    const index = readFileSync(join(dir, 'INDEX.md'), 'utf8');
    expect(index).toContain('Acme Corp');
    expect(index).toContain('test');
  });

  it('skips wallet-dependent sources honestly when no wallet is given', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'vetbrief-'));
    const gateway = fixtureGateway(loadFixtures());
    const result = await runBrief(
      gateway,
      { name: 'Acme Corp', linkedinCompany: 'acme-corp' },
      { requester: 'test', mode: 'sandbox', sanctionsEnabled: false, receiptsDir: dir },
    );
    const chain = result.receipt.payments.find((p) => p.service.startsWith('Chainstack'));
    expect(chain?.skipped).toBe(true);
    const profile = result.receipt.payments.find((p) => p.service.includes('profile posts'));
    expect(profile?.skipped).toBe(true);
    // .023 + .005 + .005 + .01 (cencori)
    expect(result.receipt.totalUsd).toBeCloseTo(0.043);
  });
});

describe('assembleBrief / fallbackVerdict', () => {
  it('renders sections in order with a payments table', () => {
    const sections: SourceSection[] = [
      { key: 'x-search', title: 'Public voice on X', bullets: ['a post'], rawExtract: 'a post' },
      {
        key: 'linkedin-company',
        title: 'Who they are (LinkedIn, company voice)',
        bullets: ['a company post'],
        rawExtract: 'a company post',
      },
    ];
    const payments: PaymentRecord[] = [
      {
        service: 'TikHub X posts search',
        seller: 'TikHub (ERC-8004 #9895)',
        route: 'x',
        amountUsd: 0.005,
        txHash: '0x' + 'ef'.repeat(32),
      },
    ];
    const md = assembleBrief({
      input: { name: 'Acme Corp' },
      requester: 'test',
      createdAt: '2026-11-08T00:00:00.000Z',
      mode: 'mainnet',
      sections,
      payments,
    });
    expect(md.indexOf('Who they are')).toBeLessThan(md.indexOf('Public voice on X'));
    expect(md).toContain('celoscan.io/tx/0x' + 'ef'.repeat(32));
    expect(md).toContain('VERDICT: PROCEED');
  });

  it('fallback flags a thin footprint', () => {
    const v = fallbackVerdict(
      [
        { key: 'x-search', title: 'X', bullets: ['No notable X posts found.'], rawExtract: '' },
        { key: 'reddit-search', title: 'R', bullets: ['No Reddit mentions found (x).'], rawExtract: '' },
        { key: 'linkedin-company', title: 'L', bullets: ['No recent company posts found.'], rawExtract: '' },
      ],
      [],
    );
    expect(v).toContain('PROCEED WITH CARE');
  });
});
