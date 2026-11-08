import {
  BuyGateway,
  SpendTracker,
  type PaidCallResult,
} from './buy.js';
import {
  CHAINSTACK_ROUTE,
  CENCORI_ROUTE,
  GATEWAY_BASE,
  SANCTIONS_ROUTE,
} from './config.js';
import type { PaymentRecord } from './receipts.js';

export interface CounterpartyInput {
  name: string;
  linkedinCompany?: string;
  linkedinProfile?: string;
  xHandle?: string;
  walletAddress?: string;
}

export interface SourceSection {
  key: string;
  title: string;
  bullets: string[];
  /** Short raw extract kept for the synthesis prompt. */
  rawExtract: string;
}

export interface SourceOutcome {
  section?: SourceSection;
  payment: PaymentRecord;
}

const asRecord = (p: PaidCallResult): PaymentRecord => ({
  service: p.service,
  seller: p.seller,
  route: p.route,
  amountUsd: p.amountUsd,
  txHash: p.txHash,
});

const skipped = (service: string, seller: string, route: string, reason: string): SourceOutcome => ({
  payment: { service, seller, route, amountUsd: 0, skipped: true, skipReason: reason },
});

/** Pull the first array found under common response keys. */
export function extractItems(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) return data as Record<string, unknown>[];
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    for (const key of ['posts', 'results', 'data', 'items', 'records']) {
      const v = obj[key];
      if (Array.isArray(v)) return v as Record<string, unknown>[];
      if (v && typeof v === 'object') {
        const nested = extractItems(v);
        if (nested.length > 0) return nested;
      }
    }
  }
  return [];
}

function itemText(item: Record<string, unknown>): string {
  const text =
    (item.text as string) ??
    (item.content as string) ??
    (item.title as string) ??
    (item.body as string) ??
    JSON.stringify(item);
  return String(text).replace(/\s+/g, ' ').slice(0, 240);
}

function postsSection(
  key: string,
  title: string,
  data: unknown,
  emptyNote: string,
): SourceSection {
  const items = extractItems(data);
  const bullets =
    items.length > 0 ? items.slice(0, 5).map(itemText) : [emptyNote];
  return {
    key,
    title,
    bullets,
    rawExtract: bullets.join('\n').slice(0, 1500),
  };
}

export const LINKEDIN_COMPANY_ROUTE = `${GATEWAY_BASE}/v1/social/linkedin/company/posts`;
export const LINKEDIN_PROFILE_ROUTE = `${GATEWAY_BASE}/v1/social/linkedin/profile/posts`;
export const X_SEARCH_ROUTE = `${GATEWAY_BASE}/v1/social/x/posts/search`;
export const REDDIT_SEARCH_ROUTE = `${GATEWAY_BASE}/v1/social/reddit/posts/search`;

export interface SourcesDeps {
  gateway: BuyGateway;
  sanctionsEnabled: boolean;
}

/** Ploid — what the company itself has been saying on LinkedIn. */
export async function ploidCompanyPosts(
  deps: SourcesDeps,
  spend: SpendTracker,
  input: CounterpartyInput,
): Promise<SourceOutcome> {
  const company = input.linkedinCompany ?? input.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const paid = await deps.gateway.pay(spend, LINKEDIN_COMPANY_ROUTE, { company });
  return {
    payment: asRecord(paid),
    section: postsSection(
      'linkedin-company',
      'Who they are (LinkedIn, company voice)',
      paid.data,
      `No recent company posts found for "${company}".`,
    ),
  };
}

/** Ploid — the principal's own LinkedIn voice. Needs a profile to look up. */
export async function ploidProfilePosts(
  deps: SourcesDeps,
  spend: SpendTracker,
  input: CounterpartyInput,
): Promise<SourceOutcome> {
  if (!input.linkedinProfile) {
    return skipped(
      'Ploid LinkedIn profile posts',
      'Ploid (ERC-8004 #9898)',
      LINKEDIN_PROFILE_ROUTE,
      'No LinkedIn profile supplied for the counterparty principal; not bought.',
    );
  }
  const paid = await deps.gateway.pay(spend, LINKEDIN_PROFILE_ROUTE, {
    profile: input.linkedinProfile,
    limit: 10,
  });
  return {
    payment: asRecord(paid),
    section: postsSection(
      'linkedin-profile',
      'The principal in public (LinkedIn)',
      paid.data,
      'No recent profile posts found.',
    ),
  };
}

/** TikHub — public X conversation about the counterparty. */
export async function tikhubXSearch(
  deps: SourcesDeps,
  spend: SpendTracker,
  input: CounterpartyInput,
): Promise<SourceOutcome> {
  const query = input.xHandle ? `${input.xHandle} OR "${input.name}"` : `"${input.name}"`;
  const paid = await deps.gateway.pay(spend, X_SEARCH_ROUTE, { query, type: 'top' });
  return {
    payment: asRecord(paid),
    section: postsSection(
      'x-search',
      'Public voice on X',
      paid.data,
      'No notable X posts found.',
    ),
  };
}

