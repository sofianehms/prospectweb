interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const TTL_MS = 10 * 60 * 1000;
const store = new Map<string, CacheEntry<unknown>>();

export function cacheKey(params: Record<string, string | number>): string {
  return Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('&');
}

export function getCached<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.value as T;
}

export function setCached<T>(key: string, value: T): void {
  store.set(key, { value, expiresAt: Date.now() + TTL_MS });
  if (store.size > 500) {
    const now = Date.now();
    for (const [k, v] of store) {
      if (now > v.expiresAt) store.delete(k);
    }
  }
}
