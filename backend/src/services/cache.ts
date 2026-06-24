import Redis from 'ioredis';

const TTL_SECONDS = 600;

export function cacheKey(params: Record<string, string | number>): string {
  return Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('&');
}

// ---------- Redis backend ----------

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;
  const url = process.env.REDIS_URL;
  if (!url) return null;
  redis = new Redis(url, { maxRetriesPerRequest: 2, lazyConnect: true });
  redis.connect().catch(err => {
    console.error('[cache] Redis connection failed, falling back to in-memory:', err.message);
    redis = null;
  });
  return redis;
}

// ---------- In-memory fallback ----------

interface MemEntry { value: string; expiresAt: number }
const memStore = new Map<string, MemEntry>();

function memGet(key: string): string | null {
  const entry = memStore.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { memStore.delete(key); return null; }
  return entry.value;
}

function memSet(key: string, value: string): void {
  memStore.set(key, { value, expiresAt: Date.now() + TTL_SECONDS * 1000 });
  if (memStore.size > 500) {
    const now = Date.now();
    for (const [k, v] of memStore) {
      if (now > v.expiresAt) memStore.delete(k);
    }
  }
}

// ---------- Public API ----------

export async function getCached<T>(key: string): Promise<T | null> {
  const r = getRedis();
  if (r) {
    try {
      const raw = await r.get(key);
      return raw ? JSON.parse(raw) as T : null;
    } catch {
      return memGet(key) ? JSON.parse(memGet(key)!) as T : null;
    }
  }
  const raw = memGet(key);
  return raw ? JSON.parse(raw) as T : null;
}

export async function setCached<T>(key: string, value: T): Promise<void> {
  const json = JSON.stringify(value);
  const r = getRedis();
  if (r) {
    try {
      await r.set(key, json, 'EX', TTL_SECONDS);
      return;
    } catch {
      memSet(key, json);
      return;
    }
  }
  memSet(key, json);
}
