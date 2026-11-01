import { Request, Response, NextFunction } from 'express';
import { getRedis } from '../config/redis';

/**
 * Cache ngắn hạn cho các API đọc nhiều (dashboard/thống kê).
 * - Chỉ cache GET đã xác thực.
 * - Key theo phạm vi dữ liệu (role admin/director hoặc phòng ban) + URL,
 *   không theo user id để tận dụng cache cho nhiều người cùng phạm vi.
 */
export const cacheResponse = (ttlSeconds: number) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const redis = getRedis();
    if (!redis || req.method !== 'GET') {
      next();
      return;
    }

    const user = (req as any).user;
    if (!user) {
      next();
      return;
    }

    const scope = ['admin', 'director'].includes(user.role)
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
