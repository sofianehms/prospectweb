import path from 'path';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';

if (process.env.NODE_ENV !== 'test') {
  dotenv.config({ path: path.resolve(__dirname, '../../.env') });
}

import * as Sentry from '@sentry/node';

if (process.env.SENTRY_DSN && process.env.NODE_ENV !== 'test') {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 0.2,
    sendDefaultPii: false,
    beforeSend(event) {
      if (event.user) {
        delete event.user.ip_address;
        delete event.user.email;
      }
      return event;
    },
  });
}

import searchRouter from './routes/search';
import authRouter from './routes/auth';
import autocompleteRouter from './routes/autocomplete';
import prospectsRouter from './routes/prospects';
import establishmentRouter from './routes/establishment';
import historyRouter from './routes/history';
import plansRouter from './routes/plans';
import billingRouter from './routes/billing';
import publicApiRouter from './routes/publicApi';
import { stripeWebhookHandler } from './routes/stripeWebhook';
import { getUsage } from './services/googleQuota';
import { getUserUsage, getAllUsersUsage, getUserUsageHistory, getAllUsersUsagePeriod, getUserTotalCalls } from './services/userQuota';
import { requireAuth, requireAdmin } from './middleware/requireAuth';

export const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 4000;

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));

app.post('/api/billing/webhook', express.raw({ type: 'application/json' }), stripeWebhookHandler);

app.use(express.json());

app.use((req, _res, next) => {
  if (req.user?.sub) {
    Sentry.setUser({ id: req.user.sub });
  }
  next();
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRouter);

app.get('/api/usage', requireAuth, requireAdmin, async (_req, res) => {
  const now = new Date();
  const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const today = now.toISOString().slice(0, 10);
  const periodUsers = await getAllUsersUsagePeriod(startOfMonth, today);
  res.json({ global: getUsage(), users: getAllUsersUsage(), period: { from: startOfMonth, to: today, users: periodUsers } });
});

app.get('/api/ops', requireAuth, requireAdmin, async (_req, res) => {
  const { getBreakerStatus } = await import('./services/places');
  const { getUsageFromStore } = await import('./services/googleQuota');
  const now = new Date();
  const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const today = now.toISOString().slice(0, 10);
  const [breaker, googleQuota, periodUsers] = await Promise.all([
    getBreakerStatus(),
    getUsageFromStore(),
    getAllUsersUsagePeriod(startOfMonth, today),
  ]);
  const planBreakdown: Record<string, { users: number; totalCalls: number }> = {};
  for (const u of periodUsers) {
    const plan = u.plan || 'free';
    if (!planBreakdown[plan]) planBreakdown[plan] = { users: 0, totalCalls: 0 };
    planBreakdown[plan].users++;
    planBreakdown[plan].totalCalls += u.totalCalls;
  }
  res.json({
    timestamp: new Date().toISOString(),
    circuitBreaker: breaker,
    googleQuota,
    usageByPlan: planBreakdown,
    period: { from: startOfMonth, to: today },
    activeUsers: periodUsers.length,
  });
});

app.get('/api/usage/me', requireAuth, async (req, res) => {
  const userId = req.user!.sub;
  if (process.env.DATABASE_URL) {
    try {
      const { getUserPlan, isFreePlan, FREE_PLAN_SEARCH_LIMIT } = await import('./services/planStore');
      const plan = await getUserPlan(userId);

      // Plan gratuit : la limite pertinente est le nombre de recherches à vie (pas les
      // appels API quotidiens). On expose donc l'usage « recherches » (0 ou 1).
      if (isFreePlan(plan)) {
        const { countUserSearches } = await import('./services/searchHistory');
        const [searches, totalCalls] = await Promise.all([
          countUserSearches(userId),
          getUserTotalCalls(userId),
        ]);
        const used = Math.max(searches, totalCalls > 0 ? FREE_PLAN_SEARCH_LIMIT : 0);
        res.json({
          date: new Date().toISOString().slice(0, 10),
          calls: Math.min(used, FREE_PLAN_SEARCH_LIMIT),
          limit: FREE_PLAN_SEARCH_LIMIT,
          remaining: Math.max(0, FREE_PLAN_SEARCH_LIMIT - used),
        });
        return;
      }

      const { syncLimitFromPlan } = await import('./services/userQuota');
      await syncLimitFromPlan(userId);
    } catch { /* fallback */ }
  }
  res.json(getUserUsage(userId));
});

app.get('/api/usage/me/history', requireAuth, async (req, res) => {
  const days = Math.min(Number(req.query.days) || 30, 90);
  const history = await getUserUsageHistory(req.user!.sub, days);
  res.json(history);
});

app.use('/api/autocomplete', autocompleteRouter);
app.use('/api/prospects', prospectsRouter);
app.use('/api/establishment', establishmentRouter);
app.use('/api/history', historyRouter);
app.use('/api/plans', plansRouter);
app.use('/api/billing', billingRouter);
app.use('/api/search', searchRouter);
app.use('/api/v1', publicApiRouter);

app.post('/api/opt-out', async (req, res) => {
  const { placeId, email } = req.body ?? {};
  if (!placeId || !email) {
    res.status(400).json({ error: 'placeId et email requis.' });
    return;
  }
  if (!process.env.DATABASE_URL) {
    res.status(501).json({ error: 'Fonctionnalité non disponible.' });
    return;
  }
  try {
    const { optOutProspect } = await import('./services/prospectStore');
    const deleted = await optOutProspect(placeId);
    console.log(`[opt-out] placeId=${placeId} email=${email} deleted=${deleted}`);
    res.json({ success: true, message: 'Si des données existaient pour cet établissement, elles ont été supprimées.' });
  } catch {
    res.status(500).json({ error: 'Erreur lors du traitement.' });
  }
});

Sentry.setupExpressErrorHandler(app);

if (process.env.NODE_ENV !== 'test') {
  (async () => {
    if (process.env.DATABASE_URL) {
      const { initDb } = await import('./services/db');
      await initDb();
      const { loadFromDb: loadGoogleQuota } = await import('./services/googleQuota');
      await loadGoogleQuota();
      const { purgeStaleGoogleData } = await import('./services/prospectStore');
      const purged = await purgeStaleGoogleData();
      if (purged > 0) console.log(`[compliance] Purged stale Google data from ${purged} prospects`);
      const { purgeInactiveUsers } = await import('./services/userStore');
      const purgedUsers = await purgeInactiveUsers();
      if (purgedUsers > 0) console.log(`[compliance] Purged ${purgedUsers} inactive users (>12 months)`);
      console.log('Database initialized');
    }
    app.listen(PORT, () => {
      console.log(`Backend running on http://localhost:${PORT}`);
    });
  })();
}
