import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { requireInternalSecret } from '../middleware/auth';
import {
  createCheckoutSession,
  createBillingPortalSession,
  getSubscriptionDetails,
  listInvoices,
} from '../services/stripeService';
import { isPaidPlan, getPlan } from '../services/planStore';

const router = Router();

router.use(requireInternalSecret);
router.use(requireAuth);

router.post('/checkout', async (req: Request, res: Response) => {
  const { planId } = req.body ?? {};
  if (!planId || typeof planId !== 'string') {
    res.status(400).json({ error: 'planId requis.' });
    return;
  }

  const plan = await getPlan(planId);
  if (!isPaidPlan(plan)) {
    res.status(400).json({ error: 'Ce plan ne nécessite pas de paiement.' });
    return;
  }

  const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
  try {
    const url = await createCheckoutSession(
      req.user!.sub,
      req.user!.email,
      planId,
      `${frontendUrl}/settings?checkout=success`,
      `${frontendUrl}/settings?checkout=cancel`,
    );
    res.json({ url });
  } catch (err: any) {
    console.error('[billing] Checkout error:', err.message);
    res.status(500).json({ error: 'Impossible de créer la session de paiement.' });
  }
});

router.post('/portal', async (req: Request, res: Response) => {
  const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
  try {
    const url = await createBillingPortalSession(
      req.user!.sub,
      `${frontendUrl}/settings`,
    );
    res.json({ url });
  } catch (err: any) {
    console.error('[billing] Portal error:', err.message);
    res.status(500).json({ error: 'Impossible d\'ouvrir le portail de facturation.' });
  }
});

router.get('/subscription', async (req: Request, res: Response) => {
  try {
    const details = await getSubscriptionDetails(req.user!.sub);
    res.json(details ?? { status: 'none', currentPeriodEnd: null, cancelAtPeriodEnd: false });
  } catch (err: any) {
    console.error('[billing] Subscription details error:', err.message);
    res.status(500).json({ error: 'Impossible de charger les détails de l\'abonnement.' });
  }
});

router.get('/invoices', async (req: Request, res: Response) => {
  try {
    const invoices = await listInvoices(req.user!.sub);
    res.json(invoices);
  } catch (err: any) {
    console.error('[billing] Invoices error:', err.message);
    res.status(500).json({ error: 'Impossible de charger les factures.' });
  }
});

export default router;
