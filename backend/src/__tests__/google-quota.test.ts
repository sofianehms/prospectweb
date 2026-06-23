import { describe, it, expect, beforeEach } from 'vitest';
import {
  trackCall,
  checkQuota,
  getUsage,
  resetForTesting,
  QuotaExceededError,
} from '../services/googleQuota';

process.env.GOOGLE_DAILY_LIMIT = '10';
process.env.NODE_ENV = 'test';
process.env.BACKEND_SECRET = 'test-secret';

describe('PW-02 — compteur & plafond quotidien Google', () => {
  beforeEach(() => {
    resetForTesting();
  });

  it('comptabilise les appels places et geocoding séparément', () => {
    trackCall('places', 3);
    trackCall('geocoding', 2);

    const usage = getUsage();
    expect(usage.places).toBe(3);
    expect(usage.geocoding).toBe(2);
    expect(usage.total).toBe(5);
  });

  it('checkQuota laisse passer sous la limite', () => {
    trackCall('places', 5);
    expect(() => checkQuota(1)).not.toThrow();
  });

  it('checkQuota bloque quand le quota est atteint', () => {
    trackCall('places', 10);
    expect(() => checkQuota(1)).toThrow(QuotaExceededError);
  });

  it('checkQuota bloque quand le total + needed dépasse la limite', () => {
    trackCall('places', 8);
    expect(() => checkQuota(3)).toThrow(QuotaExceededError);
    expect(() => checkQuota(2)).not.toThrow();
  });

  it('getUsage retourne la limite configurée', () => {
    const usage = getUsage();
    expect(usage.limit).toBe(10);
    expect(usage.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('PW-02 — intégration HTTP 429', () => {
  beforeEach(() => {
    resetForTesting();
  });

  it('renvoie 429 quand le quota est dépassé', async () => {
    process.env.NODE_ENV = 'test';
    process.env.BACKEND_SECRET = 'test-secret';

    const { default: request } = await import('supertest');
    const { app } = await import('../index');

    // Set a tiny limit AFTER import, then saturate it
    process.env.GOOGLE_DAILY_LIMIT = '2';
    resetForTesting();
    trackCall('places', 2);

    // Use unique coords to avoid cache hits from other tests
    const res = await request(app)
      .get('/api/search?lat=40.00&lng=3.00&radius=500&types=restaurant')
      .set('x-internal-secret', 'test-secret');

    expect(res.status).toBe(429);
    expect(res.body.error).toContain('Quota journalier');

    process.env.GOOGLE_DAILY_LIMIT = '10';
  });

  it('la route /api/usage retourne les compteurs', async () => {
    process.env.GOOGLE_DAILY_LIMIT = '500';
    resetForTesting();

    const { default: request } = await import('supertest');
    const { app } = await import('../index');

    const res = await request(app).get('/api/usage');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('limit');
    expect(res.body).toHaveProperty('places');
    expect(res.body).toHaveProperty('geocoding');
  });
});
