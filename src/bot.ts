import { Bot } from 'grammy';
import type { CounterpartyInput } from './sources.js';
import { TrialLedger } from './receipts.js';
import { SPEND_RAILS } from './config.js';

export const HELP_TEXT = `VetBrief — vet a counterparty before money moves.

Send:
/vet <Company Name>
/vet <Company Name>, linkedin=<company-slug>, profile=<linkedin-url>, x=<@handle>, wallet=<0x address>

You get a one-page brief: who they are, their public voice, their onchain footprint, risk flags and a verdict. Every fact in it is bought live from independent data sellers; the brief lists what was bought and the onchain proof.

Free trial: the first ${SPEND_RAILS.sponsoredTrialCap} briefs are sponsored. After that, briefs are paid — fund your own wallet with the Google Cloud Web3 USA₮ faucet (Self-verified, see usebuy.ai/docs) and pay per brief. We never fund user wallets.`;

/** Parse "/vet Acme, linkedin=acme, x=@acme, wallet=0x…" into pipeline input. */
export function parseVetCommand(text: string): CounterpartyInput | null {
  const m = text.trim().match(/^\/vet(?:@\w+)?\s+(.+)$/is);
  if (!m) return null;
  const parts = m[1].split(',').map((s) => s.trim()).filter(Boolean);
  if (parts.length === 0) return null;
  const input: CounterpartyInput = { name: parts[0] };
  for (const part of parts.slice(1)) {
    const kv = part.match(/^(\w+)\s*=\s*(.+)$/);
    if (!kv) continue;
    const [, key, value] = kv;
    if (key === 'linkedin') input.linkedinCompany = value;
    else if (key === 'profile') input.linkedinProfile = value;
    else if (key === 'x') input.xHandle = value;
    else if (key === 'wallet') input.walletAddress = value;
  }
  return input.name ? input : null;
}

export interface BriefRunnerFn {
  (input: CounterpartyInput, requester: string): Promise<{ markdown: string; briefId: string }>;
}

/**
 * Transport-independent bot brain. Unit-tested without Telegram; the
 * grammy wiring below is a thin shell over handleMessage.
 */
export class BotCore {
  constructor(
    private readonly runner: BriefRunnerFn,
    private readonly ledger: TrialLedger,
  ) {}

  async handleMessage(text: string, requester: string): Promise<string> {
    const trimmed = text.trim();
    if (trimmed.startsWith('/start') || trimmed.startsWith('/help')) return HELP_TEXT;
    const input = parseVetCommand(trimmed);
    if (!input) {
      return 'Send /vet <Company Name> to get a due-diligence brief. /help for the full format.';
    }
    if (!this.ledger.canSponsor()) {
      return `The sponsored trial is full (${SPEND_RAILS.sponsoredTrialCap} briefs served). Paid briefs come via the API — see /help.`;
    }
    const result = await this.runner(input, requester);
    // Record AFTER a successful brief: a failed run must not burn a trial slot.
    this.ledger.record({ at: new Date().toISOString(), requester, briefId: result.briefId });
    return result.markdown;
  }
}

/**
 * Entry point. Without TELEGRAM_BOT_TOKEN the bot runs in MOCK MODE:
 * it verifies the core loads, prints how to go live, and exits — it never
 * pretends to be serving users. With a token AND BOT_START=1 it polls
 * Telegram (a deliberately explicit switch; nothing here starts a
 * long-running process by accident).
 */
export async function main(): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.log(
      '[vetbrief bot] MOCK MODE — no TELEGRAM_BOT_TOKEN set. BotCore is loaded and tested; set the token (BotFather) and BOT_START=1 to serve live.',
    );
    return;
  }
  if (process.env.BOT_START !== '1') {
    console.log('[vetbrief bot] Token present but BOT_START!=1 — not polling (explicit-start rule).');
    return;
  }
  const { runBrief } = await import('./brief.js');
  const { BuyGateway } = await import('./buy.js');
  const { TrialLedger: Ledger } = await import('./receipts.js');
  const mode = process.env.BUY_MODE === 'mainnet' ? 'mainnet' : 'sandbox';
  const gateway = new BuyGateway(mode);
  const ledger = new Ledger('receipts/trial-ledger.json', SPEND_RAILS.sponsoredTrialCap);
  const core = new BotCore(
    async (input, requester) =>
      runBrief(gateway, input, {
        requester,
        mode,
        sanctionsEnabled: process.env.SANCTIONS_ENABLED === 'true',
        receiptsDir: 'receipts',
      }),
    ledger,
  );
  const bot = new Bot(token);
  bot.on('message:text', async (ctx) => {
    const reply = await core.handleMessage(ctx.message.text, `telegram:${ctx.from?.id ?? 'unknown'}`);
    await ctx.reply(reply, { parse_mode: 'Markdown' }).catch(() => ctx.reply(reply));
  });
  console.log('[vetbrief bot] live — polling Telegram.');
  await bot.start();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error('[vetbrief bot] fatal:', err);
    process.exit(1);
  });
}
