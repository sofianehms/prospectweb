import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { requireInternalSecret } from '../middleware/auth';
import { listPlans, getUserPlan, setUserPlan, getPlan, isPaidPlan, getUserSubscriptionStatus } from '../services/planStore';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  const plans = await listPlans();
  res.json(plans);
});

router.use(requireInternalSecret);
router.use(requireAuth);

router.get('/me', async (req: Request, res: Response) => {
  const userId = req.user!.sub;
  const [plan, subscriptionStatus] = await Promise.all([
    getUserPlan(userId),
    getUserSubscriptionStatus(userId),
  ]);
  res.json({ ...plan, subscriptionStatus });
});

router.patch('/me', async (req: Request, res: Response) => {
  const { planId } = req.body ?? {};
  if (!planId || typeof planId !== 'string') {
    res.status(400).json({ error: 'planId requis.' });
    return;
  }
  const plans = await listPlans();
  if (!plans.some(p => p.id === planId)) {
    res.status(400).json({ error: 'Plan inconnu.' });
    return;
  }
  const targetPlan = await getPlan(planId);
  if (isPaidPlan(targetPlan)) {
    res.status(403).json({ error: 'Les plans payants ne peuvent être activés que via un abonnement Stripe.' });
    return;
  }

  const userId = req.user!.sub;
  const currentStatus = await getUserSubscriptionStatus(userId);
  if (currentStatus && ['active', 'trialing', 'past_due'].includes(currentStatus)) {
    res.status(403).json({ error: 'Gérez votre abonnement depuis le portail de facturation.' });
    return;
  }

  await setUserPlan(userId, planId);
  const updated = await getUserPlan(userId);
  res.json(updated);
});

export default router;
