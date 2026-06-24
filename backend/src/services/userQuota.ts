const DEFAULT_USER_DAILY_LIMIT = 100;

interface UserDailyCounter {
  date: string;
  calls: number;
}

const memCounters = new Map<string, UserDailyCounter>();

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function ensureTodayMem(userId: string): UserDailyCounter {
  const today = todayKey();
  let entry = memCounters.get(userId);
  if (!entry || entry.date !== today) {
    entry = { date: today, calls: 0 };
    memCounters.set(userId, entry);
  }
  return entry;
}

function getDb() {
  try {
    if (!process.env.DATABASE_URL) return null;
    const { getPool } = require('./db') as typeof import('./db');
    return getPool();
  } catch { return null; }
}

export function getUserDailyLimit(): number {
  return Number(process.env.USER_DAILY_LIMIT) || DEFAULT_USER_DAILY_LIMIT;
}

export class UserQuotaExceededError extends Error {
  constructor(usage: number, limit: number) {
    super(`Quota utilisateur dépassé (${usage}/${limit} appels aujourd'hui). Réessayez demain.`);
    this.name = 'UserQuotaExceededError';
  }
}

export function checkUserQuota(userId: string, needed: number = 1): void {
  const entry = ensureTodayMem(userId);
  const limit = getUserDailyLimit();
  if (entry.calls + needed > limit) {
    throw new UserQuotaExceededError(entry.calls, limit);
  }
}

export function trackUserCalls(userId: string, count: number = 1): void {
  const entry = ensureTodayMem(userId);
  entry.calls += count;

  const limit = getUserDailyLimit();
  console.log(
    `[user-quota] user=${userId} +${count} | today=${entry.date} calls=${entry.calls}/${limit}`,
  );

  if (entry.calls >= limit * 0.8 && entry.calls - count < limit * 0.8) {
    console.warn(`[user-quota] WARNING: user=${userId} a atteint 80% de son quota (${entry.calls}/${limit})`);
  }

  const db = getDb();
  if (db) {
    db.query(
      `INSERT INTO user_usage (user_id, date, calls) VALUES ($1, CURRENT_DATE, $2)
       ON CONFLICT (user_id, date) DO UPDATE SET calls = user_usage.calls + $2`,
      [userId, count],
    ).catch((err: Error) => console.error('[user-quota] DB write failed:', err.message));
  }
}

export function getUserUsage(userId: string): { date: string; calls: number; limit: number; remaining: number } {
  const entry = ensureTodayMem(userId);
  const limit = getUserDailyLimit();
  return {
    date: entry.date,
    calls: entry.calls,
    limit,
    remaining: Math.max(0, limit - entry.calls),
  };
}

export function getAllUsersUsage(): Array<{ userId: string; date: string; calls: number }> {
  const today = todayKey();
  const result: Array<{ userId: string; date: string; calls: number }> = [];
  for (const [userId, entry] of memCounters) {
    if (entry.date === today) {
      result.push({ userId, date: entry.date, calls: entry.calls });
    }
  }
  return result;
}

export async function loadFromDb(userId: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  try {
    const { rows } = await db.query<{ calls: number }>(
      'SELECT calls FROM user_usage WHERE user_id = $1 AND date = CURRENT_DATE',
      [userId],
    );
    if (rows.length) {
      memCounters.set(userId, { date: todayKey(), calls: rows[0].calls });
    }
  } catch { /* fallback to in-memory */ }
}

export function resetForTesting(): void {
  memCounters.clear();
}
