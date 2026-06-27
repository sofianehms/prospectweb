import type { LatLng } from './geocode';
import type { Place, SearchMeta } from './places';
import type { PlacesSearchResult, PlaceDetailResult, PlacesProvider } from './placesProvider';

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

const TYPE_TO_OSM: Record<string, string> = {
  restaurant:         '"amenity"="restaurant"',
  cafe:               '"amenity"="cafe"',
  bar:                '"amenity"="bar"',
  bakery:             '"shop"="bakery"',
  hotel:              '"tourism"="hotel"',
  hair_salon:         '"shop"="hairdresser"',
  beauty_salon:       '"shop"="beauty"',
  clothing_store:     '"shop"="clothes"',
  pharmacy:           '"amenity"="pharmacy"',
  florist:            '"shop"="florist"',
  car_repair:         '"shop"="car_repair"',
  gym:                '"leisure"="fitness_centre"',
  supermarket:        '"shop"="supermarket"',
  dentist:            '"amenity"="dentist"',
  doctor:             '"amenity"="doctors"',
  real_estate_agency: '"office"="estate_agent"',
};

function buildQuery(center: LatLng, radiusMeters: number, types: string[]): string {
  const osmFilters = types
    .map(t => TYPE_TO_OSM[t])
    .filter(Boolean);

  if (osmFilters.length === 0) {
    const allFilters = Object.values(TYPE_TO_OSM);
    osmFilters.push(...allFilters);
  }

  const nodes = osmFilters
    .map(f => `node[${f}](around:${radiusMeters},${center.lat},${center.lng});`)
    .join('\n  ');

  return `[out:json][timeout:10];(\n  ${nodes}\n);out body 60;`;
}

interface OsmElement {
  id: number;
  lat: number;
  lon: number;
  tags?: Record<string, string>;
}

function mapOsmPlace(el: OsmElement, type: string): Place {
  const tags = el.tags ?? {};
  return {
    id:          `osm:${el.id}`,
    name:        tags.name ?? 'Sans nom',
    address:     [tags['addr:street'], tags['addr:housenumber'], tags['addr:postcode'], tags['addr:city']].filter(Boolean).join(' ') || '',
    lat:         el.lat,
    lng:         el.lon,
    type,
    phone:       tags.phone ?? tags['contact:phone'] ?? null,
    website:     tags.website ?? tags['contact:website'] ?? null,
    mapsUrl:     `https://www.openstreetmap.org/node/${el.id}`,
    rating:      null,
    ratingCount: null,
  };
}

export class OverpassProvider implements PlacesProvider {
  async search(center: LatLng, radiusMeters: number, types: string[]): Promise<PlacesSearchResult> {
    const query = buildQuery(center, radiusMeters, types);

    const res = await fetch(OVERPASS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
      signal: AbortSignal.timeout(12000),
    });

    if (!res.ok) {
      console.error(`[overpass] HTTP ${res.status}`);
      return { places: [], meta: { partial: true, cappedTypes: [], failedTypes: types }, apiCalls: 0, provider: 'overpass' };
    }

    const data = await res.json() as { elements?: OsmElement[] };
    const elements = data.elements ?? [];

    const seen = new Set<number>();
    const places: Place[] = [];

    for (const el of elements) {
      if (seen.has(el.id) || !el.tags?.name) continue;
      seen.add(el.id);
      const osmType = matchType(el.tags, types);
      places.push(mapOsmPlace(el, osmType));
    }

    return {
      places,
      meta: { partial: true, cappedTypes: [], failedTypes: [] },
      apiCalls: 0,
      provider: 'overpass',
    };
  }

  async getDetails(_placeId: string): Promise<PlaceDetailResult> {
    return { phone: null, rating: null, ratingCount: null, apiCalls: 0, provider: 'overpass' };
  }

  async getPlace(placeId: string): Promise<Place & { apiCalls: number; provider: string }> {
    const numId = placeId.replace('osm:', '');
    const query = `[out:json][timeout:5];node(${numId});out body;`;

    try {
      const res = await fetch(OVERPASS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(query)}`,
        signal: AbortSignal.timeout(8000),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as { elements?: OsmElement[] };
      const el = data.elements?.[0];
      if (!el) throw new Error('Not found');

      return { ...mapOsmPlace(el, 'establishment'), apiCalls: 0, provider: 'overpass' };
    } catch {
      throw new Error('Établissement OSM introuvable.');
    }
  }
}

function matchType(tags: Record<string, string>, requestedTypes: string[]): string {
  for (const t of requestedTypes) {
    const filter = TYPE_TO_OSM[t];
    if (!filter) continue;
    const [key, val] = filter.replace(/"/g, '').split('=');
    if (tags[key] === val) return t;
  }
  return tags.amenity ?? tags.shop ?? tags.leisure ?? tags.tourism ?? tags.office ?? 'establishment';
}

export const overpassProvider = new OverpassProvider();
