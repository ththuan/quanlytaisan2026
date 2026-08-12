import { Request, Response, NextFunction } from 'express';
import { verifyToken, JWTPayload } from '../utils/jwt.utils';
import { UnauthorizedError } from '../utils/errorHandler';

export interface AuthRequest extends Request {
  user?: JWTPayload;
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from header (preferred) or query string (for opening PDF in new tab)
    const authHeader = req.headers.authorization;

    let token: string | null = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    // Token qua URL chỉ chấp nhận cho GET (download tài liệu mở tab mới).
    // KHÔNG cho phép trên POST/PUT/DELETE — tránh lộ token trong log/Referer
    // và chặn thao tác thay đổi dữ liệu qua URL bị rò rỉ.
    if (!token && req.method === 'GET') {
      const tokenFromQuery = typeof req.query.token === 'string' ? req.query.token : null;
      if (tokenFromQuery) token = tokenFromQuery;
    }

    if (!token) {
      throw new UnauthorizedError('No token provided');
    }

    // Verify token
    const decoded = verifyToken(token);

    // Attach user to request
    req.user = decoded;

    next();
  } catch (error) {
    if (error instanceof Error) {
      next(new UnauthorizedError(error.message));
    } else {
      next(new UnauthorizedError('Authentication failed'));
    }
  }
};

export const optionalAuthMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);
      req.user = decoded;
    }

    next();
  } catch (error) {
    // Ignore errors for optional auth
    next();
  }
};

// Export alias for compatibility with existing imports
export const authenticateToken = authMiddleware;
export const authenticate = authMiddleware;

// Role-based authorization middleware
export const requireRoles = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError('Authentication required'));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(new UnauthorizedError(`Access denied. Required roles: ${roles.join(', ')}`));
      return;
    }

    next();
  };
};
