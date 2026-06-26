import path from 'path';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import searchRouter from './routes/search';
import authRouter from './routes/auth';
import autocompleteRouter from './routes/autocomplete';
import prospectsRouter from './routes/prospects';
import establishmentRouter from './routes/establishment';
import historyRouter from './routes/history';
import plansRouter from './routes/plans';
import billingRouter from './routes/billing';
import { stripeWebhookHandler } from './routes/stripeWebhook';
import { getUsage } from './services/googleQuota';
import { getUserUsage, getAllUsersUsage } from './services/userQuota';
import { requireAuth, requireAdmin } from './middleware/requireAuth';

// Charge le .env racine du projet (un niveau au-dessus de /backend)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 4000;

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));

app.post('/api/billing/webhook', express.raw({ type: 'application/json' }), stripeWebhookHandler);

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRouter);

app.get('/api/usage', requireAuth, requireAdmin, (_req, res) => {
  res.json({ global: getUsage(), users: getAllUsersUsage() });
});

app.get('/api/usage/me', requireAuth, async (req, res) => {
  if (process.env.DATABASE_URL) {
    try {
      const { syncLimitFromPlan } = await import('./services/userQuota');
      await syncLimitFromPlan(req.user!.sub);
    } catch { /* fallback */ }
  }
  res.json(getUserUsage(req.user!.sub));
});

app.use('/api/autocomplete', autocompleteRouter);
app.use('/api/prospects', prospectsRouter);
app.use('/api/establishment', establishmentRouter);
app.use('/api/history', historyRouter);
app.use('/api/plans', plansRouter);
app.use('/api/billing', billingRouter);
app.use('/api/search', searchRouter);

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
