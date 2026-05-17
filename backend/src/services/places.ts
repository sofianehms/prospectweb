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

// Requête paginée pour un seul type.
// Types avec peu de résultats s'arrêtent tôt ; types abondants (restaurants…)
// vont jusqu'à MAX_PAGES × 20 résultats — compense les "slots" inutilisés.
const MAX_PAGES = 3; // max 60 résultats par type

async function fetchByType(
  center: LatLng,
  radiusMeters: number,
  type: string,
  apiKey: string,
): Promise<Place[]> {
  const results: Place[] = [];
  let pageToken: string | undefined;
  let page = 0;

  do {
    try {
      const body: Record<string, unknown> = pageToken
        ? { pageToken }
        : {
            maxResultCount: 20,
            includedTypes: [type],
            locationRestriction: {
              circle: {
                center: { latitude: center.lat, longitude: center.lng },
                radius: radiusMeters,
              },
            },
          };

      const res = await fetch(NEARBY_URL, {
        method: 'POST',
        headers: {
          'Content-Type':     'application/json',
          'X-Goog-Api-Key':   apiKey,
          'X-Goog-FieldMask': FIELD_MASK,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) break;

      const data = await res.json() as { places?: RawPlace[]; nextPageToken?: string };
      results.push(...(data.places ?? []).map(p => mapPlace(p, type)));
      pageToken = data.nextPageToken;
      page++;
    } catch {
      break;
    }
  } while (pageToken && page < MAX_PAGES);

  return results;
}

export async function nearbySearch(
  center: LatLng,
  radiusMeters: number,
  type: string | null,
): Promise<Place[]> {
  const apiKey = process.env.GOOGLE_PLACES_KEY!;

  // Type spécifique : une seule requête
  if (type) {
    const places = await fetchByType(center, radiusMeters, type, apiKey);
    if (!places.length) {
      // Remonte l'erreur uniquement si aucun résultat et type explicite
      const res = await fetch(NEARBY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': apiKey, 'X-Goog-FieldMask': FIELD_MASK },
        body: JSON.stringify({ maxResultCount: 1, includedTypes: [type], locationRestriction: { circle: { center: { latitude: center.lat, longitude: center.lng }, radius: radiusMeters } } }),
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Google Places API error ${res.status}: ${err}`);
      }
    }
    return places;
  }

  // Tous les types : requêtes parallèles + dédoublonnage par id
  const batches = await Promise.all(
    COMMERCIAL_TYPES.map(t => fetchByType(center, radiusMeters, t, apiKey))
  );

  const seen = new Set<string>();
  const merged: Place[] = [];

  for (const batch of batches) {
    for (const place of batch) {
      if (!seen.has(place.id)) {
        seen.add(place.id);
        merged.push(place);
      }
    }
  }

  return merged;
}
