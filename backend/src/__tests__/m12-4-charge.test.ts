import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { setupAuthEnv, testToken } from './helpers/auth';

process.env.NODE_ENV = 'test';
process.env.BACKEND_SECRET = 'test-secret';
process.env.GOOGLE_DAILY_LIMIT = '9999';
process.env.USER_DAILY_LIMIT = '3';
process.env.DATABASE_URL = 'mock';
setupAuthEnv();

import { resetForTesting as resetUserQuota, trackUserCalls, checkUserQuota, UserQuotaExceededError } from '../services/userQuota';
import { resetForTesting as resetGoogleQuota } from '../services/googleQuota';

vi.mock('../services/db', () => ({
  getPool: () => ({
    query: vi.fn(async () => ({ rows: [] })),
  }),
  initDb: vi.fn(),
}));

describe('M12.4 -- Test de charge simule (quota + rate-limit)', () => {
  beforeEach(() => {
    resetUserQuota();
    resetGoogleQuota();
  });

  it('un utilisateur est bloque apres avoir atteint son quota quotidien (unit)', () => {
    const userId = 'test-user-charge';

    trackUserCalls(userId, 1);
    expect(() => checkUserQuota(userId)).not.toThrow();

    trackUserCalls(userId, 1);
    expect(() => checkUserQuota(userId)).not.toThrow();

    trackUserCalls(userId, 1);
    expect(() => checkUserQuota(userId)).toThrow(UserQuotaExceededError);
  });

  it('deux utilisateurs ont des compteurs independants', () => {
    const user1 = 'user-1';
    const user2 = 'user-2';

    trackUserCalls(user1, 3);
    expect(() => checkUserQuota(user1)).toThrow(UserQuotaExceededError);

    expect(() => checkUserQuota(user2)).not.toThrow();
    trackUserCalls(user2, 1);
    expect(() => checkUserQuota(user2)).not.toThrow();
  });

  it('le quota bloque meme en requetes concurrentes simulees', async () => {
    const userId = 'test-user-concurrent';
    const results: ('ok' | 'blocked')[] = [];

    const tasks = Array.from({ length: 6 }, async () => {
      try {
        checkUserQuota(userId);
        trackUserCalls(userId, 1);
        results.push('ok');
      } catch {
        results.push('blocked');
      }
    });

    await Promise.all(tasks);
    const ok = results.filter(r => r === 'ok').length;
    const blocked = results.filter(r => r === 'blocked').length;

    expect(ok).toBeLessThanOrEqual(3);
    expect(blocked).toBeGreaterThanOrEqual(3);
  });

  it('le quota global Google bloque tous les utilisateurs', async () => {
    process.env.GOOGLE_DAILY_LIMIT = '2';
    resetGoogleQuota();

    const { checkQuota, trackCall } = await import('../services/googleQuota');

    trackCall('places');
    expect(() => checkQuota()).not.toThrow();

    trackCall('places');
    expect(() => checkQuota()).toThrow();

    process.env.GOOGLE_DAILY_LIMIT = '9999';
    resetGoogleQuota();
  });
});
