import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { setupAuthEnv, testToken } from './helpers/auth';

process.env.NODE_ENV = 'test';
process.env.BACKEND_SECRET = 'test-secret';
process.env.GOOGLE_DAILY_LIMIT = '9999';
process.env.DATABASE_URL = 'mock';
setupAuthEnv();

const users: Array<{ id: string; email: string; password_hash: string; created_at: string }> = [];

vi.mock('../services/db', () => ({
  getPool: () => ({
    query: vi.fn(async (sql: string, params?: unknown[]) => {
      if (sql.includes('SELECT') && sql.includes('FROM users')) {
        const email = (params?.[0] as string)?.toLowerCase();
        const found = users.filter(u => u.email === email);
        return { rows: found };
      }
      if (sql.includes('INSERT INTO users')) {
        const [id, email, password_hash] = params as string[];
        const row = { id, email, password_hash, created_at: new Date().toISOString() };
        users.push(row);
        return { rows: [row] };
      }
      return { rows: [] };
    }),
  }),
  initDb: vi.fn(),
}));

import { app } from '../index';

const SECRET = 'test-secret';

describe('PW-07 -- /api/search rejette les requetes non authentifiees', () => {
  it('renvoie 401 sans header Authorization', async () => {
    const res = await request(app)
      .get('/api/search?lat=48.85&lng=2.35&radius=1000&types=restaurant')
      .set('x-internal-secret', SECRET);
    expect(res.status).toBe(401);
  });

  it('renvoie 401 avec un token invalide', async () => {
    const res = await request(app)
      .get('/api/search?lat=48.85&lng=2.35&radius=1000&types=restaurant')
      .set('x-internal-secret', SECRET)
      .set('Authorization', 'Bearer invalid-token');
    expect(res.status).toBe(401);
  });

  it('accepte une requete avec un token valide', async () => {
    const token = testToken();
    const res = await request(app)
      .get('/api/search?lat=48.85&lng=2.35&radius=1000&types=restaurant')
      .set('x-internal-secret', SECRET)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).not.toBe(401);
  }, 15000);
});
