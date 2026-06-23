import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import request from 'supertest';
import { setupAuthEnv, testToken, TEST_USER } from './helpers/auth';
import jwt from 'jsonwebtoken';

process.env.NODE_ENV = 'test';
process.env.BACKEND_SECRET = 'test-secret';
process.env.GOOGLE_DAILY_LIMIT = '9999';
process.env.USER_DAILY_LIMIT = '5';
setupAuthEnv();

import { app } from '../index';
import { resetForTesting as resetGlobalQuota } from '../services/googleQuota';
import {
  resetForTesting as resetUserQuota,
  trackUserCalls,
  getUserUsage,
  checkUserQuota,
  UserQuotaExceededError,
} from '../services/userQuota';

const SECRET = 'test-secret';
const TOKEN = testToken();

describe('PW-08 — userQuota service unit tests', () => {
  beforeEach(() => {
    resetUserQuota();
  });

  it('trackUserCalls incrémente le compteur utilisateur', () => {
    trackUserCalls('user-1', 3);
    const usage = getUserUsage('user-1');
    expect(usage.calls).toBe(3);
    expect(usage.remaining).toBe(2);
    expect(usage.limit).toBe(5);
  });

  it('compteurs isolés entre utilisateurs', () => {
    trackUserCalls('user-a', 2);
    trackUserCalls('user-b', 4);
    expect(getUserUsage('user-a').calls).toBe(2);
    expect(getUserUsage('user-b').calls).toBe(4);
  });

  it('checkUserQuota bloque quand le quota est atteint', () => {
    trackUserCalls('user-x', 5);
    expect(() => checkUserQuota('user-x')).toThrow(UserQuotaExceededError);
    expect(() => checkUserQuota('user-x')).toThrow(/Quota utilisateur dépassé/);
  });

  it('checkUserQuota laisse passer sous la limite', () => {
    trackUserCalls('user-y', 4);
    expect(() => checkUserQuota('user-y')).not.toThrow();
  });

  it('un utilisateur à 0 appels a le remaining = limit', () => {
    const usage = getUserUsage('new-user');
    expect(usage.calls).toBe(0);
    expect(usage.remaining).toBe(5);
  });
});

describe('PW-08 — /api/search bloque un utilisateur ayant épuisé son quota', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    resetGlobalQuota();
    resetUserQuota();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('renvoie 429 quand le quota utilisateur est dépassé', async () => {
    trackUserCalls(TEST_USER.sub, 5);

    const res = await request(app)
      .get('/api/search?lat=48.85&lng=2.35&radius=1000&types=restaurant')
      .set('x-internal-secret', SECRET)
      .set('Authorization', `Bearer ${TOKEN}`);

    expect(res.status).toBe(429);
    expect(res.body.error).toContain('Quota utilisateur dépassé');
  });

  it('accepte si l\'utilisateur a encore du quota', async () => {
    trackUserCalls(TEST_USER.sub, 2);

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ places: [] }),
    });

    const res = await request(app)
      .get('/api/search?lat=48.85&lng=2.35&radius=1000&types=bakery')
      .set('x-internal-secret', SECRET)
      .set('Authorization', `Bearer ${TOKEN}`);

    expect(res.status).toBe(200);
  });

  it('les appels Google sont attribués à l\'utilisateur après une recherche', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ places: [] }),
    });

    await request(app)
      .get('/api/search?lat=48.85&lng=2.35&radius=1000&types=cafe,bar')
      .set('x-internal-secret', SECRET)
      .set('Authorization', `Bearer ${TOKEN}`);

    const usage = getUserUsage(TEST_USER.sub);
    expect(usage.calls).toBeGreaterThan(0);
  });
});

describe('PW-08 — /api/usage/me expose la consommation utilisateur', () => {
  beforeEach(() => {
    resetUserQuota();
  });

  it('retourne l\'usage du user authentifié', async () => {
    trackUserCalls(TEST_USER.sub, 3);

    const res = await request(app)
      .get('/api/usage/me')
      .set('Authorization', `Bearer ${TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.body.calls).toBe(3);
    expect(res.body.limit).toBe(5);
    expect(res.body.remaining).toBe(2);
    expect(res.body.date).toBeDefined();
  });

  it('rejette sans token', async () => {
    const res = await request(app).get('/api/usage/me');
    expect(res.status).toBe(401);
  });

  it('un user sans recherche a 0 appels', async () => {
    const freshToken = jwt.sign({ sub: 'fresh-user', email: 'fresh@test.com' }, 'test-jwt-secret', { expiresIn: '1h' });

    const res = await request(app)
      .get('/api/usage/me')
      .set('Authorization', `Bearer ${freshToken}`);

    expect(res.status).toBe(200);
    expect(res.body.calls).toBe(0);
    expect(res.body.remaining).toBe(5);
  });
});

describe('PW-08 — /api/usage inclut le détail par utilisateur', () => {
  beforeEach(() => {
    resetGlobalQuota();
    resetUserQuota();
  });

  it('retourne les stats globales et par utilisateur', async () => {
    trackUserCalls('user-1', 2);
    trackUserCalls('user-2', 3);

    const res = await request(app).get('/api/usage');

    expect(res.status).toBe(200);
    expect(res.body.global).toBeDefined();
    expect(res.body.users).toBeInstanceOf(Array);
    expect(res.body.users.length).toBe(2);
  });
});
