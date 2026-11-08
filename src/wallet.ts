import { existsSync, readFileSync } from 'node:fs';
import {
  createPublicClient,
  createWalletClient,
  http,
  type Address,
  type Hex,
  type PublicClient,
  type WalletClient,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { celo, celoSepolia } from 'viem/chains';
import { withAttribution } from '@celo/attribution-tags';
import { ATTRIBUTION_TAG } from './config.js';

export type SupportedChain = typeof celo | typeof celoSepolia;

export const CHAINS = { celo, celoSepolia } as const;
export type ChainName = keyof typeof CHAINS;

/**
 * Load the agent private key. The key file lives OUTSIDE the repo in
 * production use (AGENT_KEY_FILE), is 600-perms, and is never printed,
 * logged or committed. Returns the raw key only to this process.
 */
export function loadAgentPrivateKey(keyFile: string): Hex {
  if (!existsSync(keyFile)) {
    throw new Error(
      `Agent key file not found: ${keyFile}. Generate the wallet first (npm run wallet:generate).`,
    );
  }
  const raw = readFileSync(keyFile, 'utf8').trim();
  if (!/^0x[0-9a-fA-F]{64}$/.test(raw)) {
    throw new Error('Agent key file does not contain a 0x-prefixed 32-byte private key.');
  }
  return raw as Hex;
}

/**
 * RPC override via env (CELO_RPC_URL / CELO_SEPOLIA_RPC_URL). The default
 * Celo Sepolia Forno endpoint timed out repeatedly from the build VM on
 * 8 Nov 2026 while a public alternative answered instantly — the chain
 * definition stays the same, only the transport URL changes.
 */
export function rpcUrlFor(chainName: ChainName): string | undefined {
  return chainName === 'celo'
    ? process.env.CELO_RPC_URL || undefined
    : process.env.CELO_SEPOLIA_RPC_URL || undefined;
}

export function getPublicClient(chainName: ChainName): PublicClient {
  return createPublicClient({
    chain: CHAINS[chainName],
    transport: http(rpcUrlFor(chainName)),
  }) as PublicClient;
}

/**
 * THE ONLY sending path in VetBrief (DESIGN). The wallet client is extended
 * with the ERC-8021 attribution suffix at construction time — before any
 * transaction exists — because an untagged transaction can never be
 * backfilled (SPEC FR3).
 */
export function createAgentWalletClient(
  privateKey: Hex,
  chainName: ChainName,
): { walletClient: WalletClient; address: Address } {
  const account = privateKeyToAccount(privateKey);
  const base = createWalletClient({
    account,
    chain: CHAINS[chainName],
    transport: http(rpcUrlFor(chainName)),
  });
  const walletClient = base.extend(withAttribution(ATTRIBUTION_TAG)) as unknown as WalletClient;
  return { walletClient, address: account.address };
}
