import type { LatLng } from './geocode';
import { checkQuota, trackCall } from './googleQuota';
import Redis from 'ioredis';

const NEARBY_URL = 'https://places.googleapis.com/v1/places:searchNearby';

const FIELD_MASK_SEARCH = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.location',
  'places.websiteUri',
  'places.types',
  'places.googleMapsUri',
].join(',');

const DETAIL_FIELD_MASK = 'id,displayName,formattedAddress,location,websiteUri,nationalPhoneNumber,types,googleMapsUri,rating,userRatingCount';
const DETAIL_URL = 'https://places.googleapis.com/v1/places';

// Types de commerces pertinents pour la prospection web.
// Chaque type génère une requête indépendante (max 20 résultats chacune).
export const COMMERCIAL_TYPES = [
  'restaurant',
  'cafe',
  'bar',
  'bakery',
  'hair_salon',
  'beauty_salon',
  'clothing_store',
  'pharmacy',
  'florist',
  'car_repair',
  'hotel',
  'real_estate_agency',
  'gym',
  'supermarket',
  'convenience_store',
  'book_store',
  'jewelry_store',
  'pet_store',
  'travel_agency',
  'dentist',
  'doctor',
  'electrician',
  'plumber',
];

export interface Place {
  id:          string;
  name:        string;
  address:     string;
  lat:         number;
  lng:         number;
  type:        string;
  phone:       string | null;
  website:     string | null;
  mapsUrl:     string;
  rating:      number | null;
  ratingCount: number | null;
}

interface RawPlace {
  id: string;
  displayName?:         { text: string };
  formattedAddress?:    string;
  location?:            { latitude: number; longitude: number };
  websiteUri?:          string;
  nationalPhoneNumber?: string;
  types?:               string[];
  googleMapsUri?:       string;
  rating?:              number;
  userRatingCount?:     number;
}

export class GoogleApiError extends Error {
  constructor(public status: number, public body: string) {
    super(`Google API ${status}: ${body}`);
    this.name = 'GoogleApiError';
  }
}

const BREAKER_THRESHOLD = 3;
const BREAKER_RESET_MS = 60_000;
const BREAKER_REDIS_KEY = 'breaker:google-places';

let consecutiveFailures = 0;
let breakerOpenUntil = 0;

function getRedis(): Redis | null {
  const url = process.env.REDIS_URL;
  if (!url) return null;
  try {
    return new Redis(url, { maxRetriesPerRequest: 1, lazyConnect: false });
  } catch { return null; }
}

async function loadBreakerState(): Promise<void> {
  const r = getRedis();
  if (!r) return;
  try {
    const [failures, openUntil] = await Promise.all([
      r.get(`${BREAKER_REDIS_KEY}:failures`),
      r.get(`${BREAKER_REDIS_KEY}:openUntil`),
    ]);
    r.quit().catch(() => {});
    consecutiveFailures = Number(failures) || 0;
    breakerOpenUntil = Number(openUntil) || 0;
  } catch {
    r.quit().catch(() => {});
  }
}

async function saveBreakerState(): Promise<void> {
  const r = getRedis();
  if (!r) return;
  try {
    const ttl = Math.ceil(BREAKER_RESET_MS / 1000) + 10;
    await Promise.all([
      r.set(`${BREAKER_REDIS_KEY}:failures`, String(consecutiveFailures), 'EX', ttl),
      r.set(`${BREAKER_REDIS_KEY}:openUntil`, String(breakerOpenUntil), 'EX', ttl),
    ]);
    r.quit().catch(() => {});
  } catch {
    r.quit().catch(() => {});
  }
}

export async function getBreakerStatus(): Promise<{
  isOpen: boolean;
  consecutiveFailures: number;
  openUntil: string | null;
}> {
  await loadBreakerState();
  const isOpen = Date.now() < breakerOpenUntil;
  return {
    isOpen,
    consecutiveFailures,
    openUntil: isOpen ? new Date(breakerOpenUntil).toISOString() : null,
  };
}

