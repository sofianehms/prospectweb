import { Router, Request, Response } from 'express';
import { getCached, setCached } from '../services/cache';
import { requireInternalSecret } from '../middleware/auth';
import { requireAuth } from '../middleware/requireAuth';
import { fetchPlaceDetails, GoogleApiError } from '../services/places';
import { checkUserQuota, trackUserCalls } from '../services/userQuota';

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

router.get('/:id/details', async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const cacheKey = `establishment-details:${id}`;

  const cached = await getCached<unknown>(cacheKey);
  if (cached) {
    res.json(cached);
    return;
  }

  try {
    const userId = req.user!.sub;
    checkUserQuota(userId);
    const { apiCalls, ...details } = await fetchPlaceDetails(id);
    if (apiCalls > 0) trackUserCalls(userId, apiCalls);

    await setCached(cacheKey, details);
    res.json(details);
  } catch (err) {
    if (err instanceof GoogleApiError) {
      res.status(502).json({ error: 'Impossible de charger les détails.' });
      return;
    }
    res.status(500).json({ error: 'Erreur interne.' });
  }
});

export default router;
