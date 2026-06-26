import { describe, it, expect, vi } from 'vitest';
import { setupAuthEnv, testToken, adminToken } from './helpers/auth';

process.env.NODE_ENV = 'test';
process.env.BACKEND_SECRET = 'test-secret';
process.env.GOOGLE_DAILY_LIMIT = '500';
setupAuthEnv();

vi.mock('../services/db', () => {
  const noop = { query: vi.fn().mockResolvedValue({ rows: [], rowCount: 0 }) };
  return { getPool: () => noop, initDb: vi.fn() };
});

import { app } from '../index';
import request from 'supertest';

describe('M10.5 -- Endpoint /api/ops', () => {
  it('refuse l\'acces sans auth', async () => {
    const res = await request(app)
      .get('/api/ops')
      .set('x-internal-secret', 'test-secret');
    expect(res.status).toBe(401);
  });

  it('refuse l\'acces sans role admin', async () => {
    const res = await request(app)
      .get('/api/ops')
      .set('x-internal-secret', 'test-secret')
      .set('Authorization', `Bearer ${testToken()}`);
    expect(res.status).toBe(403);
  });

  it('retourne les donnees ops pour un admin', async () => {
    const res = await request(app)
      .get('/api/ops')
      .set('x-internal-secret', 'test-secret')
      .set('Authorization', `Bearer ${adminToken()}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('circuitBreaker');
    expect(res.body).toHaveProperty('googleQuota');
    expect(res.body).toHaveProperty('usageByPlan');
    expect(res.body).toHaveProperty('activeUsers');
    expect(res.body).toHaveProperty('timestamp');
    expect(res.body.circuitBreaker).toHaveProperty('isOpen');
    expect(res.body.googleQuota).toHaveProperty('total');
    expect(res.body.googleQuota).toHaveProperty('limit');
  });
});
