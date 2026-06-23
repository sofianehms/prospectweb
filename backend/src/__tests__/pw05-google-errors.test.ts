import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GoogleApiError } from '../services/places';

process.env.NODE_ENV = 'test';
process.env.BACKEND_SECRET = 'test-secret';
process.env.GOOGLE_DAILY_LIMIT = '9999';

import { resetForTesting } from '../services/googleQuota';

describe('PW-05 — GoogleApiError est bien typée', () => {
  it('contient le status HTTP et le body', () => {
    const err = new GoogleApiError(403, 'quota exceeded');
    expect(err.status).toBe(403);
    expect(err.body).toContain('quota exceeded');
    expect(err.name).toBe('GoogleApiError');
    expect(err.message).toContain('403');
  });
});

describe('PW-05 — le contrôleur remonte les erreurs Google au frontend', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    resetForTesting();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('renvoie 503 quand Google répond 403 (quota/clé)', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      text: async () => '{"error":{"message":"API key expired"}}',
    });

    const { default: request } = await import('supertest');
    const { app } = await import('../index');

    const res = await request(app)
      .get('/api/search?lat=41.00&lng=2.00&radius=500&types=bakery')
      .set('x-internal-secret', 'test-secret');

    expect(res.status).toBe(503);
    expect(res.body.error).toContain('Service Google indisponible');
    expect(res.body.error).toContain('403');
  });

  it('renvoie 502 quand Google répond 500 (erreur serveur)', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'Internal Server Error',
    });

    const { default: request } = await import('supertest');
    const { app } = await import('../index');

    const res = await request(app)
      .get('/api/search?lat=42.00&lng=3.00&radius=500&types=florist')
      .set('x-internal-secret', 'test-secret');

    expect(res.status).toBe(502);
    expect(res.body.error).toContain('Service Google indisponible');
    expect(res.body.error).toContain('500');
  });

  it('ne masque pas l\'erreur en liste vide', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      text: async () => 'Rate limit exceeded',
    });

    const { default: request } = await import('supertest');
    const { app } = await import('../index');

    const res = await request(app)
      .get('/api/search?lat=43.00&lng=4.00&radius=500&types=dentist')
      .set('x-internal-secret', 'test-secret');

    // Must NOT be 200 with empty results — error must be visible
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.body.error).toBeDefined();
  });
});
