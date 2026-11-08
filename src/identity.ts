import {
  parseEventLogs,
  type Address,
  type Hex,
  type PublicClient,
  type WalletClient,
} from 'viem';
import { IDENTITY_REGISTRIES } from './config.js';
import type { ChainName } from './wallet.js';

/** Minimal ERC-8004 Identity Registry ABI (EIP-8004). */
export const IDENTITY_REGISTRY_ABI = [
  {
    type: 'function',
    name: 'register',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'agentURI', type: 'string' }],
    outputs: [{ name: 'agentId', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'setAgentURI',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'agentId', type: 'uint256' },
      { name: 'newURI', type: 'string' },
    ],
    outputs: [],
  },
  {
    type: 'event',
    name: 'Registered',
    inputs: [
      { name: 'agentId', type: 'uint256', indexed: true },
      { name: 'agentURI', type: 'string', indexed: false },
      { name: 'owner', type: 'address', indexed: true },
    ],
  },
] as const;

export interface RegistrationFile {
  type: string;
  name: string;
  description: string;
  services: Array<{ name: string; endpoint: string; version?: string }>;
  x402Support: boolean;
  active: boolean;
}

export function buildRegistrationFile(args: {
  walletAddress: Address;
  botEndpoint?: string;
}): RegistrationFile {
  return {
    type: 'https://eips.ethereum.org/EIPS/eip-8004#registration-v1',
    name: 'VetBrief',
    description:
      'Counterparty due-diligence agent. Send a company name, get a one-page brief bought from independent data sellers on Celo (LinkedIn, X, Reddit, onchain reads, inference synthesis). Built for Celo Agents on Open Rails — Build with buy.',
    services: [
      {
        name: 'telegram-bot',
        endpoint: args.botEndpoint ?? 'https://t.me/ (bot username pending BotFather setup)',
        version: '0.1.0',
      },
      { name: 'wallet', endpoint: args.walletAddress },
    ],
    x402Support: false,
    active: true,
  };
}

/** A data: URI is a spec-legal agentURI and removes any hosting dependency. */
export function registrationDataUri(file: RegistrationFile): string {
  return `data:application/json;base64,${Buffer.from(JSON.stringify(file)).toString('base64')}`;
}

export interface RegisterResult {
  agentId: bigint;
  txHash: Hex;
  registry: Address;
  agentRegistry: string;
}

/**
 * Register the agent identity. The agentId is read from the `Registered`
 * EVENT on the receipt — never from the simulated return value, which
 * Celo Docs warn can be wrong if another registration lands first
 * (SPEC FR4).
 */
export async function registerAgent(args: {
  walletClient: WalletClient;
  publicClient: PublicClient;
  chainName: ChainName;
  agentURI: string;
}): Promise<RegisterResult> {
  const registry = IDENTITY_REGISTRIES[args.chainName] as Address;
  const txHash = await args.walletClient.writeContract({
    address: registry,
    abi: IDENTITY_REGISTRY_ABI,
    functionName: 'register',
    args: [args.agentURI],
    chain: args.walletClient.chain,
    account: args.walletClient.account as never,
  } as never);
  const receipt = await args.publicClient.waitForTransactionReceipt({ hash: txHash });
  if (receipt.status !== 'success') {
    throw new Error(`ERC-8004 register() reverted: ${txHash}`);
  }
  const events = parseEventLogs({
    abi: IDENTITY_REGISTRY_ABI,
    eventName: 'Registered',
    logs: receipt.logs,
  });
  const evt = events[0] as unknown as { args: { agentId: bigint } } | undefined;
  if (!evt) {
    throw new Error(`No Registered event found in receipt for ${txHash}`);
  }
  const chainId = args.chainName === 'celo' ? 42220 : 11142220;
  return {
    agentId: evt.args.agentId,
    txHash,
    registry,
    agentRegistry: `eip155:${chainId}:${registry}`,
  };
}
