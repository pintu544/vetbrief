import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { BotCore, parseVetCommand } from '../src/bot.js';
import { TrialLedger, writeReceipt, type BriefReceipt } from '../src/receipts.js';
import { SPEND_RAILS } from '../src/config.js';

describe('parseVetCommand', () => {
  it('parses name only', () => {
    expect(parseVetCommand('/vet Acme Corp')).toEqual({ name: 'Acme Corp' });
  });

  it('parses all key=value parts', () => {
    const input = parseVetCommand(
      '/vet Acme Corp, linkedin=acme-corp, profile=https://linkedin.com/in/ada, x=@acme, wallet=0x1111111111111111111111111111111111111111',
    );
    expect(input).toEqual({
      name: 'Acme Corp',
      linkedinCompany: 'acme-corp',
      linkedinProfile: 'https://linkedin.com/in/ada',
      xHandle: '@acme',
      walletAddress: '0x1111111111111111111111111111111111111111',
    });
  });

  it('rejects non-commands', () => {
    expect(parseVetCommand('hello')).toBeNull();
    expect(parseVetCommand('/vet')).toBeNull();
  });
});

describe('BotCore sponsored trial', () => {
  function setup() {
    const dir = mkdtempSync(join(tmpdir(), 'vetbrief-bot-'));
    const ledger = new TrialLedger(join(dir, 'trial.json'), SPEND_RAILS.sponsoredTrialCap);
    const runner = async (input: { name: string }, _requester: string) => ({
      markdown: `# VetBrief — ${input.name}`,
      briefId: `brief-${input.name}`,
    });
    return { ledger, core: new BotCore(runner as never, ledger) };
  }

  it('serves help without spending a trial slot', async () => {
    const { core, ledger } = setup();
    const reply = await core.handleMessage('/help', 'telegram:1');
    expect(reply).toContain('VetBrief');
    expect(ledger.used).toBe(0);
  });

  it('serves a brief and records the requester', async () => {
    const { core, ledger } = setup();
    const reply = await core.handleMessage('/vet Acme Corp', 'telegram:42');
    expect(reply).toContain('Acme Corp');
    expect(ledger.used).toBe(1);
  });

  it('refuses once the sponsored cap is reached', async () => {
    const { core, ledger } = setup();
    for (let i = 0; i < SPEND_RAILS.sponsoredTrialCap; i++) {
      ledger.record({ at: new Date().toISOString(), requester: `t:${i}`, briefId: `b${i}` });
    }
    const reply = await core.handleMessage('/vet Late Corp', 'telegram:99');
    expect(reply).toContain('sponsored trial is full');
    expect(ledger.used).toBe(SPEND_RAILS.sponsoredTrialCap);
  });
});

describe('TrialLedger persistence + receipts writing', () => {
  it('persists across instances and enforces the cap', () => {
    const dir = mkdtempSync(join(tmpdir(), 'vetbrief-ledger-'));
    const file = join(dir, 'trial.json');
    const a = new TrialLedger(file, 2);
    a.record({ at: 't', requester: 'r1', briefId: 'b1' });
    const b = new TrialLedger(file, 2);
    expect(b.used).toBe(1);
    b.record({ at: 't', requester: 'r2', briefId: 'b2' });
    expect(b.canSponsor()).toBe(false);
    expect(() => b.record({ at: 't', requester: 'r3', briefId: 'b3' })).toThrowError(/cap reached/);
  });

  it('writeReceipt writes JSON + INDEX row', () => {
    const dir = mkdtempSync(join(tmpdir(), 'vetbrief-receipts-'));
    const receipt: BriefReceipt = {
      briefId: 'brief-test-1',
      createdAt: '2026-11-08T00:00:00.000Z',
      requester: 'test',
      counterparty: 'Acme Corp',
      mode: 'mainnet',
      totalUsd: 0.076,
      payments: [
        {
          service: 'Ploid LinkedIn company posts',
          seller: 'Ploid (ERC-8004 #9898)',
          route: 'r',
          amountUsd: 0.023,
          txHash: '0x' + 'ab'.repeat(32),
        },
      ],
    };
    const file = writeReceipt(dir, receipt);
    expect(existsSync(file)).toBe(true);
    const parsed = JSON.parse(readFileSync(file, 'utf8')) as BriefReceipt;
    expect(parsed.counterparty).toBe('Acme Corp');
    const index = readFileSync(join(dir, 'INDEX.md'), 'utf8');
    expect(index).toContain('celoscan.io/tx/0x' + 'ab'.repeat(32));
  });
});
