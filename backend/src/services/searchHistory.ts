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

export interface SearchRecordWithResults extends SearchRecord {
  results: unknown | null;
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
  results?: unknown;
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

function rowToRecordWithResults(r: SearchRow): SearchRecordWithResults {
  return {
    ...rowToRecord(r),
    results: r.results ?? null,
  };
}

export async function recordSearch(
  userId: string,
  data: { address: string; lat: number; lng: number; radius: number; types: string; resultCount: number; results?: unknown },
): Promise<SearchRecord> {
  const { rows } = await getPool().query<SearchRow>(
    `INSERT INTO search_history (user_id, address, lat, lng, radius, types, result_count, results)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [userId, data.address, data.lat, data.lng, data.radius, data.types, data.resultCount, data.results ? JSON.stringify(data.results) : null],
  );
  return rowToRecord(rows[0]);
}

export async function countUserSearches(userId: string): Promise<number> {
  const { rows } = await getPool().query<{ count: string }>(
    'SELECT COUNT(*)::int AS count FROM search_history WHERE user_id = $1',
    [userId],
  );
  return Number(rows[0]?.count ?? 0);
}

export async function listSearchHistory(userId: string, limit = 20): Promise<SearchRecord[]> {
  const { rows } = await getPool().query<SearchRow>(
    'SELECT id, user_id, address, lat, lng, radius, types, result_count, created_at FROM search_history WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
    [userId, limit],
  );
  return rows.map(rowToRecord);
}

export async function getSearchById(userId: string, id: string): Promise<SearchRecordWithResults | null> {
  const { rows } = await getPool().query<SearchRow>(
    'SELECT * FROM search_history WHERE id = $1 AND user_id = $2',
    [id, userId],
  );
  if (rows.length === 0) return null;
  return rowToRecordWithResults(rows[0]);
}

export async function deleteSearchRecords(userId: string, ids: string[]): Promise<number> {
  if (ids.length === 0) return 0;
  const placeholders = ids.map((_, i) => `$${i + 2}`).join(', ');
  const { rowCount } = await getPool().query(
    `DELETE FROM search_history WHERE user_id = $1 AND id IN (${placeholders})`,
    [userId, ...ids],
  );
  return rowCount ?? 0;
}

export async function getKnownPlaceIds(userId: string): Promise<Set<string>> {
  const { rows } = await getPool().query<{ id: string }>(
    'SELECT id FROM prospects WHERE user_id = $1',
    [userId],
  );
  return new Set(rows.map(r => r.id));
}