/** TikHub — Reddit mentions: where complaints and praise surface first. */
export async function tikhubRedditSearch(
  deps: SourcesDeps,
  spend: SpendTracker,
  input: CounterpartyInput,
): Promise<SourceOutcome> {
  const paid = await deps.gateway.pay(spend, REDDIT_SEARCH_ROUTE, {
    query: input.name,
    type: 'post',
    sort: 'relevance',
  });
  return {
    payment: asRecord(paid),
    section: postsSection(
      'reddit-search',
      'Reddit mentions',
      paid.data,
      'No Reddit mentions found (a neutral signal, not a red flag by itself).',
    ),
  };
}

/**
 * Chainstack — ONE batched JSON-RPC body (balance + transaction count +
 * latest block) for the counterparty's wallet. One payment, three reads.
 * Without a wallet address there is nothing to read, so nothing is bought.
 */
export async function chainstackWalletRead(
  deps: SourcesDeps,
  spend: SpendTracker,
  input: CounterpartyInput,
): Promise<SourceOutcome> {
  if (!input.walletAddress) {
    return skipped(
      'Chainstack Celo RPC (batched read)',
      'Chainstack (buy partner route)',
      CHAINSTACK_ROUTE,
      'No wallet address supplied; nothing to read, not bought.',
    );
  }
  const addr = input.walletAddress;
  const batch = [
    { jsonrpc: '2.0', id: 1, method: 'eth_getBalance', params: [addr, 'latest'] },
    { jsonrpc: '2.0', id: 2, method: 'eth_getTransactionCount', params: [addr, 'latest'] },
    { jsonrpc: '2.0', id: 3, method: 'eth_blockNumber', params: [] },
  ];
  const paid = await deps.gateway.pay(spend, CHAINSTACK_ROUTE, batch);
  const results = extractItems(paid.data) as Array<{ id?: number; result?: string }>;
  const byId = new Map(results.map((r) => [r.id, r.result]));
  const balanceCelo = byId.get(1) ? Number(BigInt(byId.get(1) as string)) / 1e18 : undefined;
  const txCount = byId.get(2) ? Number(BigInt(byId.get(2) as string)) : undefined;
  const block = byId.get(3) ? Number(BigInt(byId.get(3) as string)) : undefined;
  const bullets = [
    `Wallet ${addr}`,
    balanceCelo !== undefined ? `CELO balance: ${balanceCelo.toFixed(4)}` : 'CELO balance: unreadable',
    txCount !== undefined ? `Outgoing transactions: ${txCount}` : 'Transaction count: unreadable',
    block !== undefined ? `Read at block ${block}` : 'Block number: unreadable',
    txCount === 0 ? 'Brand-new or unused wallet — treat counterparty claims with care.' : '',
  ].filter(Boolean);
  return {
    payment: asRecord(paid),
    section: {
      key: 'onchain',
      title: 'Onchain footprint (Celo, via Chainstack)',
      bullets,
      rawExtract: bullets.join('\n'),
    },
  };
}

/**
 * Sanctions screen — FEATURE-FLAGGED OFF until Monday's verification
 * (availability + Celo settlement rail are both UNVERIFIED). When off, the
 * brief says so plainly and no money moves.
 */
export async function sanctionsScreen(
  deps: SourcesDeps,
  spend: SpendTracker,
  input: CounterpartyInput,
): Promise<SourceOutcome> {
  if (!deps.sanctionsEnabled) {
    return skipped(
      'Sanctions / address screening',
      'Agent402 (UNVERIFIED rail)',
      SANCTIONS_ROUTE,
      'Sanctions route unverified (availability + Celo rail); screen not run, not bought.',
    );
  }
  const paid = await deps.gateway.pay(spend, SANCTIONS_ROUTE, {
    name: input.name,
    address: input.walletAddress,
  });
  return {
    payment: asRecord(paid),
    section: postsSection(
      'sanctions',
      'Sanctions screen',
      paid.data,
      'Screen returned no hits.',
    ),
  };
}

/**
 * Cencori — the bought synthesis. Takes every other bought section and
 * produces the verdict. If synthesis fails, brief.ts falls back to a
 * rule-based verdict and says so.
 */
export async function cencoriSynthesize(
  deps: SourcesDeps,
  spend: SpendTracker,
  input: CounterpartyInput,
  sections: SourceSection[],
): Promise<SourceOutcome> {
  const context = sections.map((s) => `## ${s.title}\n${s.rawExtract}`).join('\n\n');
  const body = {
    model: 'maximo-atlas-1.3',
    max_tokens: 1024,
    messages: [
      {
        role: 'system',
        content:
          'You write one-paragraph counterparty due-diligence verdicts. Use ONLY the supplied evidence. End with a line: VERDICT: PROCEED, PROCEED WITH CARE, or DO NOT PROCEED — with a one-line reason.',
      },
      {
        role: 'user',
        content: `Counterparty: ${input.name}\n\nEvidence bought for this brief:\n\n${context}\n\nWrite the verdict paragraph.`,
      },
    ],
  };
  const paid = await deps.gateway.pay(spend, CENCORI_ROUTE, body);
  const data = paid.data as { choices?: Array<{ message?: { content?: string } }> };
  const text =
    data?.choices?.[0]?.message?.content ??
    (typeof paid.data === 'string' ? paid.data : 'Synthesis returned no text.');
  return {
    payment: asRecord(paid),
    section: {
      key: 'verdict',
      title: 'Verdict (synthesised by Cencori)',
      bullets: [String(text).slice(0, 1200)],
      rawExtract: String(text).slice(0, 1200),
    },
  };
}
