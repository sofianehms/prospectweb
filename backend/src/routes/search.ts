import { Router, Request, Response } from 'express';
import { geocodeAddress } from '../services/geocode';
import { nearbySearch, Place, COMMERCIAL_TYPES, SearchMeta, getBreakerStatus, GoogleApiError } from '../services/places';
import { overpassProvider } from '../services/overpassFallback';
import { checkWebsite } from '../services/websiteChecker';
import { cacheKey, getCached, setCached } from '../services/cache';
import { requireInternalSecret } from '../middleware/auth';
import { searchRateLimiter } from '../middleware/rateLimit';
import { requireAuth } from '../middleware/requireAuth';
import { QuotaExceededError } from '../services/googleQuota';
import { checkUserQuota, trackUserCalls, setUserLimitOverride, UserQuotaExceededError, getUserTotalCalls } from '../services/userQuota';
import { recordSearch, getKnownPlaceIds, countUserSearches } from '../services/searchHistory';
import { getUserPlan, isFreePlan, FreePlanLimitError, FREE_PLAN_SEARCH_LIMIT } from '../services/planStore';

const router = Router();
router.use(requireInternalSecret);
router.use(requireAuth);
router.use(searchRateLimiter);

export type SiteStatus = 'none' | 'unreachable' | 'outdated' | 'active' | 'blocked';

export interface Establishment extends Place {
  websiteStatus: SiteStatus;
  confidenceScore: number;
  alreadySaved?: boolean;
}

type SearchRecordPayload = {
  address: string;
  lat: number;
  lng: number;
  radius: number;
  types: string;
  resultCount: number;
};

function resolveSiteStatus(
  website: string | null,
  reachable: boolean,
  hasRecentContent: boolean,
  blocked: boolean,
): SiteStatus {
  if (!website)          return 'none';
  if (blocked)           return 'blocked';
  if (!reachable)        return 'unreachable';
  if (!hasRecentContent) return 'outdated';
  return 'active';
}

async function consumeSearch(
  userId: string,
  data: SearchRecordPayload,
  mustPersist: boolean,
): Promise<void> {
  if (mustPersist) {
    await recordSearch(userId, data);
    return;
  }

  recordSearch(userId, data).catch(err => console.error('[search-history] save failed:', err.message));
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

    const userId = req.user!.sub;
    const addressStr = typeof address === 'string' ? address : `${center.lat},${center.lng}`;

    // Gate du plan gratuit : 1 seule recherche à vie. Vérifié AVANT le cache pour qu'un
    // utilisateur ayant déjà consommé sa recherche soit bloqué même sur un résultat en cache.
    let onFreePlan = false;
    if (process.env.DATABASE_URL) {
      try {
        const plan = await getUserPlan(userId);
        setUserLimitOverride(userId, plan.dailyLimit);

        if (isFreePlan(plan)) {
          onFreePlan = true;
          const [previousSearches, totalCalls] = await Promise.all([
            countUserSearches(userId),
            getUserTotalCalls(userId),
          ]);
          const consumedSearches = Math.max(previousSearches, totalCalls > 0 ? FREE_PLAN_SEARCH_LIMIT : 0);
          if (consumedSearches >= FREE_PLAN_SEARCH_LIMIT) {
            throw new FreePlanLimitError();
          }
        }
      } catch (err) {
        if (err instanceof FreePlanLimitError) throw err;
        /* sinon : on retombe sur la limite par défaut (env) */
      }
    }

    const key = cacheKey({
      lat: Number(center.lat.toFixed(4)),
      lng: Number(center.lng.toFixed(4)),
      radius: radiusMeters,
      types: typeList.slice().sort().join(','),
    });
    const cached = await getCached<{ center: typeof center; radius: number; summary: object; establishments: unknown[] }>(key);
    if (cached) {
      // Un résultat servi depuis le cache compte quand même comme la recherche unique du plan gratuit.
      await consumeSearch(userId, {
        address: addressStr,
        lat: center.lat,
        lng: center.lng,
        radius: radiusMeters,
        types: typeList.join(','),
        resultCount: cached.establishments.length,
      }, onFreePlan);
      res.json(cached);
      return;
    }

    checkUserQuota(userId);

    console.log(`[search] user=${req.user?.email} types=${typeList.join(',') || 'all'} radius=${radiusMeters}`);

    let places: Place[];
    let meta: SearchMeta;
    let apiCalls: number;
    let provider: 'google' | 'overpass' = 'google';

    const breaker = await getBreakerStatus();
    if (breaker.isOpen) {
      console.warn('[search] circuit-breaker ouvert, bascule sur Overpass (OSM)');
      const fallback = await overpassProvider.search(center, radiusMeters, typeList);
      places = fallback.places;
      meta = fallback.meta;
      apiCalls = 0;
      provider = 'overpass';
    } else {
      const result = await nearbySearch(center, radiusMeters, typeList);
      places = result.places;
      meta = result.meta;
      apiCalls = result.apiCalls;
    }

    if (apiCalls > 0) trackUserCalls(userId, apiCalls);

    const establishments: Establishment[] = await Promise.all(
      places.map(async (p): Promise<Establishment> => {
        if (!p.website) {
          return { ...p, websiteStatus: 'none', confidenceScore: 0 };
        }

        const result = await checkWebsite(p.website);
        return {
          ...p,
          websiteStatus: resolveSiteStatus(p.website, result.reachable, result.hasRecentContent, result.blocked),
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
      blocked:     establishments.filter(e => e.websiteStatus === 'blocked').length,
    };

    let knownIds = new Set<string>();
    try { knownIds = await getKnownPlaceIds(userId); } catch { /* DB may be absent */ }
    for (const e of establishments) {
      if (knownIds.has(e.id)) e.alreadySaved = true;
    }

    const payload = { center, radius: radiusMeters, summary, meta, provider, establishments };
    await setCached(key, payload);
    await Promise.all(
      establishments.map(e => setCached(`establishment:${e.id}`, e))
    );

    await consumeSearch(userId, {
      address: addressStr,
      lat: center.lat,
      lng: center.lng,
      radius: radiusMeters,
      types: typeList.join(','),
      resultCount: establishments.length,
    }, onFreePlan);

    res.json(payload);
  } catch (err) {
    if (err instanceof FreePlanLimitError) {
      res.status(402).json({ error: err.message });
      return;
    }
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
