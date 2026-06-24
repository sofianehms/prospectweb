import { getPool } from './db';

export interface SearchRecord {
  id: string;
  userId: string;
  address: string;
  lat: number;
  lng: number;
  radius: number;
  types: string;
  resultCount: number;
  createdAt: string;
}

interface SearchRow {
  id: string;
  user_id: string;
  address: string;
  lat: number;
  lng: number;
  radius: number;
  types: string;
  result_count: number;
  created_at: string;
}

function rowToRecord(r: SearchRow): SearchRecord {
  return {
    id: r.id,
    userId: r.user_id,
    address: r.address,
    lat: r.lat,
    lng: r.lng,
    radius: r.radius,
    types: r.types,
    resultCount: r.result_count,
    createdAt: r.created_at,
  };
}

export async function recordSearch(
  userId: string,
  data: { address: string; lat: number; lng: number; radius: number; types: string; resultCount: number },
): Promise<SearchRecord> {
  const { rows } = await getPool().query<SearchRow>(
    `INSERT INTO search_history (user_id, address, lat, lng, radius, types, result_count)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [userId, data.address, data.lat, data.lng, data.radius, data.types, data.resultCount],
  );
  return rowToRecord(rows[0]);
}

export async function listSearchHistory(userId: string, limit = 20): Promise<SearchRecord[]> {
  const { rows } = await getPool().query<SearchRow>(
    'SELECT * FROM search_history WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
    [userId, limit],
  );
  return rows.map(rowToRecord);
}

export async function getKnownPlaceIds(userId: string): Promise<Set<string>> {
  const { rows } = await getPool().query<{ id: string }>(
    'SELECT id FROM prospects WHERE user_id = $1',
    [userId],
  );
  return new Set(rows.map(r => r.id));
}
