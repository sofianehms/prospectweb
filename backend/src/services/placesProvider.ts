import type { LatLng } from './geocode';
import type { Place, SearchMeta } from './places';

export interface PlacesSearchResult {
  places: Place[];
  meta: SearchMeta;
  apiCalls: number;
  provider: 'google' | 'overpass';
}

export interface PlaceDetailResult {
  phone: string | null;
  rating: number | null;
  ratingCount: number | null;
  apiCalls: number;
  provider: 'google' | 'overpass';
}

export interface PlacesProvider {
  search(center: LatLng, radiusMeters: number, types: string[]): Promise<PlacesSearchResult>;
  getDetails(placeId: string): Promise<PlaceDetailResult>;
  getPlace(placeId: string): Promise<Place & { apiCalls: number; provider: string }>;
}
