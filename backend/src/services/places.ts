import type { LatLng } from './geocode';

const NEARBY_URL = 'https://places.googleapis.com/v1/places:searchNearby';

const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.location',
  'places.websiteUri',
  'places.nationalPhoneNumber',
  'places.types',
  'places.googleMapsUri',
  'places.rating',
  'places.userRatingCount',
].join(',');

// Types de commerces pertinents pour la prospection web.
// Chaque type génère une requête indépendante (max 20 résultats chacune).
const COMMERCIAL_TYPES = [
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
    rating:      p.rating          ?? null,
    ratingCount: p.userRatingCount ?? null,
  };
}

async function fetchByType(
  center: LatLng,
  radiusMeters: number,
  type: string,
  apiKey: string,
): Promise<Place[]> {
  try {
    const res = await fetch(NEARBY_URL, {
      method: 'POST',
      headers: {
        'Content-Type':     'application/json',
        'X-Goog-Api-Key':   apiKey,
        'X-Goog-FieldMask': FIELD_MASK,
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
    if (!res.ok) return [];
    const data = await res.json() as { places?: RawPlace[] };
    return (data.places ?? []).map(p => mapPlace(p, type));
  } catch {
    return [];
  }
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
): Promise<Place[]> {
  const centers = subCenters(center, radiusMeters);
  const seen    = new Set<string>();
  const results: Place[] = [];
  let noWebsiteCount = 0;

  for (const c of centers) {
    const batch = await fetchByType(c, radiusMeters, type, apiKey);
    for (const place of batch) {
      if (!seen.has(place.id)) {
        seen.add(place.id);
        results.push(place);
        if (!place.website) noWebsiteCount++;
      }
    }
    if (noWebsiteCount >= NO_WEBSITE_TARGET) break;
  }

  return results;
}

export async function nearbySearch(
  center: LatLng,
  radiusMeters: number,
  types: string[], // vide = tous les COMMERCIAL_TYPES (zone unique) ; sinon multi-zones
): Promise<Place[]> {
  const apiKey      = process.env.GOOGLE_PLACES_KEY!;
  const useMulti    = types.length > 0;
  const targetTypes = useMulti ? types : COMMERCIAL_TYPES;

  const batches = await Promise.all(
    targetTypes.map(t =>
      useMulti
        ? fetchByTypeMultiArea(center, radiusMeters, t, apiKey)
        : fetchByType(center, radiusMeters, t, apiKey)
    )
  );

  const seen   = new Set<string>();
  const merged: Place[] = [];
  for (const batch of batches) {
    for (const place of batch) {
      if (!seen.has(place.id)) { seen.add(place.id); merged.push(place); }
    }
  }
  return merged;
}
