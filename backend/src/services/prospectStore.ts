import { getPool } from './db';

export type CrmStatus = 'to_contact' | 'contacted' | 'discussing' | 'won' | 'lost';

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
}

function rowToProspect(r: ProspectRow): Prospect {
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
  data: Omit<Prospect, 'userId' | 'crmStatus' | 'notes' | 'addedAt'>,
): Promise<Prospect> {
  const { rows } = await getPool().query<ProspectRow>(
    `INSERT INTO prospects (id, user_id, name, address, type, phone, maps_url, rating, rating_count, website_status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     ON CONFLICT (id, user_id) DO NOTHING
     RETURNING *`,
    [data.id, userId, data.name, data.address, data.type, data.phone, data.mapsUrl, data.rating, data.ratingCount, data.websiteStatus],
  );
  if (!rows.length) {
    const existing = await getPool().query<ProspectRow>(
      'SELECT * FROM prospects WHERE id = $1 AND user_id = $2',
      [data.id, userId],
    );
    return rowToProspect(existing.rows[0]);
  }
  return rowToProspect(rows[0]);
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
