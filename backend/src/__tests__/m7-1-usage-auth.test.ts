import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { setupAuthEnv, TEST_SECRET, TEST_USER } from './helpers/auth';

process.env.NODE_ENV = 'test';
process.env.BACKEND_SECRET = 'test-secret';
process.env.GOOGLE_DAILY_LIMIT = '9999';
process.env.DATABASE_URL = 'mock';
setupAuthEnv();

vi.mock('../services/db', () => ({
  getPool: () => ({
    query: vi.fn(async () => ({ rows: [] })),
  }),
  initDb: vi.fn(),
}));

import { app } from '../index';

function adminToken(): string {
  return jwt.sign({ ...TEST_USER, role: 'admin' }, TEST_SECRET, { expiresIn: '1h' });
}

function userToken(): string {
  return jwt.sign({ ...TEST_USER, role: 'user' }, TEST_SECRET, { expiresIn: '1h' });
}

describe('M7.1 -- /api/usage requiert authentification + rôle admin', () => {
  it('renvoie 401 sans token (requête anonyme)', async () => {
    const res = await request(app).get('/api/usage');
    expect(res.status).toBe(401);
    expect(res.body.users).toBeUndefined();
  });

  it('renvoie 403 avec un token utilisateur standard', async () => {
    const res = await request(app)
      .get('/api/usage')
      .set('Authorization', `Bearer ${userToken()}`);
    expect(res.status).toBe(403);
    expect(res.body.users).toBeUndefined();
  });

  it('renvoie 401 avec un token invalide', async () => {
    const res = await request(app)
      .get('/api/usage')
      .set('Authorization', 'Bearer invalid-token');
    expect(res.status).toBe(401);
    expect(res.body.users).toBeUndefined();
  });

  it('renvoie 200 avec un token admin', async () => {
    const res = await request(app)
      .get('/api/usage')
      .set('Authorization', `Bearer ${adminToken()}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('global');
    expect(res.body).toHaveProperty('users');
  });

  it('ne retourne jamais la liste des utilisateurs aux anonymes', async () => {
    const res = await request(app).get('/api/usage');
    expect(res.status).toBe(401);
    expect(res.body).not.toHaveProperty('users');
    expect(res.body).not.toHaveProperty('global');
  });
});
