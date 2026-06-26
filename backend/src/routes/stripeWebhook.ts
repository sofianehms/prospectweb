import { Request, Response } from 'express';
import {
  getStripe,
  syncSubscription,
  handleSubscriptionDeleted,
} from '../services/stripeService';
import type Stripe from 'stripe';

function getDb() {
  try {
    if (!process.env.DATABASE_URL) return null;
    const { getPool } = require('../services/db') as typeof import('../services/db');
    return getPool();
  } catch { return null; }
}

async function isEventProcessed(eventId: string): Promise<boolean> {
  const db = getDb();
  if (!db) return false;
  try {
    const { rows } = await db.query('SELECT 1 FROM stripe_events WHERE event_id = $1', [eventId]);
    return rows.length > 0;
  } catch { return false; }
}

async function markEventProcessed(eventId: string, eventType: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  try {
    await db.query(
      'INSERT INTO stripe_events (event_id, event_type) VALUES ($1, $2) ON CONFLICT (event_id) DO NOTHING',
      [eventId, eventType],
    );
  } catch (err) {
    console.error('[stripe webhook] failed to mark event processed:', (err as Error).message);
  }
}

async function logPaymentEvent(
  userId: string | null,
  eventType: string,
  invoiceId: string | null,
  amount: number | null,
  currency: string | null,
  status: string,
  failureMessage: string | null,
): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db.query(
    `INSERT INTO stripe_payment_log (user_id, event_type, invoice_id, amount, currency, status, failure_message)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [userId, eventType, invoiceId, amount, currency, status, failureMessage],
  ).catch((err: Error) => console.error('[stripe webhook] log write failed:', err.message));
}

export async function stripeWebhookHandler(req: Request, res: Response): Promise<void> {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? '';

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch {
    res.status(400).json({ error: 'Invalid signature' });
    return;
  }

  if (await isEventProcessed(event.id)) {
    console.log(`[stripe webhook] event ${event.id} already processed, skipping`);
    res.json({ received: true, deduplicated: true });
    return;
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata.userId;
        if (!userId) {
          console.error(`[stripe webhook] ${event.type} sans metadata.userId (sub ${sub.id})`);
          break;
        }
        const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
        const priceId = sub.items.data[0]?.price.id ?? '';
        await syncSubscription(userId, customerId, sub.id, sub.status, priceId);
        console.log(`[stripe webhook] ${event.type}: user=${userId} status=${sub.status}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata.userId;
        if (!userId) {
          console.error(`[stripe webhook] subscription.deleted sans metadata.userId (sub ${sub.id})`);
          break;
        }
        await handleSubscriptionDeleted(userId);
        console.log(`[stripe webhook] subscription.deleted: user=${userId}`);
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        const userId = (invoice as any).subscription_details?.metadata?.userId ?? null;
        await logPaymentEvent(
          userId,
          'invoice.paid',
          invoice.id,
          invoice.amount_paid,
          invoice.currency,
          'paid',
          null,
        );
        console.log(`[stripe webhook] invoice.paid: invoice=${invoice.id} amount=${invoice.amount_paid} ${invoice.currency}`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const userId = (invoice as any).subscription_details?.metadata?.userId ?? null;
        const failureMessage = (invoice as any).last_payment_error?.message
          ?? 'Payment failed';
        await logPaymentEvent(
          userId,
          'invoice.payment_failed',
          invoice.id,
          invoice.amount_due,
          invoice.currency,
          'failed',
          failureMessage,
        );
        console.warn(`[stripe webhook] PAYMENT FAILED: invoice=${invoice.id} user=${userId ?? 'unknown'} amount=${invoice.amount_due} reason=${failureMessage}`);
        break;
      }
    }

    await markEventProcessed(event.id, event.type);
  } catch (err) {
    console.error('[stripe webhook] Error processing event:', err);
    res.status(500).json({ error: 'Webhook processing failed' });
    return;
  }

  res.json({ received: true });
}
