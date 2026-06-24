import { describe, it, expect, vi, beforeAll } from 'vitest';
import request from 'supertest';
import { setupAuthEnv, testToken } from './helpers/auth';
import bcrypt from 'bcryptjs';

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

describe('PW-07 -- register + login flow', () => {
  const email = 'testuser@example.com';
  const password = 'securePass123';
  let token = '';

  it('register: cree un compte et retourne un token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email, password });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe(email);
    token = res.body.token;
  });

  it('register: refuse un doublon', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email, password });
    expect(res.status).toBe(409);
  });

  it('login: retourne un token avec les bons identifiants', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email, password });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it('login: refuse un mauvais mot de passe', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email, password: 'wrong' });
    expect(res.status).toBe(401);
  });

  it('/api/auth/me: retourne l\'utilisateur avec un token valide', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe(email);
  });

  it('/api/auth/me: rejette sans token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('le token issu du register permet d\'acceder a /api/search', async () => {
    const res = await request(app)
      .get('/api/search?lat=49.00&lng=2.50&radius=500&types=bakery')
      .set('x-internal-secret', SECRET)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).not.toBe(401);
  }, 15000);
});

describe('PW-07 -- validation des entrees auth', () => {
  it('register: refuse un email invalide', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'not-an-email', password: 'secure123' });
    expect(res.status).toBe(400);
  });

  it('register: refuse un mot de passe trop court', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'valid@example.com', password: '123' });
    expect(res.status).toBe(400);
  });

  it('login: refuse des champs manquants', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'a@b.com' });
    expect(res.status).toBe(400);
  });
});
