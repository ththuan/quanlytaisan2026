import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

// Simple in-memory cache store
interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class MemoryCache {
  private cache: Map<string, CacheEntry> = new Map();

  set(key: string, data: any, ttl: number = 300000): void { // Default 5 minutes
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
    logger.debug(`Cache set: ${key} (TTL: ${ttl}ms)`);
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if cache has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      logger.debug(`Cache expired: ${key}`);
      return null;
    }

    return entry.data;
  }

  delete(key: string): void {
    this.cache.delete(key);
    logger.debug(`Cache deleted: ${key}`);
  }

  clear(): void {
    this.cache.clear();
    logger.info('Cache cleared');
  }

  // Clear cache by pattern (e.g., 'assets')
  clearByPattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        logger.debug(`Cache cleared by pattern: ${key}`);
      }
    }
  }
}

export const cache = new MemoryCache();

// Cache middleware
export const cacheMiddleware = (ttl: number = 300000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Generate cache key from URL and query params
    const cacheKey = `${req.method}:${req.originalUrl}`;

    // Check cache
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cachedData);
    }

    // Override res.json to cache the response
    const originalJson = res.json.bind(res);
    res.json = (data: any) => {
      // Cache the response data
      cache.set(cacheKey, data, ttl);
      res.setHeader('X-Cache', 'MISS');
      return originalJson(data);
    };

    next();
  };
};

// Middleware to invalidate cache after mutations
export const invalidateCache = (pattern: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json.bind(res);
    res.json = (data: any) => {
      cache.clearByPattern(pattern);
      logger.info(`Cache invalidated for pattern: ${pattern}`);
      return originalJson(data);
    };
    next();
  };
};

// Cache control headers for static files
export const setCacheHeaders = (maxAge: number = 86400) => { // Default 1 day
  return (req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Cache-Control', `public, max-age=${maxAge}`);
    res.setHeader('Expires', new Date(Date.now() + maxAge * 1000).toUTCString());
    next();
  };
};
