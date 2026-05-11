const GEOCODE_URL = 'https://maps.googleapis.com/maps/api/geocode/json';

export interface LatLng {
  lat: number;
  lng: number;
}

export async function geocodeAddress(address: string): Promise<LatLng> {
  const apiKey = process.env.GOOGLE_PLACES_KEY;
  const url = `${GEOCODE_URL}?address=${encodeURIComponent(address)}&key=${apiKey}&language=fr`;

  const res = await fetch(url);
  const data = await res.json() as {
    status: string;
    results: { geometry: { location: LatLng } }[];
    error_message?: string;
  };

  if (data.status !== 'OK' || !data.results.length) {
    throw new Error(`Géocodage échoué : ${data.status} — ${data.error_message ?? 'adresse introuvable'}`);
  }

  return data.results[0].geometry.location;
}
