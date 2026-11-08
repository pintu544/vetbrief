/**
 * Vercel serverless entry — deploy adaptation ONLY (8 Nov 2026).
 *
 * The canonical runtime is the long-lived Express server (`npm start`,
 * see src/server.ts). Vercel cannot host a long-lived server, so this
 * file wraps the exact same Express app (`createApp`) as a serverless
 * function. No business logic lives here; behaviour, spend rails and the
 * REHEARSAL labelling are identical to the server runtime.
 *
 * vercel.json rewrites /api/* to this function; the static UI in
 * public/ is served by Vercel directly.
 *
 * Deployed in REHEARSAL mode: BUY_MODE=mock (fixture gateway, $0 spent),
 * RECEIPTS_DIR=/tmp/receipts (the function filesystem is read-only apart
 * from /tmp). Do NOT set AGENT_PRIVATE_KEY on this deployment.
 */
import { join } from 'node:path';
import type { Express } from 'express';
import { createApp, resolveServerDeps, type ServerDeps } from '../src/server.js';
import { fixtureGateway } from '../src/fixtureGateway.js';
import { TrialLedger } from '../src/receipts.js';
import { SPEND_RAILS } from '../src/config.js';

function resolveDeps(): ServerDeps {
  try {
    return resolveServerDeps();
  } catch {
    // Fixture JSONs could not be read in the function bundle — fall back
    // to an empty fixture gateway so /api/status still answers honestly
    // and /api/brief returns a labelled failure instead of a crash.
    const receiptsDir = process.env.RECEIPTS_DIR ?? '/tmp/receipts';
    return {
      gateway: fixtureGateway(new Map(), 'sandbox'),
      mode: 'mock',
      receiptsDir,
      ledger: new TrialLedger(
        join(receiptsDir, 'trial-ledger.json'),
        SPEND_RAILS.sponsoredTrialCap,
      ),
      agentWallet: process.env.AGENT_WALLET_ADDRESS,
    };
  }
}

const app: Express = createApp(resolveDeps());

export default app;
