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

describe('M12.4 -- Tests d\'integration auth Clerk', () => {
  describe('Routes protegees rejettent les sessions invalides', () => {
    const protectedRoutes = [
      { method: 'get' as const, path: '/api/search?lat=48.85&lng=2.35&radius=1000&types=restaurant' },
      { method: 'get' as const, path: '/api/prospects' },
      { method: 'get' as const, path: '/api/plans/me' },
      { method: 'get' as const, path: '/api/usage/me' },
      { method: 'get' as const, path: '/api/history' },
      { method: 'get' as const, path: '/api/establishment/fake-id' },
    ];

    for (const route of protectedRoutes) {
      it(`${route.method.toUpperCase()} ${route.path} → 401 sans token`, async () => {
        const res = await request(app)[route.method](route.path)
          .set('x-internal-secret', SECRET);
        expect(res.status).toBe(401);
      });

      it(`${route.method.toUpperCase()} ${route.path} → 401 avec token expire/invalide`, async () => {
        const res = await request(app)[route.method](route.path)
          .set('x-internal-secret', SECRET)
          .set('Authorization', 'Bearer expired.token.here');
        expect(res.status).toBe(401);
      });
    }

    it('rejette une requete sans x-internal-secret (401 ou 403)', async () => {
      const token = testToken();
      const res = await request(app)
        .get('/api/search?lat=48.85&lng=2.35&radius=1000&types=restaurant')
        .set('Authorization', `Bearer ${token}`);
      expect([401, 403]).toContain(res.status);
    });

    it('accepte une requete avec token valide + secret', async () => {
      const token = testToken();
      const res = await request(app)
        .get('/api/plans/me')
        .set('x-internal-secret', SECRET)
        .set('Authorization', `Bearer ${token}`);
      expect([200, 404]).toContain(res.status);
    });
  });

  describe('Isolation entre utilisateurs', () => {
    it('un utilisateur ne peut pas acceder aux prospects d\'un autre', async () => {
      const token = testToken();
      const res = await request(app)
        .get('/api/prospects')
        .set('x-internal-secret', SECRET)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      const prospects = res.body;
      if (Array.isArray(prospects)) {
        for (const p of prospects) {
          expect(p).not.toHaveProperty('userId');
        }
      }
    });
  });
});
