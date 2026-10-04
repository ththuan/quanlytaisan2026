import { MemoryStore } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { getRedis } from './redis';
import logger from '../utils/logger';

/**
 * Store dùng chung cho express-rate-limit.
 * Khi chạy cluster (nhiều worker), dùng Redis để chia sẻ bộ đếm giữa các worker,
 * tránh việc giới hạn bị nhân lên theo số worker. Nếu Redis không khả dụng thì
 * fallback về MemoryStore (mỗi worker đếm riêng).
 */
let store: MemoryStore | RedisStore = new MemoryStore();

export function initRateLimitStore(): void {
  const redis = getRedis();
  if (redis) {
    store = new RedisStore({
      prefix: 'rl:',
      sendCommand: (...args: string[]) => redis.call(args[0], ...args.slice(1)) as Promise<any>,
    });
    logger.info('[RateLimit] Dùng Redis làm store chia sẻ cho rate limiting.');
  } else {
    logger.warn('[RateLimit] Redis không khả dụng — dùng MemoryStore (mỗi worker đếm riêng).');
  }
}

export function getRateLimitStore(): MemoryStore | RedisStore {
  return store;
}
