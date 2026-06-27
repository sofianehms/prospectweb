import { getPool } from './db';

export type CrmStatus = 'to_contact' | 'contacted' | 'discussing' | 'won' | 'lost';

const CACHE_MAX_DAYS = 30;

export interface Prospect {
  id: string;
  userId: string;
  name: string;
  address: string;
  type: string;
  phone: string | null;
  mapsUrl: string;
  rating: number | null;
  ratingCount: number | null;
  websiteStatus: string;
  crmStatus: CrmStatus;
  notes: string;
  addedAt: string;
  cachedAt: string;
  stale: boolean;
  followUpAt: string | null;
}

interface ProspectRow {
  id: string;
  user_id: string;
  name: string;
  address: string;
  type: string;
  phone: string | null;
  maps_url: string;
  rating: number | null;
  rating_count: number | null;
  website_status: string;
  crm_status: CrmStatus;
  notes: string;
  added_at: string;
  cached_at: string;
  follow_up_at: string | null;
}

function rowToProspect(r: ProspectRow): Prospect {
  const cachedAt = new Date(r.cached_at);
  const ageDays = (Date.now() - cachedAt.getTime()) / 86_400_000;
  return {
    id: r.id,
    userId: r.user_id,
    name: r.name,
    address: r.address,
    type: r.type,
    phone: r.phone,
    mapsUrl: r.maps_url,
    rating: r.rating,
    ratingCount: r.rating_count,
    websiteStatus: r.website_status,
    crmStatus: r.crm_status,
    notes: r.notes,
    addedAt: r.added_at,
    cachedAt: r.cached_at,
    stale: ageDays > CACHE_MAX_DAYS,
    followUpAt: r.follow_up_at,
  };
}

export async function listProspects(userId: string): Promise<Prospect[]> {
  const { rows } = await getPool().query<ProspectRow>(
    'SELECT * FROM prospects WHERE user_id = $1 ORDER BY added_at DESC',
    [userId],
  );
  return rows.map(rowToProspect);
}

export async function addProspect(
  userId: string,
  data: Omit<Prospect, 'userId' | 'crmStatus' | 'notes' | 'addedAt' | 'cachedAt' | 'stale' | 'followUpAt'>,
): Promise<Prospect> {
  const { rows } = await getPool().query<ProspectRow>(
    `INSERT INTO prospects (id, user_id, name, address, type, phone, maps_url, rating, rating_count, website_status, cached_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
     ON CONFLICT (id, user_id) DO UPDATE SET
       name = EXCLUDED.name, address = EXCLUDED.address, type = EXCLUDED.type,
       phone = EXCLUDED.phone, maps_url = EXCLUDED.maps_url, rating = EXCLUDED.rating,
       rating_count = EXCLUDED.rating_count, website_status = EXCLUDED.website_status,
       cached_at = NOW()
     RETURNING *`,
    [data.id, userId, data.name, data.address, data.type, data.phone, data.mapsUrl, data.rating, data.ratingCount, data.websiteStatus],
  );
  return rowToProspect(rows[0]);
}

export async function refreshProspect(
  userId: string,
  prospectId: string,
  data: { name: string; address: string; phone: string | null; rating: number | null; ratingCount: number | null },
): Promise<Prospect | null> {
  const { rows } = await getPool().query<ProspectRow>(
    `UPDATE prospects SET name = $1, address = $2, phone = $3, rating = $4, rating_count = $5, cached_at = NOW()
     WHERE id = $6 AND user_id = $7 RETURNING *`,
    [data.name, data.address, data.phone, data.rating, data.ratingCount, prospectId, userId],
  );
  return rows.length ? rowToProspect(rows[0]) : null;
}

export async function removeProspect(userId: string, prospectId: string): Promise<boolean> {
  const { rowCount } = await getPool().query(
    'DELETE FROM prospects WHERE id = $1 AND user_id = $2',
    [prospectId, userId],
  );
  return (rowCount ?? 0) > 0;
}

export async function updateCrmStatus(userId: string, prospectId: string, status: CrmStatus): Promise<Prospect | null> {
  const { rows } = await getPool().query<ProspectRow>(
    'UPDATE prospects SET crm_status = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
    [status, prospectId, userId],
  );
  return rows.length ? rowToProspect(rows[0]) : null;
}

export async function updateNotes(userId: string, prospectId: string, notes: string): Promise<Prospect | null> {
  const { rows } = await getPool().query<ProspectRow>(
    'UPDATE prospects SET notes = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
    [notes, prospectId, userId],
  );
  return rows.length ? rowToProspect(rows[0]) : null;
}

export async function updateFollowUp(userId: string, prospectId: string, followUpAt: string | null): Promise<Prospect | null> {
  const { rows } = await getPool().query<ProspectRow>(
    'UPDATE prospects SET follow_up_at = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
    [followUpAt, prospectId, userId],
  );
  return rows.length ? rowToProspect(rows[0]) : null;
}

export async function purgeStaleGoogleData(): Promise<number> {
  const { rowCount } = await getPool().query(
    `UPDATE prospects SET name = '[Données expirées]', address = '', phone = NULL, rating = NULL, rating_count = NULL
     WHERE cached_at < NOW() - INTERVAL '${CACHE_MAX_DAYS} days' AND name != '[Données expirées]'`,
  );
  return rowCount ?? 0;
}

export async function optOutProspect(placeId: string): Promise<number> {
  const { rowCount } = await getPool().query(
    `DELETE FROM prospects WHERE id = $1`,
    [placeId],
  );
  return rowCount ?? 0;
}
