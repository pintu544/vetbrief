import { existsSync, writeFileSync, chmodSync } from 'node:fs';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

/**
 * Generate the ONE VetBrief agent wallet.
 * The private key is written ONLY to the output file (600 perms). It is
 * never printed. Only the public address is printed. Refuses to overwrite
 * an existing key file — there is one agent wallet, not a series of them.
 *
 * Usage: AGENT_KEY_FILE=/abs/path/agent-wallet-key.txt npm run wallet:generate
 */
function main(): void {
  const out = process.env.AGENT_KEY_FILE;
  if (!out) {
    console.error('Set AGENT_KEY_FILE to the key file path (outside the repo).');
    process.exit(2);
  }
  if (existsSync(out)) {
    console.error(`Key file already exists: ${out}. Refusing to create a second wallet.`);
    process.exit(1);
  }
  const key = generatePrivateKey();
  writeFileSync(out, key + '\n', { mode: 0o600 });
  chmodSync(out, 0o600);
  const account = privateKeyToAccount(key);
  console.log(`Agent wallet address: ${account.address}`);
  console.log('Private key written to the key file only (600 perms). It was not printed.');
}

main();
