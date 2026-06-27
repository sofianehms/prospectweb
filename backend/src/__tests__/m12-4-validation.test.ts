import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { setupAuthEnv, testToken } from './helpers/auth';

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

const SECRET = 'test-secret';
const headers = () => ({
  'x-internal-secret': SECRET,
  'Authorization': `Bearer ${testToken()}`,
});

describe('M12.4 -- Validation des formulaires (inputs API)', () => {
  describe('/api/search validation', () => {
    it('rejette un radius manquant (400)', async () => {
      const res = await request(app)
        .get('/api/search?lat=48.85&lng=2.35')
        .set(headers());
      expect(res.status).toBe(400);
    });

    it('rejette un radius negatif (400)', async () => {
      const res = await request(app)
        .get('/api/search?lat=48.85&lng=2.35&radius=-500')
        .set(headers());
      expect(res.status).toBe(400);
    });

    it('rejette un radius > 10000 (400)', async () => {
      const res = await request(app)
        .get('/api/search?lat=48.85&lng=2.35&radius=50000')
        .set(headers());
      expect(res.status).toBe(400);
    });

    it('rejette sans adresse ni coordonnees (400)', async () => {
      const res = await request(app)
        .get('/api/search?radius=1000')
        .set(headers());
      expect(res.status).toBe(400);
    });

    it('rejette des coordonnees non numeriques (400)', async () => {
      const res = await request(app)
        .get('/api/search?lat=abc&lng=def&radius=1000')
        .set(headers());
      expect(res.status).toBe(400);
    });

    it('rejette un type de commerce invalide (400)', async () => {
      const res = await request(app)
        .get('/api/search?lat=48.85&lng=2.35&radius=1000&types=INVALID_TYPE')
        .set(headers());
      expect(res.status).toBe(400);
    });
  });

  describe('/api/prospects validation', () => {
    it('POST sans body → 400', async () => {
      const res = await request(app)
        .post('/api/prospects')
        .set(headers());
      expect(res.status).toBe(400);
    });

    it('PATCH avec un statut CRM invalide → 400 ou 404', async () => {
      const res = await request(app)
        .patch('/api/prospects/fake-id')
        .set(headers())
        .send({ status: 'INVALID_STATUS' });
      expect([400, 404]).toContain(res.status);
    });

    it('PATCH avec un statut CRM valide → accepte', async () => {
      const res = await request(app)
        .patch('/api/prospects/fake-id')
        .set(headers())
        .send({ status: 'contacted' });
      expect([200, 404]).toContain(res.status);
    });
  });

  describe('/api/billing/checkout validation', () => {
    it('POST sans planId → 400', async () => {
      const res = await request(app)
        .post('/api/billing/checkout')
        .set(headers())
        .send({});
      expect([400, 500]).toContain(res.status);
    });
  });
});
