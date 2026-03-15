import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import { AuditLog } from '../models';

type AuthenticatedRequest = Request & { user?: { id: number } };

// Helper: extract real client IP, stripping IPv4-mapped IPv6 prefix
const getClientIp = (req: Request): string => {
  const forwarded = req.headers['x-forwarded-for'];
  const raw = (Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0]?.trim()) || req.ip || '';
  return raw.replace(/^::ffff:/, '');
};

// Logging middleware for HTTP requests
export const requestLogger = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const start = Date.now();

  // Log when response is finished
  res.on('finish', () => {
    const duration = Date.now() - start;

    logger.info('HTTP Request', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: getClientIp(req),
      userAgent: req.get('user-agent'),
      user: (req as any).user?.id,
    });
  });

  next();
};

// Audit logging for important actions
export const auditLog = (action: 'create' | 'update' | 'delete' | 'approve') => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Store original json method
      const originalJson = res.json.bind(res);

      // Override json method to capture response
      res.json = function (body: any) {
        // Only log successful operations
        if (res.statusCode >= 200 && res.statusCode < 300) {
          // Create audit log entry
          AuditLog.create({
            user_id: req.user?.id,
            action,
            table_name: req.baseUrl.split('/').pop(),
            record_id: body?.data?.id || req.params.id,
            old_value: req.body._oldValue || null,
            new_value: body?.data || req.body,
            ip_address: getClientIp(req),
            user_agent: req.get('user-agent'),
          }).catch((error) => {
            logger.error('Failed to create audit log:', error);
          });
        }

        return originalJson(body);
      };

      next();
    } catch (error) {
      next(error);
    }
  };
};
