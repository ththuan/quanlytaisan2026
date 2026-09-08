import { Request, Response, NextFunction } from 'express';

// Simple in-memory cache
interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

class SimpleCache {
  private cache: Map<string, CacheEntry> = new Map();

  set(key: string, data: any, ttl: number = 60000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  /** Xóa mọi entry có key chứa chuỗi (vd. '/departments' khớp GET:/api/departments?...) */
  clearKeyContains(substring: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(substring)) {
        this.cache.delete(key);
      }
    }
  }
}

const cache = new SimpleCache();

// Cache middleware
export const cachingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Authenticated responses are user/department-specific. The cache key is
  // URL-only, so caching them can leak one user's response to another device.
  // Restrict this cache to explicitly public, anonymous GET endpoints.
  const hasAuthorization = typeof req.headers.authorization === 'string';
  const isPublicApi = req.originalUrl.startsWith('/api/public/');

  if (req.method !== 'GET' || hasAuthorization || !isPublicApi) {
    res.setHeader('Cache-Control', 'private, no-store, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Vary', 'Authorization');
    return next();
  }

  const cacheKey = `${req.method}:${req.originalUrl}`;
  const cached = cache.get(cacheKey);

  if (cached) {
    res.setHeader('X-Cache', 'HIT');
    return res.json(cached);
  }

  // Override res.json to cache the response
  const originalJson = res.json.bind(res);
  res.json = (data: any) => {
    // Only cache successful public responses.
    if (res.statusCode >= 200 && res.statusCode < 300) {
      cache.set(cacheKey, data, 60000); // 1 minute TTL
    }
    res.setHeader('X-Cache', 'MISS');
    return originalJson(data);
  };

  next();
};

// Function to invalidate cache - returns middleware
// Xóa cache khi controller gọi res.json (sau khi ghi DB xong), tránh GET xen vào lúc import mà cache lại bản cũ.
export const invalidateCache = (pattern: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const runClear = () => {
      if (pattern === 'assets:*' || pattern === 'users:*' || pattern === 'departments:*') {
        cache.clear();
      } else if (pattern === 'departments') {
        cache.clearKeyContains('/departments');
      } else if (pattern === 'users') {
        cache.clearKeyContains('/users');
      } else if (pattern === 'assets') {
        cache.clearKeyContains('/assets');
      }
    };
    const originalJson = res.json.bind(res);
    res.json = (body: any) => {
      runClear();
      return originalJson(body);
    };
    next();
  };
};

export default cache;
