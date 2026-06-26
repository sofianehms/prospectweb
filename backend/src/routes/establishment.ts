import { Router, Request, Response } from 'express';
import { getCached, setCached } from '../services/cache';
import { requireInternalSecret } from '../middleware/auth';
import { requireAuth } from '../middleware/requireAuth';
import { fetchPlaceById, fetchPlaceDetails, GoogleApiError } from '../services/places';
import { checkUserQuota, trackUserCalls } from '../services/userQuota';
import { checkWebsite } from '../services/websiteChecker';
import type { SiteStatus } from './search';

function resolveSiteStatus(website: string | null, reachable: boolean, hasRecentContent: boolean): SiteStatus {
  if (!website)          return 'none';
  if (!reachable)        return 'unreachable';
  if (!hasRecentContent) return 'outdated';
  return 'active';
}

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

  try {
    const userId = req.user!.sub;
    if (process.env.DATABASE_URL) {
      try {
        const { syncLimitFromPlan } = await import('../services/userQuota');
        await syncLimitFromPlan(userId);
      } catch { /* fallback */ }
    }
    checkUserQuota(userId);
    const { apiCalls, ...place } = await fetchPlaceById(id);
    if (apiCalls > 0) trackUserCalls(userId, apiCalls);

    const wsResult = place.website ? await checkWebsite(place.website) : null;
    const establishment = {
      ...place,
      websiteStatus: resolveSiteStatus(place.website, wsResult?.reachable ?? false, wsResult?.hasRecentContent ?? false),
      confidenceScore: wsResult?.confidenceScore ?? 0,
    };

    await setCached(`establishment:${id}`, establishment);
    res.json(establishment);
  } catch (err) {
    if (err instanceof GoogleApiError) {
      if (err.status === 404 || err.body.includes('NOT_FOUND')) {
        res.status(404).json({ error: 'Établissement introuvable. Ce Place ID n\'existe plus.' });
        return;
      }
      res.status(502).json({ error: 'Impossible de charger l\'établissement.' });
      return;
    }
    if (err instanceof Error && err.message.includes('quota')) {
      res.status(429).json({ error: 'Quota dépassé. Réessayez demain ou passez au plan supérieur.' });
      return;
    }
    res.status(500).json({ error: 'Erreur interne.' });
  }
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
    if (process.env.DATABASE_URL) {
      try {
        const { syncLimitFromPlan } = await import('../services/userQuota');
        await syncLimitFromPlan(userId);
      } catch { /* fallback to env default */ }
    }
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
