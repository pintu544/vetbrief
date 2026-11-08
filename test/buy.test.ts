import { describe, expect, it } from 'vitest';
import {
  BuyGateway,
  SpendRailError,
  SpendTracker,
  parseQuoteAmountUsd,
  parseReceiptTxHashes,
  type CommandRunner,
} from '../src/buy.js';
import { GATEWAY_BASE, SPEND_RAILS } from '../src/config.js';

const X_ROUTE = `${GATEWAY_BASE}/v1/social/x/posts/search`;
const COMPANY_ROUTE = `${GATEWAY_BASE}/v1/social/linkedin/company/posts`;

/** Runner that quotes a fixed price, records every invocation. */
function stubRunner(quoteOut: string, calls: string[]) {
  const runner: CommandRunner = async (_file, args) => {
    const cmd = args.find((a) => a === 'quote' || a === 'curl' || a === 'receipts') ?? '?';
    calls.push(cmd);
    if (cmd === 'quote') return { stdout: quoteOut, stderr: '' };
    if (cmd === 'receipts') return { stdout: 'paid 0x' + 'cd'.repeat(32), stderr: '' };
    return { stdout: JSON.stringify({ ok: true }), stderr: '' };
  };
  return runner;
}

describe('parseQuoteAmountUsd', () => {
  it('parses an x402 JSON challenge (atomic units)', () => {
    const out = JSON.stringify({
      x402Version: 1,
      accepts: [{ scheme: 'exact', maxAmountRequired: '23000', asset: '0xabc' }],
    });
    expect(parseQuoteAmountUsd(out)).toBeCloseTo(0.023);
  });

  it('parses human $ output', () => {
    expect(parseQuoteAmountUsd('Price: $0.005 USDC')).toBeCloseTo(0.005);
  });

  it('throws on unparseable output instead of guessing', () => {
    expect(() => parseQuoteAmountUsd('no price here')).toThrowError(SpendRailError);
  });
});

describe('spend rails (SPEC FR6)', () => {
  it('refuses an over-cap quote BEFORE any payment happens', async () => {
    const calls: string[] = [];
    const gateway = new BuyGateway('sandbox', stubRunner('$0.05 USDC', calls), 'buy');
    const spend = new SpendTracker();
    await expect(gateway.pay(spend, COMPANY_ROUTE, { company: 'acme' })).rejects.toMatchObject({
      code: 'OVER_CALL_CAP',
    });
    // The payment command must never have been invoked.
    expect(calls).toEqual(['quote']);
    expect(spend.spentUsd).toBe(0);
  });

  it('refuses a route that is not on the allowlist', async () => {
    const calls: string[] = [];
    const gateway = new BuyGateway('sandbox', stubRunner('$0.001 USDC', calls), 'buy');
    const spend = new SpendTracker();
    await expect(
      gateway.pay(spend, 'https://gateway.usebuy.ai/v1/evil/route', {}),
    ).rejects.toMatchObject({ code: 'ROUTE_NOT_ALLOWED' });
    expect(calls).toEqual([]);
  });

  it('enforces the per-brief cap across calls', () => {
    const spend = new SpendTracker();
    // $0.03 x 4 = $0.12 exactly at cap: allowed; one cent more is refused.
    for (let i = 0; i < 4; i++) {
      spend.assertCanSpend(X_ROUTE, SPEND_RAILS.perCallMaxUsd);
      spend.record(SPEND_RAILS.perCallMaxUsd);
    }
    expect(spend.spentUsd).toBeCloseTo(SPEND_RAILS.perBriefMaxUsd);
    expect(() => spend.assertCanSpend(X_ROUTE, 0.001)).toThrowError(/Brief budget exceeded/);
  });

  it('pays under the caps and records the spend + settlement hash', async () => {
    const calls: string[] = [];
    const gateway = new BuyGateway('sandbox', stubRunner('$0.005 USDC', calls), 'buy');
    const spend = new SpendTracker();
    const result = await gateway.pay(spend, X_ROUTE, { query: '"Acme"' });
    expect(result.amountUsd).toBeCloseTo(0.005);
    expect(result.txHash).toBe('0x' + 'cd'.repeat(32));
    expect(spend.spentUsd).toBeCloseTo(0.005);
    expect(calls).toEqual(['quote', 'curl', 'receipts']);
  });
});

describe('parseReceiptTxHashes', () => {
  it('extracts hashes newest-first and ignores noise', () => {
    const h1 = '0x' + '11'.repeat(32);
    const h2 = '0x' + '22'.repeat(32);
    expect(parseReceiptTxHashes(`paid ${h1} then ${h2} done`)).toEqual([h1, h2]);
    expect(parseReceiptTxHashes('nothing')).toEqual([]);
  });
});
