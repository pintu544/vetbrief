import { readFileSync, writeFileSync } from 'node:fs';
import {
  buildRegistrationFile,
  registerAgent,
  registrationDataUri,
} from '../src/identity.js';
import {
  createAgentWalletClient,
  getPublicClient,
  loadAgentPrivateKey,
} from '../src/wallet.js';

/**
 * ERC-8004 registration REHEARSAL on Celo Sepolia ONLY.
 * This script has no mainnet path on purpose: the mainnet registration is
 * a Monday step after funding (spec TASKS Slice 2). The rehearsal proves
 * the identical flow — attribution-wrapped client, register(), agentId
 * from the Registered event — for testnet cents.
 *
 * Usage: AGENT_KEY_FILE=… npm run identity:register-sepolia
 * Writes the outcome to sepolia-agent.json (testnet artefact, labelled).
 */
async function main(): Promise<void> {
  const keyFile = process.env.AGENT_KEY_FILE;
  if (!keyFile) {
    console.error('Set AGENT_KEY_FILE.');
    process.exit(2);
  }
  const key = loadAgentPrivateKey(keyFile);
  const { walletClient, address } = createAgentWalletClient(key, 'celoSepolia');
  const publicClient = getPublicClient('celoSepolia');

  const balance = await publicClient.getBalance({ address });
  console.log(`Sepolia wallet: ${address}`);
  console.log(`Sepolia CELO balance: ${Number(balance) / 1e18}`);
  if (balance === 0n) {
    console.log(
      'BLOCKED: zero Sepolia CELO. Fund from https://faucet.celo.org/celo-sepolia (may need a human account step), then re-run.',
    );
    writeFileSync(
      'sepolia-agent.json',
      JSON.stringify(
        { status: 'blocked-zero-balance', wallet: address, chain: 'celo-sepolia', chainId: 11142220 },
        null,
        2,
      ) + '\n',
    );
    return;
  }

  const registration = JSON.parse(readFileSync('registration.json', 'utf8'));
  const agentURI = registrationDataUri(registration);
  const result = await registerAgent({
    walletClient,
    publicClient,
    chainName: 'celoSepolia',
    agentURI,
  });
  console.log(`Registered on Sepolia. agentId: ${result.agentId} tx: ${result.txHash}`);
  writeFileSync(
    'sepolia-agent.json',
    JSON.stringify(
      {
        status: 'registered',
        chain: 'celo-sepolia',
        chainId: 11142220,
        wallet: address,
        registry: result.registry,
        agentRegistry: result.agentRegistry,
        agentId: result.agentId.toString(),
        txHash: result.txHash,
        explorer: `https://celo-sepolia.blockscout.com/tx/${result.txHash}`,
      },
      null,
      2,
    ) + '\n',
  );
}

main().catch((err) => {
  console.error('[register-sepolia] failed:', err instanceof Error ? err.message : err);
  process.exit(1);
});
