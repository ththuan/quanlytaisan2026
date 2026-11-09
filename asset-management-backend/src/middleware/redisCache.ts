import { Request, Response, NextFunction } from 'express';
import { getRedis } from '../config/redis';

/**
 * Cache ngắn hạn cho các API đọc nhiều (dashboard/thống kê).
 * - Mặc định chỉ cache GET đã xác thực.
 * - `allowAnonymous: true` dùng cho dữ liệu tham chiếu công khai (danh mục...).
 * - Key theo phạm vi dữ liệu (role admin/director hoặc phòng ban) + URL,
 *   không theo user id để tận dụng cache cho nhiều người cùng phạm vi.
 */
export const cacheResponse = (
  ttlSeconds: number,
  options: { allowAnonymous?: boolean } = {}
) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const redis = getRedis();
    if (!redis || req.method !== 'GET') {
      next();
      return;
    }

    const user = (req as any).user;
    if (!user && !options.allowAnonymous) {
      next();
      return;
    }

    const scope = !user
      ? 'public'
      : ['admin', 'director'].includes(user.role)
        ? `role:${user.role}`
        : `dept:${user.department_id || 'none'}`;
    const key = `httpcache:${scope}:${req.originalUrl}`;

    try {
      const cached = await redis.get(key);
      if (cached) {
        res.setHeader('X-Cache', 'HIT');
        res.type('application/json').send(cached);
        return;
      }
    } catch {
      // Redis lỗi → bỏ qua cache, vẫn phục vụ bình thường.
    }

    const originalJson = res.json.bind(res);
    (res as any).json = (body: any) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        redis.setex(key, ttlSeconds, JSON.stringify(body)).catch(() => undefined);
      }
      res.setHeader('X-Cache', 'MISS');
      return originalJson(body);
    };

    next();
  };
};

/**
 * Xóa các cache key Redis chứa chuỗi chỉ định (dùng khi dữ liệu nền thay đổi).
 * Dùng SCAN thay vì KEYS để không chặn Redis khi có nhiều key.
 */
export const invalidateRedisCache = async (match: string): Promise<void> => {
  const redis = getRedis();
  if (!redis) return;

  try {
    let cursor = '0';
    do {
      const [nextCursor, keys] = await redis.scan(
        cursor,
        'MATCH',
        `httpcache:*${match}*`,
        'COUNT',
        200
      );
      cursor = nextCursor;
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } while (cursor !== '0');
  } catch {
    // Redis lỗi → bỏ qua, dữ liệu vẫn được phục vụ bình thường.
  }
};
