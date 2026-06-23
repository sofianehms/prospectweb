import { describe, it, expect, vi, afterEach } from 'vitest';
import request from 'supertest';
import { setupAuthEnv, testToken } from './helpers/auth';

process.env.NODE_ENV = 'test';
process.env.BACKEND_SECRET = 'test-secret';
process.env.GOOGLE_DAILY_LIMIT = '9999';
setupAuthEnv();

import { app } from '../index';
import { resetForTesting } from '../services/googleQuota';

const SECRET = 'test-secret';
const TOKEN = testToken();

describe('PW-06 — aucun détail interne dans les réponses d\'erreur', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    resetForTesting();
  });

  it('geocode: ne renvoie pas le status/error_message Google au client', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'REQUEST_DENIED',
        error_message: 'The provided API key is invalid.',
        results: [],
      }),
    });

    const res = await request(app)
      .get('/api/search?address=Paris&radius=1000')
      .set('x-internal-secret', SECRET)
      .set('Authorization', `Bearer ${TOKEN}`);

    expect(res.body.error).not.toContain('API key');
    expect(res.body.error).not.toContain('REQUEST_DENIED');
    expect(res.body.error).toContain('indisponible');
  });

  it('geocode: adresse introuvable renvoie un message user-friendly', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'ZERO_RESULTS',
        results: [],
      }),
    });

    const res = await request(app)
      .get('/api/search?address=xyznonexistent&radius=1000')
      .set('x-internal-secret', SECRET)
      .set('Authorization', `Bearer ${TOKEN}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('introuvable');
    expect(res.body.error).not.toContain('ZERO_RESULTS');
  });

  it('catch-all: ne fuite pas le message d\'erreur interne', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('ECONNREFUSED 127.0.0.1:443'));

    const res = await request(app)
      .get('/api/search?lat=44.00&lng=5.00&radius=500&types=bar')
      .set('x-internal-secret', SECRET)
      .set('Authorization', `Bearer ${TOKEN}`);

    expect(res.status).toBeGreaterThanOrEqual(500);
    expect(res.body.error).not.toContain('ECONNREFUSED');
    expect(res.body.error).not.toContain('127.0.0.1');
    expect(res.body.error).toBe('Erreur interne du serveur.');
  });

  it('GoogleApiError: ne fuite pas le body Google brut', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      text: async () => '{"error":{"message":"Billing account not found"}}',
    });

    const res = await request(app)
      .get('/api/search?lat=45.00&lng=6.00&radius=500&types=cafe')
      .set('x-internal-secret', SECRET)
      .set('Authorization', `Bearer ${TOKEN}`);

    expect(res.body.error).not.toContain('Billing');
    expect(res.body.error).toContain('Service Google indisponible');
  });
});
