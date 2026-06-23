import path from 'path';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import searchRouter from './routes/search';
import authRouter from './routes/auth';
import { getUsage } from './services/googleQuota';
import { getUserUsage, getAllUsersUsage } from './services/userQuota';
import { requireAuth } from './middleware/requireAuth';

// Charge le .env racine du projet (un niveau au-dessus de /backend)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRouter);

app.get('/api/usage', (_req, res) => {
  res.json({ global: getUsage(), users: getAllUsersUsage() });
});

app.get('/api/usage/me', requireAuth, (req, res) => {
  res.json(getUserUsage(req.user!.sub));
});

app.use('/api/search', searchRouter);

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
  });
}
