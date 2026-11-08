import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { ALLOWED_ROUTES, ROUTES, SPEND_RAILS } from './config.js';

export type BuyMode = 'sandbox' | 'mainnet';

export interface CommandResult {
  stdout: string;
  stderr: string;
}

/** Injectable so tests never shell out (and never pay). */
export type CommandRunner = (file: string, args: string[]) => Promise<CommandResult>;

export const defaultRunner: CommandRunner = (file, args) =>
  new Promise((resolve, reject) => {
    execFile(
      file,
      args,
      { maxBuffer: 16 * 1024 * 1024, timeout: 180_000 },
      (err, stdout, stderr) => {
        if (err) {
          reject(
            new Error(
              `buy command failed (${file} ${args[0] ?? ''}): ${stderr?.toString() || err.message}`,
            ),
          );
          return;
        }
        resolve({ stdout: stdout.toString(), stderr: stderr.toString() });
      },
    );
  });

export function resolveBuyBin(): string {
  if (process.env.BUY_BIN) return process.env.BUY_BIN;
  // Project-local install only (never a global): node_modules/.bin/buy
  return fileURLToPath(new URL('../node_modules/.bin/buy', import.meta.url));
}

export class SpendRailError extends Error {
  constructor(
    public code:
      | 'ROUTE_NOT_ALLOWED'
      | 'OVER_CALL_CAP'
      | 'OVER_BRIEF_CAP'
      | 'QUOTE_UNPARSEABLE',
    message: string,
  ) {
    super(message);
    this.name = 'SpendRailError';
  }
}

/**
 * Per-brief spend tracker enforcing SPEC FR6 rails. Every paid call in a
 * brief MUST go through assertCanSpend (on its quote) then record (on its
 * settlement). There is no bypass: sources only ever receive a gateway
 * whose pay() does both.
 */
export class SpendTracker {
  private spent = 0;
  constructor(
    private readonly rails = SPEND_RAILS,
    private readonly allowedRoutes: ReadonlySet<string> = ALLOWED_ROUTES,
  ) {}

  get spentUsd(): number {
    return this.spent;
  }

  assertCanSpend(route: string, quoteUsd: number): void {
    if (!this.allowedRoutes.has(route)) {
      throw new SpendRailError(
        'ROUTE_NOT_ALLOWED',
        `Route is not on the VetBrief allowlist: ${route}`,
      );
    }
    if (quoteUsd > this.rails.perCallMaxUsd) {
      throw new SpendRailError(
        'OVER_CALL_CAP',
        `Quote $${quoteUsd} for ${ROUTES[route]?.service ?? route} exceeds the per-call cap of $${this.rails.perCallMaxUsd}. Refused before signing.`,
      );
    }
    if (this.spent + quoteUsd > this.rails.perBriefMaxUsd) {
      throw new SpendRailError(
        'OVER_BRIEF_CAP',
        `Brief budget exceeded: already spent $${this.spent.toFixed(3)}, quote $${quoteUsd}, cap $${this.rails.perBriefMaxUsd}. Refused before signing.`,
      );
    }
  }

  record(amountUsd: number): void {
    this.spent += amountUsd;
  }
}

/**
 * Parse the USD amount out of `buy quote` output. The 402 challenge is
 * authoritative: JSON bodies carry accepts[].maxAmountRequired in atomic
 * units (6 decimals). Human output carries a $-figure. Anything else is a
 * hard error — we never guess a price we are about to pay.
 */
export function parseQuoteAmountUsd(output: string): number {
  const jsonStart = output.indexOf('{');
  if (jsonStart >= 0) {
    try {
      const parsed = JSON.parse(output.slice(jsonStart)) as Record<string, unknown>;
      const accepts = (parsed?.accepts ?? parsed?.offers) as
        | Array<Record<string, unknown>>
        | undefined;
      if (Array.isArray(accepts) && accepts.length > 0) {
        const atomics = accepts
          .map((a) => Number(a.maxAmountRequired ?? a.amount ?? NaN))
          .filter((n) => Number.isFinite(n));
        if (atomics.length > 0) return Math.max(...atomics) / 1_000_000;
      }
      const direct = Number(parsed?.amount ?? parsed?.price ?? NaN);
      if (Number.isFinite(direct) && direct > 0) return direct;
    } catch {
      // fall through to the $ regex
    }
  }
  const dollar = output.match(/\$\s*(\d+(?:\.\d+)?)/);
  if (dollar) return Number(dollar[1]);
  const bare = output.match(/(\d+\.\d{2,6})\s*(?:USDC|USD|USAT|USDT)\b/i);
  if (bare) return Number(bare[1]);
  throw new SpendRailError(
    'QUOTE_UNPARSEABLE',
    `Could not parse a USD amount from buy quote output: ${output.slice(0, 200)}`,
  );
}

