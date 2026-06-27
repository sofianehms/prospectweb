import { Router, Request, Response } from 'express';
import { requireApiKey } from '../middleware/apiKey';
import { listProspects, addProspect, updateCrmStatus, CrmStatus } from '../services/prospectStore';
import { searchRateLimiter } from '../middleware/rateLimit';
import { nearbySearch, getBreakerStatus } from '../services/places';
import { overpassProvider } from '../services/overpassFallback';
import { checkWebsite } from '../services/websiteChecker';
import { geocodeAddress } from '../services/geocode';
import { checkUserQuota, trackUserCalls } from '../services/userQuota';

const router = Router();

const VALID_STATUSES: CrmStatus[] = ['to_contact', 'contacted', 'discussing', 'won', 'lost'];

// ── Prospects ──────────────────────────────────────

router.get('/prospects', requireApiKey('prospects:read'), async (req: Request, res: Response) => {
  const prospects = await listProspects(req.user!.sub);

  const format = req.query.format as string | undefined;
  if (format === 'csv') {
    const header = 'id,name,address,type,phone,mapsUrl,websiteStatus,crmStatus,notes,addedAt';
    const rows = prospects.map(p =>
      [p.id, p.name, p.address, p.type, p.phone ?? '', p.mapsUrl, p.websiteStatus, p.crmStatus, (p.notes ?? '').replace(/"/g, '""'), p.addedAt]
        .map(v => `"${v}"`)
        .join(',')
    );
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="prospects_${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send([header, ...rows].join('\n'));
    return;
  }

  res.json({ total: prospects.length, prospects });
});

router.post('/prospects', requireApiKey('prospects:write'), async (req: Request, res: Response) => {
  const { id, name, address, type, phone, mapsUrl, websiteStatus } = req.body ?? {};
  if (!id || !name || !address || !type || !mapsUrl) {
    res.status(400).json({ error: 'Champs requis : id, name, address, type, mapsUrl.' });
    return;
  }
  const prospect = await addProspect(req.user!.sub, {
    id, name, address, type,
    phone: phone ?? null,
    mapsUrl,
    rating: null,
    ratingCount: null,
    websiteStatus: websiteStatus ?? 'none',
  });
  res.status(201).json(prospect);
});

router.patch('/prospects/:id/status', requireApiKey('prospects:write'), async (req: Request, res: Response) => {
  const { status } = req.body ?? {};
  if (!status || !VALID_STATUSES.includes(status)) {
    res.status(400).json({ error: `Statut invalide. Valeurs : ${VALID_STATUSES.join(', ')}.` });
    return;
  }
  const prospect = await updateCrmStatus(req.user!.sub, req.params.id as string, status);
  if (!prospect) {
    res.status(404).json({ error: 'Prospect non trouvé.' });
    return;
  }
  res.json(prospect);
});

// ── Search ─────────────────────────────────────────

router.get('/search', requireApiKey('search'), searchRateLimiter, async (req: Request, res: Response) => {
  const { address, lat, lng, radius, types } = req.query;

  const radiusMeters = Number(radius);
  if (!radius || isNaN(radiusMeters) || radiusMeters <= 0 || radiusMeters > 10000) {
    res.status(400).json({ error: 'radius requis (1-10000 mètres).' });
    return;
  }

  let center: { lat: number; lng: number };
  if (lat && lng) {
    center = { lat: Number(lat), lng: Number(lng) };
  } else if (address && typeof address === 'string') {
    center = await geocodeAddress(address);
  } else {
    res.status(400).json({ error: 'address ou lat+lng requis.' });
    return;
  }

  const typeList = typeof types === 'string' ? types.split(',').map(t => t.trim()).filter(Boolean) : [];
  const userId = req.user!.sub;

  try {
    checkUserQuota(userId);
  } catch {
    res.status(429).json({ error: 'Quota dépassé.' });
    return;
  }

  const breaker = await getBreakerStatus();
  let places, meta, apiCalls;

  if (breaker.isOpen) {
    const fallback = await overpassProvider.search(center, radiusMeters, typeList);
    places = fallback.places;
    meta = fallback.meta;
    apiCalls = 0;
  } else {
    const result = await nearbySearch(center, radiusMeters, typeList);
    places = result.places;
    meta = result.meta;
    apiCalls = result.apiCalls;
  }

  if (apiCalls > 0) trackUserCalls(userId, apiCalls);

  const establishments = await Promise.all(
    places.map(async (p) => {
      if (!p.website) return { ...p, websiteStatus: 'none' as const, confidenceScore: 0 };
      const result = await checkWebsite(p.website);
      const blocked = result.blocked;
      const ws = !p.website ? 'none' : blocked ? 'blocked' : !result.reachable ? 'unreachable' : !result.hasRecentContent ? 'outdated' : 'active';
      return { ...p, websiteStatus: ws as 'none' | 'unreachable' | 'outdated' | 'active' | 'blocked', confidenceScore: result.confidenceScore };
    })
  );

  res.json({
    center,
    radius: radiusMeters,
    total: establishments.length,
    establishments,
    meta,
  });
});

export default router;