async function checkBreaker(): Promise<void> {
  await loadBreakerState();
  if (Date.now() < breakerOpenUntil) {
    throw new GoogleApiError(503, 'Circuit-breaker ouvert : Google Places temporairement désactivé.');
  }
}

async function recordSuccess(): Promise<void> {
  consecutiveFailures = 0;
  await saveBreakerState();
}

async function recordFailure(): Promise<void> {
  consecutiveFailures++;
  if (consecutiveFailures >= BREAKER_THRESHOLD) {
    breakerOpenUntil = Date.now() + BREAKER_RESET_MS;
    console.error(`[circuit-breaker] Google Places circuit OPEN after ${consecutiveFailures} failures, retry in ${BREAKER_RESET_MS / 1000}s`);
    import('./alertService').then(({ sendAlert }) =>
      sendAlert(
        'circuit_breaker_open',
        'Circuit-breaker Google Places ouvert',
        `${consecutiveFailures} echecs consecutifs. Google Places desactive pour ${BREAKER_RESET_MS / 1000}s.`,
      ),
    ).catch(() => {});
  }
  await saveBreakerState();
}

function mapPlace(p: RawPlace, type: string): Place {
  return {
    id:          p.id,
    name:        p.displayName?.text ?? 'Sans nom',
    address:     p.formattedAddress  ?? '',
    lat:         p.location?.latitude  ?? 0,
    lng:         p.location?.longitude ?? 0,
    type,
    phone:       p.nationalPhoneNumber ?? null,
    website:     p.websiteUri          ?? null,
    mapsUrl:     p.googleMapsUri ?? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.displayName?.text ?? '')}`,
    rating:      p.rating ?? null,
    ratingCount: p.userRatingCount ?? null,
  };
}

export interface PlaceDetails {
  phone: string | null;
  rating: number | null;
  ratingCount: number | null;
}

export async function fetchPlaceDetails(placeId: string): Promise<PlaceDetails & { apiCalls: number }> {
  await checkBreaker();
  const apiKey = process.env.GOOGLE_PLACES_KEY!;
  checkQuota();
  const res = await fetch(`${DETAIL_URL}/${placeId}`, {
    headers: {
      'X-Goog-Api-Key':   apiKey,
      'X-Goog-FieldMask': DETAIL_FIELD_MASK,
    },
  });
  trackCall('places');
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    await recordFailure();
    throw new GoogleApiError(res.status, body);
  }
  await recordSuccess();
  const data = await res.json() as RawPlace;
  return {
    phone: data.nationalPhoneNumber ?? null,
    rating: data.rating ?? null,
    ratingCount: data.userRatingCount ?? null,
    apiCalls: 1,
  };
}

const RESULTS_CAP = 20;

async function fetchByType(
  center: LatLng,
  radiusMeters: number,
  type: string,
  apiKey: string,
): Promise<{ places: Place[]; apiCalls: number }> {
  await checkBreaker();
  checkQuota();
  const res = await fetch(NEARBY_URL, {
    method: 'POST',
    headers: {
      'Content-Type':     'application/json',
      'X-Goog-Api-Key':   apiKey,
      'X-Goog-FieldMask': FIELD_MASK_SEARCH,
    },
    body: JSON.stringify({
      maxResultCount: 20,
      rankPreference: 'DISTANCE',
      includedTypes: [type],
      locationRestriction: {
        circle: {
          center: { latitude: center.lat, longitude: center.lng },
          radius: radiusMeters,
        },
      },
    }),
  });
  trackCall('places');
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error(`[google-places] HTTP ${res.status} for type="${type}": ${body}`);
    await recordFailure();
    throw new GoogleApiError(res.status, body);
  }
  await recordSuccess();
  const data = await res.json() as { places?: RawPlace[] };
  return { places: (data.places ?? []).map(p => mapPlace(p, type)), apiCalls: 1 };
}

// Nearby Search is capped at 20 per request. To get more results for a specific
// type, we query from 5 sub-centers (original + 4 cardinal offsets). Each center
// returns its own "top 20 closest", giving up to 100 distinct establishments.
function subCenters(center: LatLng, radiusMeters: number): LatLng[] {
  const offset    = radiusMeters * 0.5;
  const latDelta  = offset / 111000;
  const lngDelta  = offset / (111000 * Math.cos(center.lat * Math.PI / 180));
  return [
    center,
    { lat: center.lat + latDelta, lng: center.lng },
    { lat: center.lat - latDelta, lng: center.lng },
    { lat: center.lat, lng: center.lng + lngDelta },
    { lat: center.lat, lng: center.lng - lngDelta },
  ];
}

const NO_WEBSITE_TARGET = 15;

async function fetchByTypeMultiArea(
  center: LatLng,
  radiusMeters: number,
  type: string,
  apiKey: string,
): Promise<{ places: Place[]; apiCalls: number }> {
  const centers = subCenters(center, radiusMeters);
  const seen    = new Set<string>();
  const results: Place[] = [];
  let noWebsiteCount = 0;
  let totalApiCalls = 0;

  for (const c of centers) {
    const result = results.length === 0
      ? await fetchByType(c, radiusMeters, type, apiKey)
      : await fetchByType(c, radiusMeters, type, apiKey).catch(() => ({ places: [] as Place[], apiCalls: 0 }));
    totalApiCalls += result.apiCalls;
    for (const place of result.places) {
      if (!seen.has(place.id)) {
        seen.add(place.id);
        results.push(place);
        if (!place.website) noWebsiteCount++;
      }
    }
    if (noWebsiteCount >= NO_WEBSITE_TARGET) break;
  }

  return { places: results, apiCalls: totalApiCalls };
}

export interface SearchMeta {
  partial: boolean;
  cappedTypes: string[];
  failedTypes: string[];
}

export async function nearbySearch(
  center: LatLng,
  radiusMeters: number,
  types: string[],
): Promise<{ places: Place[]; meta: SearchMeta; apiCalls: number }> {
  const apiKey      = process.env.GOOGLE_PLACES_KEY!;
  const useMulti    = types.length > 0;
  const targetTypes = useMulti ? types : COMMERCIAL_TYPES;

  type FetchResult = { places: Place[]; apiCalls: number };

  const results = await Promise.allSettled(
    targetTypes.map(t =>
      useMulti
        ? fetchByTypeMultiArea(center, radiusMeters, t, apiKey)
        : fetchByType(center, radiusMeters, t, apiKey)
    )
  );

  const fulfilled = results.filter((r): r is PromiseFulfilledResult<FetchResult> => r.status === 'fulfilled');
  const rejected  = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');

  const cappedTypes: string[] = [];
  const failedTypes: string[] = [];

  for (let i = 0; i < results.length; i++) {
    if (results[i].status === 'rejected') {
      failedTypes.push(targetTypes[i]);
      console.error('[google-places] batch failed:', (results[i] as PromiseRejectedResult).reason?.message);
    } else {
      const batch = (results[i] as PromiseFulfilledResult<FetchResult>).value;
      if (batch.places.length >= RESULTS_CAP) {
        cappedTypes.push(targetTypes[i]);
      }
    }
  }

  if (fulfilled.length === 0 && rejected.length > 0) {
    const first = rejected[0].reason;
    throw first instanceof Error ? first : new Error(String(first));
  }

  const seen   = new Set<string>();
  const merged: Place[] = [];
  let totalApiCalls = 0;
  for (const batch of fulfilled) {
    totalApiCalls += batch.value.apiCalls;
    for (const place of batch.value.places) {
      if (!seen.has(place.id)) { seen.add(place.id); merged.push(place); }
    }
  }

  return {
    places: merged,
    apiCalls: totalApiCalls,
    meta: {
      partial: cappedTypes.length > 0 || failedTypes.length > 0,
      cappedTypes,
      failedTypes,
    },
  };
}
