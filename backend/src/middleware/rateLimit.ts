import rateLimit, { Store } from 'express-rate-limit';
import { Request } from 'express';
import Redis from 'ioredis';
import RedisStore from 'rate-limit-redis';

function createRedisStore(prefix: string): Store | undefined {
  const url = process.env.REDIS_URL;
  if (!url) return undefined;
  try {
    const client = new Redis(url, { maxRetriesPerRequest: 1 });
    client.on('error', () => {});
    return new RedisStore({
      sendCommand: (...args: string[]) =>
        client.call(...(args as [string, ...string[]])) as Promise<number | string>,
      prefix,
    });
  } catch {
    return undefined;
  }
}

export const searchRateLimiter = rateLimit({
  windowMs: 60_000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => req.user?.sub ?? req.ip ?? 'unknown',
  message: { error: 'Trop de requêtes. Réessayez dans une minute.' },
  store: createRedisStore('rl:search:'),
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de tentatives. Réessayez dans 15 minutes.' },
  store: createRedisStore('rl:auth:'),
});
