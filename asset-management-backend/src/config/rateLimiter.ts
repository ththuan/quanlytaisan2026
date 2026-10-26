import { MemoryStore } from 'express-rate-limit';
import type { Store } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { getRedis } from './redis';
import logger from '../utils/logger';

/**
 * Store cho express-rate-limit.
 *
 * Mỗi rate limiter PHẢI dùng một store riêng (express-rate-limit v7+ ném lỗi
 * ERR_ERL_STORE_REUSE nếu chia sẻ cùng instance), nên dùng factory bên dưới.
 * Khi chạy cluster (nhiều worker), dùng Redis để chia sẻ bộ đếm giữa các worker,
 * tránh việc giới hạn bị nhân lên theo số worker. Mỗi limiter có prefix riêng.
 * Nếu Redis không khả dụng thì fallback về MemoryStore (mỗi worker đếm riêng).
 */
export function initRateLimitStore(): void {
  if (getRedis()) {
    logger.info('[RateLimit] Dùng Redis làm store chia sẻ cho rate limiting.');
  } else {
    logger.warn('[RateLimit] Redis không khả dụng — dùng MemoryStore (mỗi worker đếm riêng).');
  }
}

export function createRateLimitStore(prefix: string): Store {
  const redis = getRedis();
  if (redis) {
    return new RedisStore({
      prefix: `rl:${prefix}:`,
      sendCommand: (...args: string[]) => redis.call(args[0], ...args.slice(1)) as Promise<any>,
    });
  }
  return new MemoryStore();
}
