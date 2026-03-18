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
}

const cache = new SimpleCache();

// Cache middleware
export const cachingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Only cache GET requests
  if (req.method !== 'GET') {
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
    // Cache the response
    cache.set(cacheKey, data, 60000); // 1 minute TTL
    res.setHeader('X-Cache', 'MISS');
    return originalJson(data);
  };

  next();
};

// Function to invalidate cache - returns middleware
export const invalidateCache = (pattern: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (pattern === 'assets:*' || pattern === 'users:*' || pattern === 'departments:*') {
      cache.clear();
    }
    next();
  };
};

export default cache;
