import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JWTPayload } from '../utils/jwt.utils';
import { ForbiddenError, UnauthorizedError } from '../utils/errorHandler';
import { AuthSession, User } from '../models';

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
    const decoded = verifyAccessToken(token);

    const session = await AuthSession.findByPk(decoded.sid, {
      attributes: ['id', 'user_id', 'expires_at', 'revoked_at'],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'role', 'department_id', 'fullname', 'is_active'],
          required: false,
        },
      ],
    });
    if (!session || session.user_id !== decoded.id || session.revoked_at || session.expires_at <= new Date()) {
      throw new UnauthorizedError('Session is no longer active');
    }

    // Lấy vai trò/phòng ban HIỆN TẠI từ DB (không dùng giá trị cũ trong JWT).
    // Nhờ vậy admin đổi phòng/vai trò là có hiệu lực ngay, không cần đăng nhập lại.
    const dbUser = (session as any).user as User | undefined;
    if (!dbUser || !dbUser.is_active) {
      throw new UnauthorizedError('Tài khoản không còn hoạt động');
    }

    req.user = {
      ...decoded,
      username: dbUser.username,
      role: dbUser.role,
      department_id: dbUser.department_id,
      fullname: dbUser.fullname,
    };

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
      const decoded = verifyAccessToken(token);
      const session = await AuthSession.findByPk(decoded.sid, {
        attributes: ['id', 'user_id', 'expires_at', 'revoked_at'],
      });
      if (session && session.user_id === decoded.id && !session.revoked_at && session.expires_at > new Date()) {
        req.user = decoded;
      }
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
/**
 * Non-admin/director users must belong to a department. Without one, most
 * scoped queries would silently omit the department filter (fail-open).
 */
export const requireDepartmentScope = (
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
): void => {
  if (!req.user) {
    next(new UnauthorizedError('Authentication required'));
    return;
  }

  if (req.user.role === 'admin' || req.user.role === 'director') {
    next();
    return;
  }

  if (!req.user.department_id) {
    next(new ForbiddenError('Tài khoản chưa được gán đơn vị. Vui lòng liên hệ quản trị viên.'));
    return;
  }

  next();
};

export const requireRoles = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError('Authentication required'));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(new ForbiddenError(`Access denied. Required roles: ${roles.join(', ')}`));
      return;
    }

    next();
  };
};
