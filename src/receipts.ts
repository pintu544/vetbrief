import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';
import { CELOSCAN_BASE, SEPOLIA_EXPLORER_BASE } from './config.js';
import type { BuyMode } from './buy.js';

export interface PaymentRecord {
  service: string;
  seller: string;
  route: string;
  amountUsd: number;
  txHash?: string;
  skipped?: boolean;
  skipReason?: string;
}

export interface BriefReceipt {
  briefId: string;
  createdAt: string;
  requester: string;
  counterparty: string;
  mode: BuyMode;
  payments: PaymentRecord[];
  totalUsd: number;
}

export function explorerTxUrl(mode: BuyMode, txHash: string): string {
  return mode === 'mainnet'
    ? `${CELOSCAN_BASE}/tx/${txHash}`
    : `${SEPOLIA_EXPLORER_BASE}/tx/${txHash}`;
}

export function renderIndexRow(r: BriefReceipt): string {
  const services = r.payments
    .filter((p) => !p.skipped)
    .map((p) => p.service)
    .join('; ');
  const proofs = r.payments
    .filter((p) => p.txHash)
    .map((p) => `[tx](${explorerTxUrl(r.mode, p.txHash as string)})`)
    .join(' ');
  return `| ${r.createdAt} | ${r.requester} | ${r.counterparty} | ${services} | $${r.totalUsd.toFixed(3)} | ${proofs} |`;
}

const INDEX_HEADER = `# VetBrief — receipts index

Every brief, who asked for it, what it bought and the onchain proof.
Settlement hashes come from \`buy receipts --resolve\`.

| When (UTC) | Requester | Counterparty | Services bought | Total | Proof |
|---|---|---|---|---|---|
`;

/** Write receipts/<briefId>.json and append the row to receipts/INDEX.md. */
export function writeReceipt(receiptsDir: string, receipt: BriefReceipt): string {
  mkdirSync(receiptsDir, { recursive: true });
  const file = join(receiptsDir, `${receipt.briefId}.json`);
  writeFileSync(file, JSON.stringify(receipt, null, 2) + '\n');
  const indexFile = join(receiptsDir, 'INDEX.md');
  if (!existsSync(indexFile)) writeFileSync(indexFile, INDEX_HEADER);
  appendFileSync(indexFile, renderIndexRow(receipt) + '\n');
  return file;
}

/**
 * Sponsored-trial ledger (SPEC FR6: cap of 10 sponsored briefs). Persisted
 * as a JSON file so the cap survives bot restarts. This log is also the
 * Demand evidence: every sponsored brief records its requester.
 */
export interface TrialLedgerEntry {
  at: string;
  requester: string;
  briefId: string;
}

export class TrialLedger {
  private entries: TrialLedgerEntry[] = [];
  constructor(
    private readonly file: string,
    private readonly cap: number,
  ) {
    if (existsSync(file)) {
      try {
        this.entries = JSON.parse(readFileSync(file, 'utf8')) as TrialLedgerEntry[];
      } catch {
        this.entries = [];
      }
    }
  }

  get used(): number {
    return this.entries.length;
  }

  canSponsor(): boolean {
    return this.entries.length < this.cap;
  }

  record(entry: TrialLedgerEntry): void {
    if (!this.canSponsor()) {
      throw new Error(`Sponsored trial cap reached (${this.cap}). No further free briefs.`);
    }
    this.entries.push(entry);
    mkdirSync(join(this.file, '..'), { recursive: true });
    writeFileSync(this.file, JSON.stringify(this.entries, null, 2) + '\n');
  }
}
