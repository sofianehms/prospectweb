import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setupAuthEnv, TEST_USER } from './helpers/auth';

process.env.NODE_ENV = 'test';
process.env.BACKEND_SECRET = 'test-secret';
process.env.STRIPE_PRICE_PRO = 'price_pro_test';
process.env.STRIPE_PRICE_BUSINESS = 'price_biz_test';
setupAuthEnv();

import {
  resetForTesting as resetUserQuota,
  getUserDailyLimit,
} from '../services/userQuota';

let mockPlan = 'free';
let mockSubStatus: string | null = null;

vi.mock('../services/db', () => ({
  getPool: () => ({
    query: vi.fn(async (sql: string, params?: unknown[]) => {
      if (sql.includes('FROM plans WHERE id')) {
        const plans: Record<string, any> = {
          free: { id: 'free', name: 'Gratuit', daily_limit: 50, monthly_price: 0, max_prospects: 100 },
          pro: { id: 'pro', name: 'Pro', daily_limit: 300, monthly_price: 29, max_prospects: 1000 },
          business: { id: 'business', name: 'Business', daily_limit: 1000, monthly_price: 79, max_prospects: 10000 },
        };
        return { rows: [plans[params?.[0] as string] ?? plans.free] };
      }
      if (sql.includes('SELECT plan FROM users')) {
        return { rows: [{ plan: mockPlan }] };
      }
      if (sql.includes('SELECT subscription_status FROM users')) {
        return { rows: [{ subscription_status: mockSubStatus }] };
      }
      if (sql.includes('UPDATE users') && sql.includes('stripe_customer_id')) {
        mockPlan = params?.[3] as string;
        mockSubStatus = params?.[2] as string;
        return { rowCount: 1 };
      }
      if (sql.includes('UPDATE users') && sql.includes('subscription_status')) {
        mockPlan = 'free';
        mockSubStatus = 'canceled';
        return { rowCount: 1 };
      }
      return { rows: [] };
    }),
  }),
  initDb: vi.fn(),
}));

vi.mock('../services/userStore', () => ({
  ensureClerkUser: vi.fn(),
}));

import { syncSubscription, handleSubscriptionDeleted, planIdFromPriceId } from '../services/stripeService';
import { getUserSubscriptionStatus } from '../services/planStore';

describe('M9.3 -- Le plan effectif est strictement determine par Stripe', () => {
  beforeEach(() => {
    mockPlan = 'free';
    mockSubStatus = null;
    resetUserQuota();
  });

  describe('syncSubscription gere tous les etats Stripe', () => {
    it('active → garde le plan paye (pro)', async () => {
      await syncSubscription(TEST_USER.sub, 'cus_1', 'sub_1', 'active', 'price_pro_test');
      expect(mockPlan).toBe('pro');
      expect(mockSubStatus).toBe('active');
      expect(getUserDailyLimit(TEST_USER.sub)).toBe(300);
    });

    it('active → garde le plan paye (business)', async () => {
      await syncSubscription(TEST_USER.sub, 'cus_1', 'sub_1', 'active', 'price_biz_test');
      expect(mockPlan).toBe('business');
      expect(getUserDailyLimit(TEST_USER.sub)).toBe(1000);
    });

    it('trialing → garde le plan paye', async () => {
      await syncSubscription(TEST_USER.sub, 'cus_1', 'sub_1', 'trialing', 'price_biz_test');
      expect(mockPlan).toBe('business');
      expect(mockSubStatus).toBe('trialing');
    });

    it('past_due → garde le plan paye (grace period)', async () => {
      await syncSubscription(TEST_USER.sub, 'cus_1', 'sub_1', 'past_due', 'price_pro_test');
      expect(mockPlan).toBe('pro');
      expect(mockSubStatus).toBe('past_due');
    });

    it('unpaid → repasse en free', async () => {
      await syncSubscription(TEST_USER.sub, 'cus_1', 'sub_1', 'unpaid', 'price_pro_test');
      expect(mockPlan).toBe('free');
      expect(mockSubStatus).toBe('unpaid');
    });

    it('canceled → repasse en free', async () => {
      await syncSubscription(TEST_USER.sub, 'cus_1', 'sub_1', 'canceled', 'price_pro_test');
      expect(mockPlan).toBe('free');
      expect(mockSubStatus).toBe('canceled');
    });

    it('incomplete_expired → repasse en free', async () => {
      await syncSubscription(TEST_USER.sub, 'cus_1', 'sub_1', 'incomplete_expired', 'price_pro_test');
      expect(mockPlan).toBe('free');
    });

    it('incomplete → reste en free (paiement initial non finalise)', async () => {
      await syncSubscription(TEST_USER.sub, 'cus_1', 'sub_1', 'incomplete', 'price_pro_test');
      expect(mockPlan).toBe('free');
    });
  });

  describe('handleSubscriptionDeleted repasse en Free', () => {
    it('annulation → free + quota free (50)', async () => {
      mockPlan = 'pro';
      await handleSubscriptionDeleted(TEST_USER.sub);
      expect(mockPlan).toBe('free');
      expect(mockSubStatus).toBe('canceled');
      expect(getUserDailyLimit(TEST_USER.sub)).toBe(50);
    });
  });

  describe('planIdFromPriceId resout les prix Stripe', () => {
    it('resout le prix Pro', () => {
      expect(planIdFromPriceId('price_pro_test')).toBe('pro');
    });

    it('resout le prix Business', () => {
      expect(planIdFromPriceId('price_biz_test')).toBe('business');
    });

    it('retourne undefined pour un prix inconnu', () => {
      expect(planIdFromPriceId('price_unknown')).toBeUndefined();
    });
  });

  describe('getUserSubscriptionStatus', () => {
    it('retourne le statut courant', async () => {
      mockSubStatus = 'active';
      expect(await getUserSubscriptionStatus(TEST_USER.sub)).toBe('active');
    });

    it('retourne null sans abonnement', async () => {
      mockSubStatus = null;
      expect(await getUserSubscriptionStatus(TEST_USER.sub)).toBeNull();
    });
  });

  describe('cycle complet upgrade → downgrade', () => {
    it('free → pro (active) → annulation → free', async () => {
      expect(mockPlan).toBe('free');

      await syncSubscription(TEST_USER.sub, 'cus_1', 'sub_1', 'active', 'price_pro_test');
      expect(mockPlan).toBe('pro');
      expect(getUserDailyLimit(TEST_USER.sub)).toBe(300);

      await handleSubscriptionDeleted(TEST_USER.sub);
      expect(mockPlan).toBe('free');
      expect(getUserDailyLimit(TEST_USER.sub)).toBe(50);
    });

    it('free → business (active) → past_due → unpaid → free', async () => {
      await syncSubscription(TEST_USER.sub, 'cus_1', 'sub_1', 'active', 'price_biz_test');
      expect(mockPlan).toBe('business');

      await syncSubscription(TEST_USER.sub, 'cus_1', 'sub_1', 'past_due', 'price_biz_test');
      expect(mockPlan).toBe('business');

      await syncSubscription(TEST_USER.sub, 'cus_1', 'sub_1', 'unpaid', 'price_biz_test');
      expect(mockPlan).toBe('free');
      expect(getUserDailyLimit(TEST_USER.sub)).toBe(50);
    });
  });
});
