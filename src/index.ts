#!/usr/bin/env tsx
import { readFileSync } from 'node:fs';
import { BuyGateway, type BuyMode } from './buy.js';
import { runBrief } from './brief.js';
import { fixtureGateway } from './fixtureGateway.js';
import type { CounterpartyInput } from './sources.js';

/**
 * VetBrief CLI — the same pipeline the Telegram bot serves (SPEC FR1).
 *
 *   npm run vet -- "Acme Corp" --linkedin acme --x @acme --wallet 0x…
 *   npm run vet -- "Acme Corp" --mock        # fixture data, $0, no wallet
 *
 * Mode: BUY_MODE env or --mode (sandbox is the default; mainnet is
 * explicit because mainnet calls spend real money).
 */
async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const mock = argv.includes('--mock');
  const modeFlag = argv.find((a) => a.startsWith('--mode='))?.split('=')[1];
  const mode: BuyMode =
    modeFlag === 'mainnet' || process.env.BUY_MODE === 'mainnet' ? 'mainnet' : 'sandbox';
  const flag = (name: string) => {
    const eq = argv.find((a) => a.startsWith(`--${name}=`))?.split('=')[1];
    if (eq) return eq;
    const idx = argv.indexOf(`--${name}`);
    return idx >= 0 ? argv[idx + 1] : undefined;
  };
  const flagValues = new Set(
    ['linkedin', 'profile', 'x', 'wallet', 'mode'].flatMap((n) => {
      const idx = argv.indexOf(`--${n}`);
      return idx >= 0 && argv[idx + 1] ? [argv[idx + 1]] : [];
    }),
  );
  const name = argv.find((a) => !a.startsWith('--') && !flagValues.has(a));
  if (!name) {
    console.error('Usage: vetbrief "<Counterparty Name>" [--linkedin slug] [--profile url] [--x @handle] [--wallet 0x…] [--mock] [--mode=sandbox|mainnet]');
    process.exit(2);
  }
  const input: CounterpartyInput = {
    name,
    linkedinCompany: flag('linkedin'),
    linkedinProfile: flag('profile'),
    xHandle: flag('x'),
    walletAddress: flag('wallet'),
  };

  let gateway: BuyGateway;
  let agentWallet: string | undefined;
  if (mock) {
    const fixtures = new Map<string, unknown>();
    for (const [route, file] of Object.entries({
      'https://gateway.usebuy.ai/v1/social/linkedin/company/posts': 'fixtures/ploid-company.json',
      'https://gateway.usebuy.ai/v1/social/linkedin/profile/posts': 'fixtures/ploid-profile.json',
      'https://gateway.usebuy.ai/v1/social/x/posts/search': 'fixtures/tikhub-x.json',
      'https://gateway.usebuy.ai/v1/social/reddit/posts/search': 'fixtures/tikhub-reddit.json',
      'https://gateway.usebuy.ai/chainstack/celo': 'fixtures/chainstack-batch.json',
      'https://gateway.usebuy.ai/cencori/v1/chat/completions': 'fixtures/cencori.json',
    })) {
      fixtures.set(route, JSON.parse(readFileSync(new URL(`../${file}`, import.meta.url), 'utf8')));
    }
    gateway = fixtureGateway(fixtures, mode);
  } else {
    gateway = new BuyGateway(mode);
    if (process.env.AGENT_KEY_FILE) {
      const { loadAgentPrivateKey, createAgentWalletClient } = await import('./wallet.js');
      const key = loadAgentPrivateKey(process.env.AGENT_KEY_FILE);
      agentWallet = createAgentWalletClient(key, mode === 'mainnet' ? 'celo' : 'celoSepolia').address;
    }
  }

  const result = await runBrief(gateway, input, {
    requester: 'cli',
    mode,
    sanctionsEnabled: process.env.SANCTIONS_ENABLED === 'true',
    receiptsDir: 'receipts',
  }, agentWallet);
  console.log(result.markdown);
  console.error(`\n[receipt written: ${result.receiptFile} · total $${result.receipt.totalUsd.toFixed(3)} · mode ${mode}${mock ? ' · MOCK' : ''}]`);
}

main().catch((err) => {
  console.error('[vetbrief] failed:', err instanceof Error ? err.message : err);
  process.exit(1);
});
