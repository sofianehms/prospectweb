import { getCached, setCached, cacheKey } from './cache';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = 'ProspectWeb/1.0 (contact: sofiane.hoummass@icloud.com)';
const MIN_INTERVAL_MS = 1100;

let lastCallAt = 0;

async function throttle(): Promise<void> {
  const now = Date.now();
  const wait = MIN_INTERVAL_MS - (now - lastCallAt);
  if (wait > 0) {
    await new Promise(resolve => setTimeout(resolve, wait));
  }
  lastCallAt = Date.now();
}

export interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}

export async function searchNominatim(query: string, limit = 6): Promise<NominatimResult[]> {
  const key = cacheKey({ provider: 'nominatim', q: query, limit });
  const cached = getCached<NominatimResult[]>(key);
  if (cached) return cached;

  await throttle();

  const url = `${NOMINATIM_URL}?format=json&q=${encodeURIComponent(query)}&limit=${limit}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      'Accept-Language': 'fr',
    },
  });

  if (!res.ok) {
    console.error(`[nominatim] ${res.status} ${res.statusText}`);
    throw new Error('Le service d\'autocomplétion est temporairement indisponible.');
  }

  const data: NominatimResult[] = await res.json();
  setCached(key, data);
  return data;
}
