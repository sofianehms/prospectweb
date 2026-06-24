const DEFAULT_DAILY_LIMIT = 500;

interface DailyCounter {
  date: string;
  places: number;
  geocoding: number;
}

let counter: DailyCounter = { date: todayKey(), places: 0, geocoding: 0 };

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function ensureToday(): void {
  const today = todayKey();
  if (counter.date !== today) {
    counter = { date: today, places: 0, geocoding: 0 };
  }
}

function getDb() {
  try {
    if (!process.env.DATABASE_URL) return null;
    const { getPool } = require('./db') as typeof import('./db');
    return getPool();
  } catch { return null; }
}

export type GoogleService = 'places' | 'geocoding';

export function getQuotaLimit(): number {
  return Number(process.env.GOOGLE_DAILY_LIMIT) || DEFAULT_DAILY_LIMIT;
}

export function getUsage(): { date: string; places: number; geocoding: number; total: number; limit: number } {
  ensureToday();
  return {
    ...counter,
    total: counter.places + counter.geocoding,
    limit: getQuotaLimit(),
  };
}

export class QuotaExceededError extends Error {
  constructor(usage: number, limit: number) {
    super(`Quota journalier Google dépassé (${usage}/${limit}). Réessayez demain.`);
    this.name = 'QuotaExceededError';
  }
}

export function trackCall(service: GoogleService, count: number = 1): void {
  ensureToday();
  counter[service] += count;

  const total = counter.places + counter.geocoding;
  const limit = getQuotaLimit();

  console.log(
    `[google-quota] ${service} +${count} | today=${counter.date} places=${counter.places} geocoding=${counter.geocoding} total=${total}/${limit}`,
  );

  if (total >= limit * 0.8 && total - count < limit * 0.8) {
    console.warn(`[google-quota] WARNING: 80% du quota journalier atteint (${total}/${limit})`);
  }

  const db = getDb();
  if (db) {
    const col = service === 'places' ? 'places' : 'geocoding';
    db.query(
      `INSERT INTO google_usage (date, ${col}) VALUES (CURRENT_DATE, $1)
       ON CONFLICT (date) DO UPDATE SET ${col} = google_usage.${col} + $1`,
      [count],
    ).catch((err: Error) => console.error('[google-quota] DB write failed:', err.message));
  }
}

export function checkQuota(needed: number = 1): void {
  ensureToday();
  const total = counter.places + counter.geocoding;
  const limit = getQuotaLimit();

  if (total + needed > limit) {
    throw new QuotaExceededError(total, limit);
  }
}

export async function loadFromDb(): Promise<void> {
  const db = getDb();
  if (!db) return;
  try {
    const { rows } = await db.query<{ places: number; geocoding: number }>(
      'SELECT places, geocoding FROM google_usage WHERE date = CURRENT_DATE',
    );
    if (rows.length) {
      counter = { date: todayKey(), places: rows[0].places, geocoding: rows[0].geocoding };
    }
  } catch { /* fallback to in-memory */ }
}

export function resetForTesting(): void {
  counter = { date: todayKey(), places: 0, geocoding: 0 };
}
