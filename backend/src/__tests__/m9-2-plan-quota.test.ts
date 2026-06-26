import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setupAuthEnv, TEST_USER } from './helpers/auth';

process.env.NODE_ENV = 'test';
process.env.BACKEND_SECRET = 'test-secret';
process.env.USER_DAILY_LIMIT = '100';
setupAuthEnv();

import {
  resetForTesting,
  getUserDailyLimit,
  getUserUsage,
  syncLimitFromPlan,
  checkUserQuota,
  trackUserCalls,
  UserQuotaExceededError,
} from '../services/userQuota';

let mockUserPlan = 'free';

const plans: Record<string, { id: string; name: string; dailyLimit: number; monthlyPrice: number; maxProspects: number }> = {
  free: { id: 'free', name: 'Gratuit', dailyLimit: 50, monthlyPrice: 0, maxProspects: 100 },
  pro: { id: 'pro', name: 'Pro', dailyLimit: 300, monthlyPrice: 29, maxProspects: 1000 },
  business: { id: 'business', name: 'Business', dailyLimit: 1000, monthlyPrice: 79, maxProspects: 10000 },
};

vi.mock('../services/planStore', () => ({
  getUserPlan: vi.fn(async () => plans[mockUserPlan]),
  getPlan: vi.fn(async (id: string) => plans[id] ?? plans.free),
  setUserPlan: vi.fn(async (_uid: string, planId: string) => { mockUserPlan = planId; }),
  listPlans: vi.fn(async () => Object.values(plans)),
  isPaidPlan: vi.fn((p: { monthlyPrice: number }) => p.monthlyPrice > 0),
}));

describe('M9.2 -- Le quota utilisateur decoule du plan actif', () => {
  beforeEach(() => {
    resetForTesting();
    mockUserPlan = 'free';
  });

  it('syncLimitFromPlan applique la limite du plan Free (50)', async () => {
    mockUserPlan = 'free';
    const limit = await syncLimitFromPlan(TEST_USER.sub);
    expect(limit).toBe(50);
    expect(getUserDailyLimit(TEST_USER.sub)).toBe(50);
  });

  it('syncLimitFromPlan applique la limite du plan Pro (300)', async () => {
    mockUserPlan = 'pro';
    const limit = await syncLimitFromPlan(TEST_USER.sub);
    expect(limit).toBe(300);
    expect(getUserDailyLimit(TEST_USER.sub)).toBe(300);
  });

  it('syncLimitFromPlan applique la limite du plan Business (1000)', async () => {
    mockUserPlan = 'business';
    const limit = await syncLimitFromPlan(TEST_USER.sub);
    expect(limit).toBe(1000);
    expect(getUserDailyLimit(TEST_USER.sub)).toBe(1000);
  });

  it('le quota applique correspond au plan paye de bout en bout', async () => {
    mockUserPlan = 'pro';
    await syncLimitFromPlan(TEST_USER.sub);

    trackUserCalls(TEST_USER.sub, 299);
    expect(() => checkUserQuota(TEST_USER.sub)).not.toThrow();

    trackUserCalls(TEST_USER.sub, 1);
    expect(() => checkUserQuota(TEST_USER.sub)).toThrow(UserQuotaExceededError);
  });

  it('un downgrade ajuste le quota immediatement', async () => {
    mockUserPlan = 'pro';
    await syncLimitFromPlan(TEST_USER.sub);
    expect(getUserDailyLimit(TEST_USER.sub)).toBe(300);

    mockUserPlan = 'free';
    await syncLimitFromPlan(TEST_USER.sub);
    expect(getUserDailyLimit(TEST_USER.sub)).toBe(50);
  });

  it('un upgrade ajuste le quota immediatement', async () => {
    mockUserPlan = 'free';
    await syncLimitFromPlan(TEST_USER.sub);
    expect(getUserDailyLimit(TEST_USER.sub)).toBe(50);

    mockUserPlan = 'business';
    await syncLimitFromPlan(TEST_USER.sub);
    expect(getUserDailyLimit(TEST_USER.sub)).toBe(1000);
  });

  it('getUserUsage reflete la limite du plan', async () => {
    mockUserPlan = 'pro';
    await syncLimitFromPlan(TEST_USER.sub);
    trackUserCalls(TEST_USER.sub, 10);

    const usage = getUserUsage(TEST_USER.sub);
    expect(usage.limit).toBe(300);
    expect(usage.calls).toBe(10);
    expect(usage.remaining).toBe(290);
  });
});
