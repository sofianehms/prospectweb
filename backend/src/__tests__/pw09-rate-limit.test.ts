import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import request from 'supertest';
import { setupAuthEnv, testToken } from './helpers/auth';

process.env.NODE_ENV = 'test';
process.env.BACKEND_SECRET = 'test-secret';
process.env.GOOGLE_DAILY_LIMIT = '9999';
process.env.USER_DAILY_LIMIT = '9999';
setupAuthEnv();

import { app } from '../index';
import { resetForTesting as resetGlobalQuota } from '../services/googleQuota';
import { resetForTesting as resetUserQuota } from '../services/userQuota';

const SECRET = 'test-secret';
const TOKEN = testToken();

describe('PW-09 — trust proxy est configuré', () => {
  it('app.get("trust proxy") retourne 1', () => {
    expect(app.get('trust proxy')).toBe(1);
  });
});

describe('PW-09 — rate-limiter search clé sur userId, pas sur IP', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    resetGlobalQuota();
    resetUserQuota();
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ places: [] }),
    });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('les en-têtes RateLimit standard sont présents', async () => {
    const res = await request(app)
      .get('/api/search?lat=48.85&lng=2.35&radius=1000&types=restaurant')
      .set('x-internal-secret', SECRET)
      .set('Authorization', `Bearer ${TOKEN}`);

    expect(res.headers).toHaveProperty('ratelimit-limit');
    expect(res.headers).toHaveProperty('ratelimit-remaining');
  });

  it('une requête sans auth est rejetée en 401 avant le rate-limiter', async () => {
    const res = await request(app)
      .get('/api/search?lat=48.85&lng=2.35&radius=1000&types=restaurant')
      .set('x-internal-secret', SECRET);

    expect(res.status).toBe(401);
  });
});

describe('PW-09 — rate-limiter auth protège contre le brute-force', () => {
  it('les en-têtes RateLimit sont présents sur /api/auth/login', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'a@b.com', password: 'wrong' });

    expect(res.headers).toHaveProperty('ratelimit-limit');
    expect(res.headers).toHaveProperty('ratelimit-remaining');
  });

  it('les en-têtes RateLimit sont présents sur /api/auth/register', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'not-valid', password: '123' });

    expect(res.headers).toHaveProperty('ratelimit-limit');
  });
});
