import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { setupAuthEnv, testToken } from './helpers/auth';

process.env.NODE_ENV = 'test';
process.env.BACKEND_SECRET = 'test-secret';
process.env.GOOGLE_DAILY_LIMIT = '9999';
process.env.DATABASE_URL = 'mock';
setupAuthEnv();

const FREE_PLAN = { id: 'free', name: 'Gratuit', daily_limit: 50, monthly_price: 0, max_prospects: 100 };
const BIZ_PLAN = { id: 'business', name: 'Business', daily_limit: 500, monthly_price: 29, max_prospects: 5000 };

let currentUserPlan = 'business';

vi.mock('../services/db', () => ({
  getPool: () => ({
    query: vi.fn(async (sql: string, params?: unknown[]) => {
      if (sql.includes('FROM plans WHERE id')) {
        const id = params?.[0];
        if (id === 'free') return { rows: [FREE_PLAN] };
        if (id === 'business') return { rows: [BIZ_PLAN] };
        return { rows: [] };
      }
      if (sql.includes('FROM plans ORDER')) {
        return { rows: [FREE_PLAN, BIZ_PLAN] };
      }
      if (sql.includes('SELECT plan FROM users')) {
        return { rows: [{ plan: currentUserPlan }] };
      }
      if (sql.includes('UPDATE users SET plan')) {
        currentUserPlan = params?.[0] as string;
        return { rows: [] };
      }
      return { rows: [] };
    }),
  }),
  initDb: vi.fn(),
}));

import { app } from '../index';

const SECRET = 'test-secret';

describe('M7.2 -- PATCH /api/plans/me verrouille les plans payants', () => {
  it('refuse (403) le passage vers Business sans abonnement', async () => {
    const res = await request(app)
      .patch('/api/plans/me')
      .set('x-internal-secret', SECRET)
      .set('Authorization', `Bearer ${testToken()}`)
      .send({ planId: 'business' });
    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Abonnement payant requis');
  });

  it('autorise le retour vers Free', async () => {
    const res = await request(app)
      .patch('/api/plans/me')
      .set('x-internal-secret', SECRET)
      .set('Authorization', `Bearer ${testToken()}`)
      .send({ planId: 'free' });
    expect(res.status).toBe(200);
    expect(res.body.id).toBe('free');
  });

  it('refuse un plan inconnu', async () => {
    const res = await request(app)
      .patch('/api/plans/me')
      .set('x-internal-secret', SECRET)
      .set('Authorization', `Bearer ${testToken()}`)
      .send({ planId: 'unknown-plan' });
    expect(res.status).toBe(400);
  });

  it('refuse sans planId', async () => {
    const res = await request(app)
      .patch('/api/plans/me')
      .set('x-internal-secret', SECRET)
      .set('Authorization', `Bearer ${testToken()}`)
      .send({});
    expect(res.status).toBe(400);
  });
});
