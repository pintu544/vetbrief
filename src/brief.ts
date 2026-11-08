import { randomUUID } from 'node:crypto';
import { BuyGateway, SpendTracker, type BuyMode } from './buy.js';
import {
  chainstackWalletRead,
  cencoriSynthesize,
  ploidCompanyPosts,
  ploidProfilePosts,
  sanctionsScreen,
  tikhubRedditSearch,
  tikhubXSearch,
  type CounterpartyInput,
  type SourceOutcome,
  type SourceSection,
} from './sources.js';
import {
  explorerTxUrl,
  writeReceipt,
  type BriefReceipt,
  type PaymentRecord,
} from './receipts.js';

export interface BriefResult {
  briefId: string;
  markdown: string;
  receipt: BriefReceipt;
  receiptFile: string;
}

export interface RunBriefOptions {
  requester: string;
  mode: BuyMode;
  sanctionsEnabled: boolean;
  receiptsDir: string;
}

const SECTION_ORDER = [
  'linkedin-company',
  'linkedin-profile',
  'x-search',
  'reddit-search',
  'onchain',
  'sanctions',
  'verdict',
];

/** Rule-based fallback verdict when no bought synthesis is present. */
export function fallbackVerdict(sections: SourceSection[], payments: PaymentRecord[]): string {
  const emptySections = sections.filter((s) =>
    s.bullets.some((b) => /No (recent|notable|Reddit|hits)/.test(b)),
  ).length;
  const onchain = sections.find((s) => s.key === 'onchain');
  const unusedWallet = onchain?.bullets.some((b) => /Outgoing transactions: 0/.test(b)) ?? false;
  const screened = payments.find((p) => p.service.startsWith('Sanctions'));
  const notes: string[] = [];
  if (emptySections >= 3) notes.push('very thin public footprint across bought sources');
  if (unusedWallet) notes.push('supplied wallet shows no outgoing activity');
  if (screened?.skipped) notes.push('sanctions screen not run (route unverified)');
  if (notes.length === 0)
    return 'VERDICT: PROCEED — bought sources show a consistent public and onchain footprint, no flags raised.';
  return `VERDICT: PROCEED WITH CARE — ${notes.join('; ')}.`;
}

/** Assemble the one-page brief (pure — unit-tested against fixtures). */
export function assembleBrief(args: {
  input: CounterpartyInput;
  requester: string;
  createdAt: string;
  mode: BuyMode;
  agentWallet?: string;
  sections: SourceSection[];
  payments: PaymentRecord[];
}): string {
  const { input, sections, payments } = args;
  const ordered = [...sections].sort(
    (a, b) => SECTION_ORDER.indexOf(a.key) - SECTION_ORDER.indexOf(b.key),
  );
  const total = payments.reduce((sum, p) => sum + (p.skipped ? 0 : p.amountUsd), 0);
  const lines: string[] = [
    `# VetBrief — ${input.name}`,
    '',
    `Requested by: ${args.requester} · ${args.createdAt} · Network: ${args.mode === 'mainnet' ? 'Celo mainnet (42220)' : 'Celo Sepolia (sandbox rehearsal)'}`,
    '',
  ];
  for (const section of ordered) {
    if (section.key === 'verdict') continue; // verdict goes last, after the payments table position is decided below
    lines.push(`## ${section.title}`);
    for (const b of section.bullets) lines.push(`- ${b}`);
    lines.push('');
  }
  const skippedList = payments.filter((p) => p.skipped);
  if (skippedList.length > 0) {
    lines.push('## Not bought, and why');
    for (const p of skippedList) lines.push(`- ${p.service}: ${p.skipReason ?? 'skipped'}`);
    lines.push('');
  }
  const verdict = ordered.find((s) => s.key === 'verdict');
  lines.push('## Verdict');
  lines.push(verdict ? verdict.bullets.join('\n') : fallbackVerdict(ordered, payments));
  lines.push('');
  lines.push('## What this brief bought (proof of payment)');
  lines.push('| Service | Seller | Amount | Settlement |');
  lines.push('|---|---|---|---|');
  for (const p of payments) {
    if (p.skipped) continue;
    const proof = p.txHash ? `[tx](${explorerTxUrl(args.mode, p.txHash)})` : 'receipt pending';
    lines.push(`| ${p.service} | ${p.seller} | $${p.amountUsd.toFixed(3)} | ${proof} |`);
  }
  lines.push(`| **Total** | | **$${total.toFixed(3)}** | |`);
  lines.push('');
  if (args.agentWallet) lines.push(`Agent wallet (PayTo): ${args.agentWallet}`);
  lines.push('Every call above was bought through buy on Celo; settlement hashes come from `buy receipts --resolve`.');
  return lines.join('\n');
}

/**
 * The one brief pipeline shared by the CLI and the Telegram bot (SPEC FR1).
 * Sequential, capped, no retries: a source that throws fails the brief
 * loudly rather than silently producing a half-bought brief.
 */
export async function runBrief(
  gateway: BuyGateway,
  input: CounterpartyInput,
  opts: RunBriefOptions,
  agentWallet?: string,
): Promise<BriefResult> {
  const spend = new SpendTracker();
  const deps = { gateway, sanctionsEnabled: opts.sanctionsEnabled };
  const outcomes: SourceOutcome[] = [];

  outcomes.push(await ploidCompanyPosts(deps, spend, input));
  outcomes.push(await ploidProfilePosts(deps, spend, input));
  outcomes.push(await tikhubXSearch(deps, spend, input));
  outcomes.push(await tikhubRedditSearch(deps, spend, input));
  outcomes.push(await chainstackWalletRead(deps, spend, input));
  outcomes.push(await sanctionsScreen(deps, spend, input));

  const sectionsSoFar = outcomes.flatMap((o) => (o.section ? [o.section] : []));
  outcomes.push(await cencoriSynthesize(deps, spend, input, sectionsSoFar));

  const payments = outcomes.map((o) => o.payment);
  const sections = outcomes.flatMap((o) => (o.section ? [o.section] : []));
  const totalUsd = payments.reduce((s, p) => s + (p.skipped ? 0 : p.amountUsd), 0);
  const createdAt = new Date().toISOString();
  const briefId = `brief-${createdAt.slice(0, 10)}-${randomUUID().slice(0, 8)}`;

  const receipt: BriefReceipt = {
    briefId,
    createdAt,
    requester: opts.requester,
    counterparty: input.name,
    mode: opts.mode,
    payments,
    totalUsd,
  };
  const receiptFile = writeReceipt(opts.receiptsDir, receipt);
  const markdown = assembleBrief({
    input,
    requester: opts.requester,
    createdAt,
    mode: opts.mode,
    agentWallet,
    sections,
    payments,
  });
  return { briefId, markdown, receipt, receiptFile };
}
