import { Request, Response } from 'express';
import {
  getStripe,
  syncSubscription,
  handleSubscriptionDeleted,
} from '../services/stripeService';
import type Stripe from 'stripe';

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
        break;
      }
    }
  } catch (err) {
    console.error('[stripe webhook] Error processing event:', err);
  }

  res.json({ received: true });
}
