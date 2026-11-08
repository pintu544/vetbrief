// VetBrief — central constants. Everything the spec pins down lives here:
// spend rails, the route allowlist, chain/registry addresses and the
// ERC-8021 attribution tag issued at hackathon enrolment.

export const ATTRIBUTION_TAG = 'celo_a0202d2af02f';

export const GATEWAY_BASE = 'https://gateway.usebuy.ai';
export const CHAINSTACK_ROUTE = `${GATEWAY_BASE}/chainstack/celo`;
export const CENCORI_ROUTE = `${GATEWAY_BASE}/cencori/v1/chat/completions`;
// UNVERIFIED route — the sanctions seller (via Agent402) has no confirmed
// gateway path or Celo settlement rail yet (spec/research-winning.md).
// The route exists in the allowlist ONLY so the flag-gated source has
// somewhere to point; the sanctions feature flag defaults OFF and the
// route is never called until Monday's Slice-0 verification passes.
export const SANCTIONS_ROUTE = `${GATEWAY_BASE}/v1/screening/sanctions`;

export interface RouteInfo {
  service: string;
  seller: string;
  /** Verified catalogue price in USD (gateway catalog, 8 Nov 2026). */
  catalogPriceUsd: number;
}

/** The ONLY routes brief code may pay for. Anything else is refused. */
export const ROUTES: Record<string, RouteInfo> = {
  [`${GATEWAY_BASE}/v1/social/linkedin/company/posts`]: {
    service: 'Ploid LinkedIn company posts',
    seller: 'Ploid (ERC-8004 #9898)',
    catalogPriceUsd: 0.023,
  },
  [`${GATEWAY_BASE}/v1/social/linkedin/profile/posts`]: {
    service: 'Ploid LinkedIn profile posts',
    seller: 'Ploid (ERC-8004 #9898)',
    catalogPriceUsd: 0.023,
  },
  [`${GATEWAY_BASE}/v1/social/x/posts/search`]: {
    service: 'TikHub X posts search',
    seller: 'TikHub (ERC-8004 #9895)',
    catalogPriceUsd: 0.005,
  },
  [`${GATEWAY_BASE}/v1/social/reddit/posts/search`]: {
    service: 'TikHub Reddit posts search',
    seller: 'TikHub (ERC-8004 #9895)',
    catalogPriceUsd: 0.005,
  },
  [CHAINSTACK_ROUTE]: {
    service: 'Chainstack Celo RPC (batched read)',
    seller: 'Chainstack (buy partner route)',
    catalogPriceUsd: 0.01,
  },
  [CENCORI_ROUTE]: {
    service: 'Cencori inference (synthesis)',
    seller: 'Cencori (buy partner route)',
    catalogPriceUsd: 0.01,
  },
  [SANCTIONS_ROUTE]: {
    service: 'Sanctions / address screening',
    seller: 'Agent402 (UNVERIFIED rail)',
    catalogPriceUsd: 0.005,
  },
};

export const ALLOWED_ROUTES = new Set(Object.keys(ROUTES));

/** Spend rails — SPEC FR6 / GRILL Q7. These are hard limits, not targets. */
export const SPEND_RAILS = {
  /** No single paid call may exceed this, whatever the quote says. */
  perCallMaxUsd: 0.03,
  /** One brief may never cost more than this in total. */
  perBriefMaxUsd: 0.12,
  /** Sponsored (free-trial) briefs served by the bot, total. */
  sponsoredTrialCap: 10,
} as const;

/** ERC-8004 Identity Registries (research §2.2). */
export const IDENTITY_REGISTRIES = {
  celo: '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432',
  celoSepolia: '0x8004A818BFB912233c491871b3d84c89A494BD9e',
} as const;

export const CELOSCAN_BASE = 'https://celoscan.io';
export const SEPOLIA_EXPLORER_BASE = 'https://celo-sepolia.blockscout.com';
