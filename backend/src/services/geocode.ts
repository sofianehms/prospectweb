import { checkQuota, trackCall } from './googleQuota';

const GEOCODE_URL = 'https://maps.googleapis.com/maps/api/geocode/json';
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = 'ProspectWeb/1.0 (contact: sofiane.hoummass@icloud.com)';

export interface LatLng {
  lat: number;
  lng: number;
}

async function geocodeGoogle(address: string): Promise<LatLng> {
  checkQuota();
  const apiKey = process.env.GOOGLE_PLACES_KEY;
  const url = `${GEOCODE_URL}?address=${encodeURIComponent(address)}&key=${apiKey}&language=fr`;

  const res = await fetch(url);
  trackCall('geocoding');
  const data = await res.json() as {
    status: string;
    results: { geometry: { location: LatLng } }[];
    error_message?: string;
  };

  if (data.status !== 'OK' || !data.results.length) {
    console.error(`[geocode-google] ${data.status}: ${data.error_message ?? 'no results'} (address="${address}")`);
    const isUserError = data.status === 'ZERO_RESULTS' || data.status === 'INVALID_REQUEST';
    throw new Error(isUserError ? 'Adresse introuvable.' : 'GOOGLE_GEOCODE_FAIL');
  }

  return data.results[0].geometry.location;
}

async function geocodeNominatim(address: string): Promise<LatLng> {
  const url = `${NOMINATIM_URL}?format=json&q=${encodeURIComponent(address)}&limit=1`;
  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, 'Accept-Language': 'fr' },
  });

  if (!res.ok) throw new Error('Nominatim indisponible.');

  const data = await res.json() as Array<{ lat: string; lon: string }>;
  if (!data.length) throw new Error('Adresse introuvable.');

  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
}

export async function geocodeAddress(address: string): Promise<LatLng> {
  try {
    return await geocodeGoogle(address);
  } catch (err) {
    const msg = (err as Error).message;
    if (msg === 'Adresse introuvable.') throw err;

    console.warn(`[geocode] Google failed, falling back to Nominatim: ${msg}`);
    try {
      return await geocodeNominatim(address);
    } catch {
      throw new Error('Le service de géocodage est temporairement indisponible.');
    }
  }
}
