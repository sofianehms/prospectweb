import Redis from 'ioredis';

const DEFAULT_DAILY_LIMIT = 500;

interface DailyCounter {
  date: string;
  places: number;
  geocoding: number;
}

let counter: DailyCounter = { date: todayKey(), places: 0, geocoding: 0 };
let usingFallback = false;

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function ensureToday(): void {
  const today = todayKey();
  if (counter.date !== today) {
    counter = { date: today, places: 0, geocoding: 0 };
  }
}

function getRedis(): Redis | null {
  const url = process.env.REDIS_URL;
  if (!url) return null;
  try {
    return new Redis(url, { maxRetriesPerRequest: 1, lazyConnect: false });
  } catch { return null; }
}

function redisKey(service: GoogleService): string {
  return `gquota:${todayKey()}:${service}`;
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

export async function getUsageFromStore(): Promise<{ date: string; places: number; geocoding: number; total: number; limit: number }> {
  const r = getRedis();
  if (r) {
    try {
      const [places, geocoding] = await Promise.all([
        r.get(redisKey('places')),
        r.get(redisKey('geocoding')),
      ]);
      r.quit().catch(() => {});
      const p = Number(places) || 0;
      const g = Number(geocoding) || 0;
      return { date: todayKey(), places: p, geocoding: g, total: p + g, limit: getQuotaLimit() };
    } catch {
      r.quit().catch(() => {});
    }
  }
  return getUsage();
}

export class QuotaExceededError extends Error {
  constructor(usage: number, limit: number) {
    super(`Quota journalier Google dépassé (${usage}/${limit}). Réessayez demain.`);
    this.name = 'QuotaExceededError';
  }
}

export async function trackCallAtomic(service: GoogleService, count: number = 1): Promise<number> {
  const r = getRedis();
  if (r) {
    try {
      const key = redisKey(service);
      const newVal = await r.incrby(key, count);
      const ttl = await r.ttl(key);
      if (ttl < 0) {
        const midnight = new Date();
        midnight.setUTCHours(24, 0, 0, 0);
        const secondsLeft = Math.ceil((midnight.getTime() - Date.now()) / 1000);
        await r.expire(key, secondsLeft);
      }
      r.quit().catch(() => {});
      ensureToday();
      counter[service] = newVal;
      usingFallback = false;
      return newVal;
    } catch (err) {
      r.quit().catch(() => {});
      if (!usingFallback) {
        console.warn('[google-quota] Redis unavailable, falling back to in-memory counter');
        usingFallback = true;
      }
    }
  }
  trackCall(service, count);
  return counter[service];
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

export async function checkQuotaAtomic(needed: number = 1): Promise<void> {
  const r = getRedis();
  if (r) {
    try {
      const [places, geocoding] = await Promise.all([
        r.get(redisKey('places')),
        r.get(redisKey('geocoding')),
      ]);
      r.quit().catch(() => {});
      const total = (Number(places) || 0) + (Number(geocoding) || 0);
      const limit = getQuotaLimit();
      if (total + needed > limit) {
        throw new QuotaExceededError(total, limit);
      }
      return;
    } catch (err) {
      r.quit().catch(() => {});
      if (err instanceof QuotaExceededError) throw err;
    }
  }
  checkQuota(needed);
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
  usingFallback = false;
}
