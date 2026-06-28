import Redis from 'ioredis';

const DEFAULT_USER_DAILY_LIMIT = 100;

interface UserDailyCounter {
  date: string;
  calls: number;
}

const memCounters = new Map<string, UserDailyCounter>();
let usingFallback = false;

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

function getRedis(): Redis | null {
  const url = process.env.REDIS_URL;
  if (!url) return null;
  try {
    return new Redis(url, { maxRetriesPerRequest: 1, lazyConnect: false });
  } catch { return null; }
}

function redisKey(userId: string): string {
  return `uquota:${todayKey()}:${userId}`;
}

function getDb() {
  try {
    if (!process.env.DATABASE_URL) return null;
    const { getPool } = require('./db') as typeof import('./db');
    return getPool();
  } catch { return null; }
}

const userLimitOverrides = new Map<string, number>();

export function setUserLimitOverride(userId: string, limit: number): void {
  userLimitOverrides.set(userId, limit);
}

export function getUserDailyLimit(userId?: string): number {
  if (userId && userLimitOverrides.has(userId)) return userLimitOverrides.get(userId)!;
  return Number(process.env.USER_DAILY_LIMIT) || DEFAULT_USER_DAILY_LIMIT;
}

export async function syncLimitFromPlan(userId: string): Promise<number> {
  try {
    const { getUserPlan } = await import('./planStore');
    const plan = await getUserPlan(userId);
    setUserLimitOverride(userId, plan.dailyLimit);
    return plan.dailyLimit;
  } catch {
    return getUserDailyLimit(userId);
  }
}

export class UserQuotaExceededError extends Error {
  constructor(usage: number, limit: number) {
    super(`Quota utilisateur dépassé (${usage}/${limit} appels aujourd'hui). Réessayez demain.`);
    this.name = 'UserQuotaExceededError';
  }
}

export function checkUserQuota(userId: string, needed: number = 1): void {
  const entry = ensureTodayMem(userId);
  const limit = getUserDailyLimit(userId);
  if (entry.calls + needed > limit) {
    throw new UserQuotaExceededError(entry.calls, limit);
  }
}

export async function checkUserQuotaAtomic(userId: string, needed: number = 1): Promise<void> {
  const r = getRedis();
  if (r) {
    try {
      const val = await r.get(redisKey(userId));
      r.quit().catch(() => {});
      const calls = Number(val) || 0;
      const limit = getUserDailyLimit(userId);
      if (calls + needed > limit) {
        throw new UserQuotaExceededError(calls, limit);
      }
      return;
    } catch (err) {
      r.quit().catch(() => {});
      if (err instanceof UserQuotaExceededError) throw err;
    }
  }
  checkUserQuota(userId, needed);
}

export function trackUserCalls(userId: string, count: number = 1): void {
  const entry = ensureTodayMem(userId);
  entry.calls += count;

  const limit = getUserDailyLimit(userId);
  console.log(
    `[user-quota] user=${userId} +${count} | today=${entry.date} calls=${entry.calls}/${limit}`,
  );

  if (entry.calls >= limit * 0.8 && entry.calls - count < limit * 0.8) {
    console.warn(`[user-quota] WARNING: user=${userId} a atteint 80% de son quota (${entry.calls}/${limit})`);
  }

  if (entry.calls >= limit && entry.calls - count < limit) {
    notifyQuotaReached(userId, entry.calls, limit);
  }

  const db = getDb();
  if (db) {
    db.query(
      `INSERT INTO user_usage (user_id, date, calls, plan)
       VALUES ($1, CURRENT_DATE, $2, (SELECT COALESCE(plan, 'free') FROM users WHERE id = $1))
       ON CONFLICT (user_id, date) DO UPDATE SET calls = user_usage.calls + $2`,
      [userId, count],
    ).catch((err: Error) => console.error('[user-quota] DB write failed:', err.message));
  }
}

