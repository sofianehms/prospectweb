import { Router, Request, Response } from 'express';
import { geocodeAddress } from '../services/geocode';
import { nearbySearch, Place, COMMERCIAL_TYPES } from '../services/places';
import { checkWebsite } from '../services/websiteChecker';
import { cacheKey, getCached, setCached } from '../services/cache';
import { requireInternalSecret } from '../middleware/auth';
import { searchRateLimiter } from '../middleware/rateLimit';
import { QuotaExceededError } from '../services/googleQuota';

const router = Router();
router.use(searchRateLimiter);
router.use(requireInternalSecret);

export type WebsiteStatus = 'none' | 'outdated' | 'ok';

export interface Establishment extends Place {
  websiteStatus: WebsiteStatus;
}

function resolveWebsiteStatus(
  website: string | null,
  reachable: boolean,
  hasRecentContent: boolean
): WebsiteStatus {
  if (!website)              return 'none';
  if (!reachable)            return 'outdated';
  if (!hasRecentContent)     return 'outdated';
  return 'ok';
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
      res.status(400).json({ error: (err as Error).message });
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
    const cached = getCached<{ center: typeof center; radius: number; summary: object; establishments: unknown[] }>(key);
    if (cached) {
      res.json(cached);
      return;
    }

    const places = await nearbySearch(center, radiusMeters, typeList);

    const establishments: Establishment[] = await Promise.all(
      places.map(async (p): Promise<Establishment> => {
        if (!p.website) {
          return { ...p, websiteStatus: 'none' };
        }

        const { reachable, hasRecentContent } = await checkWebsite(p.website);
        return {
          ...p,
          websiteStatus: resolveWebsiteStatus(p.website, reachable, hasRecentContent),
        };
      })
    );

    const summary = {
      total:    establishments.length,
      none:     establishments.filter(e => e.websiteStatus === 'none').length,
      outdated: establishments.filter(e => e.websiteStatus === 'outdated').length,
      ok:       establishments.filter(e => e.websiteStatus === 'ok').length,
    };

    const payload = { center, radius: radiusMeters, summary, establishments };
    setCached(key, payload);
    res.json(payload);
  } catch (err) {
    if (err instanceof QuotaExceededError) {
      res.status(429).json({ error: err.message });
      return;
    }
    res.status(502).json({ error: (err as Error).message });
  }
});

export default router;
