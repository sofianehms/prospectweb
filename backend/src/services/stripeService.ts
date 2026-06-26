import Stripe from 'stripe';
import { getPool } from './db';
import { ensureClerkUser } from './userStore';
import { syncLimitFromPlan } from './userQuota';

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('STRIPE_SECRET_KEY non configuré');
    _stripe = new Stripe(key, { apiVersion: '2026-06-24.dahlia' });
  }
  return _stripe;
}

function getPriceMap(): Record<string, string> {
  return {
    pro: process.env.STRIPE_PRICE_PRO ?? '',
    business: process.env.STRIPE_PRICE_BUSINESS ?? '',
  };
}

export function planIdFromPriceId(priceId: string): string | undefined {
  const priceMap = getPriceMap();
  for (const [plan, price] of Object.entries(priceMap)) {
    if (price === priceId) return plan;
  }
  return undefined;
}

export async function getOrCreateCustomer(userId: string, email: string): Promise<string> {
  // Guarantee the user row exists before linking a Stripe customer to it.
  await ensureClerkUser(userId, email);

  const { rows } = await getPool().query<{ stripe_customer_id: string | null }>(
    'SELECT stripe_customer_id FROM users WHERE id = $1',
    [userId],
  );

  const existing = rows[0]?.stripe_customer_id;
  if (existing) return existing;

  const customer = await getStripe().customers.create({
    email: email || undefined,
    metadata: { userId },
  });

  await getPool().query(
    'UPDATE users SET stripe_customer_id = $1 WHERE id = $2',
    [customer.id, userId],
  );

  return customer.id;
}

export async function createCheckoutSession(
  userId: string,
  email: string,
  planId: string,
  successUrl: string,
  cancelUrl: string,
): Promise<string> {
  const priceId = getPriceMap()[planId];
  if (!priceId) throw new Error(`No Stripe price configured for plan: ${planId}`);

  const customerId = await getOrCreateCustomer(userId, email);

  const session = await getStripe().checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    subscription_data: {
      metadata: { userId, planId },
    },
    metadata: { userId, planId },
  });

  return session.url!;
}

export async function createBillingPortalSession(
  userId: string,
  returnUrl: string,
): Promise<string> {
  const { rows } = await getPool().query<{ stripe_customer_id: string | null }>(
    'SELECT stripe_customer_id FROM users WHERE id = $1',
    [userId],
  );

  const customerId = rows[0]?.stripe_customer_id;
  if (!customerId) throw new Error('No Stripe customer for this user');

  const session = await getStripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session.url;
}

/**
 * Reflects a Stripe subscription state onto the user. Linked by the Clerk user id
 * carried in the subscription metadata (always set by our checkout). Also persists
 * the Stripe customer id so the billing portal keeps working.
 */
export async function syncSubscription(
  userId: string,
  customerId: string,
  subscriptionId: string,
  status: string,
  priceId: string,
): Promise<void> {
  const planId = planIdFromPriceId(priceId);
  const keepPaid = ['active', 'trialing', 'past_due'].includes(status);
  const effectivePlan = keepPaid && planId ? planId : 'free';

  const { rowCount } = await getPool().query(
    `UPDATE users
     SET stripe_customer_id = $1,
         stripe_subscription_id = $2,
         subscription_status = $3,
         plan = $4
     WHERE id = $5`,
    [customerId, subscriptionId, status, effectivePlan, userId],
  );

  if (!rowCount) {
    console.error(`[stripe] syncSubscription: aucun utilisateur avec id=${userId}`);
    return;
  }

  await syncLimitFromPlan(userId);
  console.log(`[stripe] syncSubscription: user=${userId} plan=${effectivePlan}`);
}

export async function handleSubscriptionDeleted(userId: string): Promise<void> {
  const { rowCount } = await getPool().query(
    `UPDATE users
     SET stripe_subscription_id = NULL,
         subscription_status = 'canceled',
         plan = 'free'
     WHERE id = $1`,
    [userId],
  );

  if (!rowCount) {
    console.error(`[stripe] handleSubscriptionDeleted: aucun utilisateur avec id=${userId}`);
    return;
  }

  await syncLimitFromPlan(userId);
  console.log(`[stripe] handleSubscriptionDeleted: user=${userId} reverted to free`);
}
