import { Router, Request, Response } from 'express';
import { geocodeAddress } from '../services/geocode';
import { nearbySearch, Place, COMMERCIAL_TYPES, SearchMeta } from '../services/places';
import { checkWebsite } from '../services/websiteChecker';
import { cacheKey, getCached, setCached } from '../services/cache';
import { requireInternalSecret } from '../middleware/auth';
import { searchRateLimiter } from '../middleware/rateLimit';
import { requireAuth } from '../middleware/requireAuth';
import { QuotaExceededError } from '../services/googleQuota';
import { GoogleApiError } from '../services/places';
import { checkUserQuota, trackUserCalls, UserQuotaExceededError } from '../services/userQuota';
import { recordSearch, getKnownPlaceIds } from '../services/searchHistory';

const router = Router();
router.use(requireInternalSecret);
router.use(requireAuth);
router.use(searchRateLimiter);

export type SiteStatus = 'none' | 'unreachable' | 'outdated' | 'active';

export interface Establishment extends Place {
  websiteStatus: SiteStatus;
  confidenceScore: number;
  alreadySaved?: boolean;
}

function resolveSiteStatus(
  website: string | null,
  reachable: boolean,
  hasRecentContent: boolean,
): SiteStatus {
  if (!website)          return 'none';
  if (!reachable)        return 'unreachable';
  if (!hasRecentContent) return 'outdated';
  return 'active';
}

// GET /api/search?address=Paris&radius=1000&type=restaurant
// GET /api/search?lat=48.85&lng=2.35&radius=1000&type=restaurant
router.get('/', async (req: Request, res: Response) => {
  const { address, lat, lng, radius, types } = req.query;

  const radiusMeters = Number(radius);
  if (!radius || isNaN(radiusMeters) || radiusMeters <= 0 || radiusMeters > 10000) {
    res.status(400).json({ error: 'Le paramètre radius est requis (1–10000 mètres).' });
    return;
  }

  let center: { lat: number; lng: number };

  if (lat && lng) {
    center = { lat: Number(lat), lng: Number(lng) };
    if (isNaN(center.lat) || isNaN(center.lng)) {
      res.status(400).json({ error: 'Paramètres lat/lng invalides.' });
      return;
    }
  } else if (address && typeof address === 'string') {
    try {
      center = await geocodeAddress(address);
    } catch (err) {
      const msg = (err as Error).message;
      res.status(400).json({ error: msg });
      return;
    }
  } else {
    res.status(400).json({ error: 'Fournir soit address, soit lat+lng.' });
    return;
  }

  try {
    const MAX_TYPES = 8;

    const typeList = typeof types === 'string' && types.trim()
      ? types.split(',').map(t => t.trim()).filter(Boolean)
      : [];

    if (typeList.length > 0) {
      const invalid = typeList.filter(t => !COMMERCIAL_TYPES.includes(t));
      if (invalid.length > 0) {
        res.status(400).json({
          error: `Types invalides : ${invalid.join(', ')}. Types autorisés : ${COMMERCIAL_TYPES.join(', ')}.`,
        });
        return;
      }
    }

    if (typeList.length > MAX_TYPES) {
      res.status(400).json({
        error: `Trop de types demandés (${typeList.length}). Maximum autorisé : ${MAX_TYPES}.`,
      });
      return;
    }

    const key = cacheKey({
      lat: Number(center.lat.toFixed(4)),
      lng: Number(center.lng.toFixed(4)),
      radius: radiusMeters,
      types: typeList.slice().sort().join(','),
    });
    const cached = await getCached<{ center: typeof center; radius: number; summary: object; establishments: unknown[] }>(key);
    if (cached) {
      res.json(cached);
      return;
    }

    const userId = req.user!.sub;

    if (process.env.DATABASE_URL) {
      try {
        const { syncLimitFromPlan } = await import('../services/userQuota');
        await syncLimitFromPlan(userId);
      } catch { /* fallback to env default */ }
    }

    checkUserQuota(userId);

    console.log(`[search] user=${req.user?.email} types=${typeList.join(',') || 'all'} radius=${radiusMeters}`);
    const { places, meta, apiCalls } = await nearbySearch(center, radiusMeters, typeList);
    if (apiCalls > 0) trackUserCalls(userId, apiCalls);

    const establishments: Establishment[] = await Promise.all(
      places.map(async (p): Promise<Establishment> => {
        if (!p.website) {
          return { ...p, websiteStatus: 'none', confidenceScore: 0 };
        }

        const result = await checkWebsite(p.website);
        return {
          ...p,
          websiteStatus: resolveSiteStatus(p.website, result.reachable, result.hasRecentContent),
          confidenceScore: result.confidenceScore,
        };
      })
    );

    const summary = {
      total:       establishments.length,
      none:        establishments.filter(e => e.websiteStatus === 'none').length,
      unreachable: establishments.filter(e => e.websiteStatus === 'unreachable').length,
      outdated:    establishments.filter(e => e.websiteStatus === 'outdated').length,
      active:      establishments.filter(e => e.websiteStatus === 'active').length,
    };

    let knownIds = new Set<string>();
    try { knownIds = await getKnownPlaceIds(userId); } catch { /* DB may be absent */ }
    for (const e of establishments) {
      if (knownIds.has(e.id)) e.alreadySaved = true;
    }

    const payload = { center, radius: radiusMeters, summary, meta, establishments };
    await setCached(key, payload);
    await Promise.all(
      establishments.map(e => setCached(`establishment:${e.id}`, e))
    );

    const addressStr = typeof address === 'string' ? address : `${center.lat},${center.lng}`;
    recordSearch(userId, {
      address: addressStr,
      lat: center.lat,
      lng: center.lng,
      radius: radiusMeters,
      types: typeList.join(','),
      resultCount: establishments.length,
    }).catch(err => console.error('[search-history] save failed:', err.message));

    res.json(payload);
  } catch (err) {
    if (err instanceof UserQuotaExceededError || err instanceof QuotaExceededError) {
      res.status(429).json({ error: err.message });
      return;
    }
    if (err instanceof GoogleApiError) {
      const status = err.status === 403 || err.status === 429 ? 503 : 502;
      res.status(status).json({ error: `Service Google indisponible (${err.status}). Réessayez plus tard.` });
      return;
    }
    console.error('[search] unhandled error:', err);
    res.status(502).json({ error: 'Erreur interne du serveur.' });
  }
});

export default router;
