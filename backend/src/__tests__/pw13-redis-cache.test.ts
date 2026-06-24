import { describe, it, expect, beforeEach } from 'vitest';
import { getCached, setCached, cacheKey } from '../services/cache';

describe('PW-13 -- cache API (in-memory fallback, no REDIS_URL)', () => {
  beforeEach(() => {
    delete process.env.REDIS_URL;
  });

  it('cacheKey is deterministic and sorted', () => {
    const a = cacheKey({ z: 'last', a: 'first' });
    const b = cacheKey({ a: 'first', z: 'last' });
    expect(a).toBe(b);
    expect(a).toBe('a=first&z=last');
  });

  it('getCached returns null for unknown key', async () => {
    const val = await getCached('nonexistent-key');
    expect(val).toBeNull();
  });

  it('setCached then getCached returns the value', async () => {
    await setCached('test-key', { foo: 'bar' });
    const val = await getCached<{ foo: string }>('test-key');
    expect(val).toEqual({ foo: 'bar' });
  });

  it('getCached and setCached return promises (async API)', () => {
    const getResult = getCached('any');
    const setResult = setCached('any', 'val');
    expect(getResult).toBeInstanceOf(Promise);
    expect(setResult).toBeInstanceOf(Promise);
  });
});

describe('PW-13 -- cache module supports Redis configuration', () => {
  it('cache.ts imports ioredis and checks REDIS_URL', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const src = fs.readFileSync(
      path.resolve(__dirname, '../services/cache.ts'),
      'utf-8',
    );
    expect(src).toContain("import Redis from 'ioredis'");
    expect(src).toContain('REDIS_URL');
    expect(src).toContain('EX');
  });
});