/** Extract settlement tx hashes (0x + 64 hex) from `buy receipts` output, newest first. */
export function parseReceiptTxHashes(output: string): string[] {
  return output.match(/0x[0-9a-fA-F]{64}/g) ?? [];
}

export interface PaidCallResult {
  route: string;
  service: string;
  seller: string;
  amountUsd: number;
  /** Parsed JSON (or raw text) returned by the paid route. */
  data: unknown;
  /** Settlement transaction hash from buy receipts, when resolvable. */
  txHash?: string;
}

/**
 * The ONLY payment path in VetBrief (DESIGN): quote → rail check → pay →
 * receipts. No retries anywhere: a failed paid call throws and the brief
 * reports the gap (SPEC: no blind retry).
 */
export class BuyGateway {
  constructor(
    private readonly mode: BuyMode,
    private readonly runner: CommandRunner = defaultRunner,
    private readonly buyBin: string = resolveBuyBin(),
    private readonly account: string = process.env.BUY_ACCOUNT ?? 'vetbrief',
  ) {}

  private modeArgs(): string[] {
    // --account matters: without it, sandbox calls pay from the CLI's
    // built-in `sandbox` wallet, NOT the VetBrief agent wallet.
    return [
      ...(this.mode === 'sandbox' ? ['--sandbox'] : []),
      '--account',
      this.account,
    ];
  }

  private curlArgs(route: string, body: unknown): string[] {
    return [
      '-sS',
      '-X',
      'POST',
      route,
      '-H',
      'content-type: application/json',
      '-d',
      JSON.stringify(body ?? {}),
    ];
  }

  async quote(route: string, body: unknown): Promise<number> {
    const { stdout, stderr } = await this.runner(this.buyBin, [
      ...this.modeArgs(),
      'quote',
      ...this.curlArgs(route, body),
    ]);
    return parseQuoteAmountUsd(stdout || stderr);
  }

  async receipts(limit = 10): Promise<{ raw: string; txHashes: string[] }> {
    const { stdout } = await this.runner(this.buyBin, [
      ...this.modeArgs(),
      'receipts',
      '--limit',
      String(limit),
      '--resolve',
    ]);
    return { raw: stdout, txHashes: parseReceiptTxHashes(stdout) };
  }

  /**
   * Pay for one call. Enforces the rails against the LIVE quote (never the
   * catalogue price) before any signing happens.
   */
  async pay(spend: SpendTracker, route: string, body: unknown): Promise<PaidCallResult> {
    const info = ROUTES[route];
    if (!info) {
      throw new SpendRailError('ROUTE_NOT_ALLOWED', `Route not on the allowlist: ${route}`);
    }
    const quoteUsd = await this.quote(route, body);
    spend.assertCanSpend(route, quoteUsd);

    const { stdout } = await this.runner(this.buyBin, [
      ...this.modeArgs(),
      'curl',
      '--max-amount',
      String(quoteUsd),
      ...this.curlArgs(route, body),
    ]);
    spend.record(quoteUsd);

    let data: unknown = stdout;
    try {
      data = JSON.parse(stdout);
    } catch {
      // keep raw text; sources normalise defensively
    }

    let txHash: string | undefined;
    try {
      const r = await this.receipts(10);
      txHash = r.txHashes[0];
    } catch {
      // Receipt resolution is best-effort at call time; the receipts file
      // can be re-resolved later with `buy receipts --resolve`.
    }

    return { route, service: info.service, seller: info.seller, amountUsd: quoteUsd, data, txHash };
  }
}
