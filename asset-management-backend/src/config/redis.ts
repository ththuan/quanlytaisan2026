import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

let redis: Redis | null = null;

export function getRedis(): Redis | null {
  return redis;
}

export async function connectRedis(): Promise<Redis | null> {
  if (redis) return redis;

  try {
    redis = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 3) {
          console.warn('[Redis] Connection failed after 3 retries — running without cache');
          return null;
        }
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true,
    });

    redis.on('connect', () => console.log('[Redis] Connected'));
    redis.on('error', (err) => console.warn('[Redis] Error (non-fatal):', err.message));

    await redis.connect();
    await redis.ping();
    console.log('[Redis] Ready —', REDIS_URL);

    return redis;
  } catch (err: any) {
    console.warn('[Redis] Unavailable, app continues without cache:', err.message);
    redis = null;
    return null;
  }
}
