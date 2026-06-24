import { Router, Request, Response } from 'express';
import { getCached } from '../services/cache';
import { requireInternalSecret } from '../middleware/auth';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();
router.use(requireInternalSecret);
router.use(requireAuth);

router.get('/:id', async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const cached = await getCached<unknown>(`establishment:${id}`);

  if (cached) {
    res.json(cached);
    return;
  }

  res.status(404).json({ error: 'Établissement non trouvé. Relancez une recherche.' });
});

export default router;