export async function trackUserCallsAtomic(userId: string, count: number = 1): Promise<number> {
  const r = getRedis();
  if (r) {
    try {
      const key = redisKey(userId);
      const newVal = await r.incrby(key, count);
      const ttl = await r.ttl(key);
      if (ttl < 0) {
        const midnight = new Date();
        midnight.setUTCHours(24, 0, 0, 0);
        const secondsLeft = Math.ceil((midnight.getTime() - Date.now()) / 1000);
        await r.expire(key, secondsLeft);
      }
      r.quit().catch(() => {});
      const entry = ensureTodayMem(userId);
      entry.calls = newVal;
      usingFallback = false;
      return newVal;
    } catch (err) {
      r.quit().catch(() => {});
      if (!usingFallback) {
        console.warn('[user-quota] Redis unavailable, falling back to in-memory counter');
        usingFallback = true;
      }
    }
  }
  trackUserCalls(userId, count);
  return ensureTodayMem(userId).calls;
}

export function getUserUsage(userId: string): { date: string; calls: number; limit: number; remaining: number } {
  const entry = ensureTodayMem(userId);
  const limit = getUserDailyLimit(userId);
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

export async function getUserUsageHistory(
  userId: string,
  days: number = 30,
): Promise<Array<{ date: string; calls: number; plan: string }>> {
  const db = getDb();
  if (!db) return [];
  try {
    const { rows } = await db.query<{ date: string; calls: number; plan: string }>(
      `SELECT date::text, calls, plan FROM user_usage
       WHERE user_id = $1 AND date >= CURRENT_DATE - $2::int
       ORDER BY date DESC`,
      [userId, days],
    );
    return rows;
  } catch { return []; }
}

export async function getUserUsagePeriod(
  userId: string,
  startDate: string,
  endDate: string,
): Promise<{ totalCalls: number; days: number; plan: string }> {
  const db = getDb();
  if (!db) return { totalCalls: 0, days: 0, plan: 'free' };
  try {
    const { rows } = await db.query<{ total_calls: string; days: string; plan: string }>(
      `SELECT COALESCE(SUM(calls), 0) AS total_calls, COUNT(*)::int AS days,
              COALESCE(MAX(plan), 'free') AS plan
       FROM user_usage
       WHERE user_id = $1 AND date >= $2::date AND date <= $3::date`,
      [userId, startDate, endDate],
    );
    return {
      totalCalls: Number(rows[0]?.total_calls ?? 0),
      days: Number(rows[0]?.days ?? 0),
      plan: rows[0]?.plan ?? 'free',
    };
  } catch { return { totalCalls: 0, days: 0, plan: 'free' }; }
}

export async function getUserTotalCalls(userId: string): Promise<number> {
  const db = getDb();
  if (!db) return getUserUsage(userId).calls;
  try {
    const { rows } = await db.query<{ total_calls: string }>(
      'SELECT COALESCE(SUM(calls), 0) AS total_calls FROM user_usage WHERE user_id = $1',
      [userId],
    );
    return Number(rows[0]?.total_calls ?? 0);
  } catch {
    return getUserUsage(userId).calls;
  }
}

export async function getAllUsersUsagePeriod(
  startDate: string,
  endDate: string,
): Promise<Array<{ userId: string; plan: string; totalCalls: number; days: number }>> {
  const db = getDb();
  if (!db) return [];
  try {
    const { rows } = await db.query<{ user_id: string; plan: string; total_calls: string; days: string }>(
      `SELECT user_id, COALESCE(MAX(plan), 'free') AS plan,
              COALESCE(SUM(calls), 0) AS total_calls, COUNT(*)::int AS days
       FROM user_usage
       WHERE date >= $1::date AND date <= $2::date
       GROUP BY user_id
       ORDER BY total_calls DESC`,
      [startDate, endDate],
    );
    return rows.map(r => ({
      userId: r.user_id,
      plan: r.plan,
      totalCalls: Number(r.total_calls),
      days: Number(r.days),
    }));
  } catch { return []; }
}

function notifyQuotaReached(userId: string, usage: number, limit: number): void {
  const db = getDb();
  if (!db) return;
  db.query<{ email: string }>('SELECT email FROM users WHERE id = $1', [userId])
    .then(async ({ rows }) => {
      if (!rows[0]?.email) return;
      const { sendQuotaReachedEmail } = await import('./emailService');
      sendQuotaReachedEmail(rows[0].email, usage, limit).catch(() => {});
    })
    .catch(() => {});
}

export function resetForTesting(): void {
  memCounters.clear();
  usingFallback = false;
}
