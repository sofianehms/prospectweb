import { Router, Request, Response } from 'express';
import { geocodeAddress } from '../services/geocode';
import { nearbySearch, Place } from '../services/places';
import { checkWebsite } from '../services/websiteChecker';

const router = Router();

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
  const { address, lat, lng, radius, type } = req.query;

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
    const placeType = typeof type === 'string' && type.trim() ? type.trim() : null;
    const places    = await nearbySearch(center, radiusMeters, placeType);

    // Vérification des sites web en parallèle (uniquement ceux qui en ont un)
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

    res.json({ center, radius: radiusMeters, summary, establishments });
  } catch (err) {
    res.status(502).json({ error: (err as Error).message });
  }
});

export default router;
