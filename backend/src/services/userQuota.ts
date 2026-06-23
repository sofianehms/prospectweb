const DEFAULT_USER_DAILY_LIMIT = 100;

interface UserDailyCounter {
  date: string;
  calls: number;
}

const counters = new Map<string, UserDailyCounter>();

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function ensureToday(userId: string): UserDailyCounter {
  const today = todayKey();
  let entry = counters.get(userId);
  if (!entry || entry.date !== today) {
    entry = { date: today, calls: 0 };
    counters.set(userId, entry);
  }
  return entry;
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
  const entry = ensureToday(userId);
  const limit = getUserDailyLimit();
  if (entry.calls + needed > limit) {
    throw new UserQuotaExceededError(entry.calls, limit);
  }
}

export function trackUserCalls(userId: string, count: number = 1): void {
  const entry = ensureToday(userId);
  entry.calls += count;

  const limit = getUserDailyLimit();
  console.log(
    `[user-quota] user=${userId} +${count} | today=${entry.date} calls=${entry.calls}/${limit}`,
  );

  if (entry.calls >= limit * 0.8 && entry.calls - count < limit * 0.8) {
    console.warn(`[user-quota] WARNING: user=${userId} a atteint 80% de son quota (${entry.calls}/${limit})`);
  }
}

export function getUserUsage(userId: string): { date: string; calls: number; limit: number; remaining: number } {
  const entry = ensureToday(userId);
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
  for (const [userId, entry] of counters) {
    if (entry.date === today) {
      result.push({ userId, date: entry.date, calls: entry.calls });
    }
  }
  return result;
}

export function resetForTesting(): void {
  counters.clear();
}
