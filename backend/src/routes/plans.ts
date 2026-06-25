import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { requireInternalSecret } from '../middleware/auth';
import { listPlans, getUserPlan, setUserPlan, getPlan, isPaidPlan } from '../services/planStore';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  const plans = await listPlans();
  res.json(plans);
});

router.use(requireInternalSecret);
router.use(requireAuth);

router.get('/me', async (req: Request, res: Response) => {
  const plan = await getUserPlan(req.user!.sub);
  res.json(plan);
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
    // M7.2: block paid plan assignment until Stripe is wired (M9)
    res.status(403).json({ error: 'Abonnement payant requis pour ce plan.' });
    return;
  }
  await setUserPlan(req.user!.sub, planId);
  const updated = await getUserPlan(req.user!.sub);
  res.json(updated);
});

export default router;
