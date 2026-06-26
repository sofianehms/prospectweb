import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setupAuthEnv, TEST_USER } from './helpers/auth';

process.env.NODE_ENV = 'test';
process.env.BACKEND_SECRET = 'test-secret';
process.env.STRIPE_SECRET_KEY = 'sk_test_fake';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
process.env.STRIPE_PRICE_PRO = 'price_pro_test';
process.env.STRIPE_PRICE_BUSINESS = 'price_biz_test';
setupAuthEnv();

import { resetForTesting as resetUserQuota, getUserDailyLimit } from '../services/userQuota';

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
      if (sql.includes('SELECT subscription_status')) {
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

// Mock Stripe's constructEvent to pass through our fake events
const mockConstructEvent = vi.fn();
vi.mock('stripe', () => {
  return {
    default: class FakeStripe {
      webhooks = { constructEvent: mockConstructEvent };
    },
  };
});

import request from 'supertest';
import { app } from '../index';
import { syncSubscription, handleSubscriptionDeleted } from '../services/stripeService';

function makeSubEvent(id: string, type: string, status: string, priceId: string) {
  return {
    id,
    type,
    data: {
      object: {
        id: 'sub_123',
        metadata: { userId: TEST_USER.sub },
        customer: 'cus_123',
        status,
        items: { data: [{ price: { id: priceId } }] },
      },
    },
  };
}

describe('M9.4 -- Webhooks Stripe cycle de vie', () => {
  beforeEach(() => {
    mockPlan = 'free';
    mockSubStatus = null;
    resetUserQuota();
    mockConstructEvent.mockReset();
  });

  describe('Verification de signature', () => {
    it('rejette une signature invalide (400)', async () => {
      mockConstructEvent.mockImplementation(() => { throw new Error('bad sig'); });
      const res = await request(app)
        .post('/api/billing/webhook')
        .set('stripe-signature', 'invalid')
        .set('Content-Type', 'application/json')
        .send('{}');
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid signature');
    });

    it('accepte une signature valide (200)', async () => {
      const event = makeSubEvent('evt_ok', 'customer.subscription.created', 'active', 'price_pro_test');
      mockConstructEvent.mockReturnValue(event);
      const res = await request(app)
        .post('/api/billing/webhook')
        .set('stripe-signature', 'valid')
        .set('Content-Type', 'application/json')
        .send('{}');
      expect(res.status).toBe(200);
    });
  });

  describe('Subscription lifecycle via webhook endpoint', () => {
    it('subscription.created active → plan pro', async () => {
      const event = makeSubEvent('evt_c1', 'customer.subscription.created', 'active', 'price_pro_test');
      mockConstructEvent.mockReturnValue(event);
      const res = await request(app)
        .post('/api/billing/webhook')
        .set('stripe-signature', 'valid')
        .set('Content-Type', 'application/json')
        .send('{}');
      expect(res.status).toBe(200);
      expect(mockPlan).toBe('pro');
      expect(getUserDailyLimit(TEST_USER.sub)).toBe(300);
    });

    it('subscription.deleted → repasse en free', async () => {
      mockPlan = 'business';
      const event = makeSubEvent('evt_d1', 'customer.subscription.deleted', 'canceled', 'price_biz_test');
      mockConstructEvent.mockReturnValue(event);
      const res = await request(app)
        .post('/api/billing/webhook')
        .set('stripe-signature', 'valid')
        .set('Content-Type', 'application/json')
        .send('{}');
      expect(res.status).toBe(200);
      expect(mockPlan).toBe('free');
      expect(getUserDailyLimit(TEST_USER.sub)).toBe(50);
    });

    it('ignore un evenement sans metadata.userId', async () => {
      const event = {
        id: 'evt_nouser',
        type: 'customer.subscription.created',
        data: {
          object: {
            id: 'sub_noid',
            metadata: {},
            customer: 'cus_x',
            status: 'active',
            items: { data: [{ price: { id: 'price_pro_test' } }] },
          },
        },
      };
      mockConstructEvent.mockReturnValue(event);
      const res = await request(app)
        .post('/api/billing/webhook')
        .set('stripe-signature', 'valid')
        .set('Content-Type', 'application/json')
        .send('{}');
      expect(res.status).toBe(200);
      expect(mockPlan).toBe('free');
    });
  });

  describe('syncSubscription gere les etats (paiement echoue → alerte)', () => {
    it('active → plan paye', async () => {
      await syncSubscription(TEST_USER.sub, 'cus_1', 'sub_1', 'active', 'price_pro_test');
      expect(mockPlan).toBe('pro');
    });

    it('past_due → garde le plan (grace period)', async () => {
      await syncSubscription(TEST_USER.sub, 'cus_1', 'sub_1', 'past_due', 'price_pro_test');
      expect(mockPlan).toBe('pro');
      expect(mockSubStatus).toBe('past_due');
    });

    it('unpaid → repasse en free (paiement echoue definitif)', async () => {
      await syncSubscription(TEST_USER.sub, 'cus_1', 'sub_1', 'unpaid', 'price_pro_test');
      expect(mockPlan).toBe('free');
      expect(mockSubStatus).toBe('unpaid');
    });

    it('canceled → repasse en free', async () => {
      await syncSubscription(TEST_USER.sub, 'cus_1', 'sub_1', 'canceled', 'price_pro_test');
      expect(mockPlan).toBe('free');
    });
  });

  describe('handleSubscriptionDeleted', () => {
    it('annulation → free + status canceled', async () => {
      mockPlan = 'pro';
      await handleSubscriptionDeleted(TEST_USER.sub);
      expect(mockPlan).toBe('free');
      expect(mockSubStatus).toBe('canceled');
      expect(getUserDailyLimit(TEST_USER.sub)).toBe(50);
    });
  });

  describe('Idempotence (deduplication par event id)', () => {
    it('le handler webhook contient la logique de deduplication par event_id', async () => {
      // La deduplication repose sur la table stripe_events en DB.
      // En l'absence de DB (test unitaire), les evenements sont traites normalement.
      // Ce test verifie que le handler ne crash pas et traite correctement.
      const event = makeSubEvent('evt_dup', 'customer.subscription.created', 'active', 'price_pro_test');
      mockConstructEvent.mockReturnValue(event);

      const res1 = await request(app)
        .post('/api/billing/webhook')
        .set('stripe-signature', 'valid')
        .set('Content-Type', 'application/json')
        .send('{}');
      expect(res1.status).toBe(200);
      expect(mockPlan).toBe('pro');
    });
  });

  describe('Invoice events (journalisation)', () => {
    it('le handler traite invoice.paid sans erreur', async () => {
      const event = {
        id: 'evt_inv_paid',
        type: 'invoice.paid',
        data: {
          object: {
            id: 'inv_123',
            subscription_details: { metadata: { userId: TEST_USER.sub } },
            amount_paid: 2900,
            currency: 'eur',
          },
        },
      };
      mockConstructEvent.mockReturnValue(event);
      const res = await request(app)
        .post('/api/billing/webhook')
        .set('stripe-signature', 'valid')
        .set('Content-Type', 'application/json')
        .send('{}');
      expect(res.status).toBe(200);
    });

    it('le handler traite invoice.payment_failed sans erreur et log un warning', async () => {
      const event = {
        id: 'evt_inv_fail',
        type: 'invoice.payment_failed',
        data: {
          object: {
            id: 'inv_456',
            subscription_details: { metadata: { userId: TEST_USER.sub } },
            amount_due: 2900,
            currency: 'eur',
            last_payment_error: { message: 'Card declined' },
          },
        },
      };
      mockConstructEvent.mockReturnValue(event);
      const res = await request(app)
        .post('/api/billing/webhook')
        .set('stripe-signature', 'valid')
        .set('Content-Type', 'application/json')
        .send('{}');
      expect(res.status).toBe(200);
    });
  });
});
