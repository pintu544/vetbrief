import { BuyGateway, type BuyMode, type CommandRunner } from './buy.js';
import { ROUTES } from './config.js';

/**
 * A BuyGateway-compatible runner that NEVER pays: it answers `quote` with
 * the verified catalogue price and `curl` with fixture response bodies.
 * Powers `vetbrief --mock` and the end-to-end test, so the whole pipeline
 * (rails → sources → brief → receipts) can be exercised for $0.
 */
export function createFixtureRunner(fixtures: Map<string, unknown>): CommandRunner {
  return async (_file, args) => {
    const cmd = args.find((a) => a === 'quote' || a === 'curl' || a === 'receipts');
    const route = args.find((a) => a.startsWith('https://')) ?? '';
    if (cmd === 'receipts') {
      return { stdout: 'mock receipt 0x' + 'ab'.repeat(32), stderr: '' };
    }
    const info = ROUTES[route];
    if (!info) throw new Error(`Fixture runner: unknown route ${route}`);
    if (cmd === 'quote') {
      return { stdout: `$${info.catalogPriceUsd.toFixed(3)} USDC`, stderr: '' };
    }
    const body = fixtures.get(route);
    return { stdout: JSON.stringify(body ?? {}), stderr: '' };
  };
}

export function fixtureGateway(fixtures: Map<string, unknown>, mode: BuyMode = 'sandbox'): BuyGateway {
  return new BuyGateway(mode, createFixtureRunner(fixtures));
}
