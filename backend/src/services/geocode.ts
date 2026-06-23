import { checkQuota, trackCall } from './googleQuota';

const GEOCODE_URL = 'https://maps.googleapis.com/maps/api/geocode/json';

export interface LatLng {
  lat: number;
  lng: number;
}

export async function geocodeAddress(address: string): Promise<LatLng> {
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
    console.error(`[geocode] ${data.status}: ${data.error_message ?? 'no results'} (address="${address}")`);
    const isUserError = data.status === 'ZERO_RESULTS' || data.status === 'INVALID_REQUEST';
    throw new Error(isUserError ? 'Adresse introuvable.' : 'Le service de géocodage est temporairement indisponible.');
  }

  return data.results[0].geometry.location;
}
