import { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from '../utils/jwt.utils';
import { AssetDisposalCase, AuthSession, MaintenanceRequest, User } from '../models';

export const STORAGE_COOKIE_NAME = 'storage_auth';
export const REFRESH_COOKIE_NAME = 'refresh_token';

const SENSITIVE_PREFIXES = [
  '/maintenance-requests',
  '/asset-disposals',
  '/inventory',
  '/signatures',
];

const isSensitivePath = (path: string) =>
  SENSITIVE_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));

export function readCookie(req: Request, name: string): string | null {
  const header = req.headers.cookie;
  if (!header) return null;

  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return decodeURIComponent(rest.join('='));
  }

  return null;
}

function isHttps(req: Request): boolean {
  return req.secure || req.headers['x-forwarded-proto'] === 'https';
}

/** Cookie HttpOnly chỉ dùng để tải file nội bộ qua <img>/<a>, không dùng cho API. */
export function setStorageCookie(req: Request, res: Response, accessToken: string): void {
  res.cookie(STORAGE_COOKIE_NAME, accessToken, {
    httpOnly: true,
    secure: isHttps(req),
    sameSite: 'strict',
    path: '/storage',
    maxAge: 60 * 60 * 1000,
  });
}

export function clearStorageCookie(req: Request, res: Response): void {
  res.clearCookie(STORAGE_COOKIE_NAME, {
    httpOnly: true,
    secure: isHttps(req),
    sameSite: 'strict',
    path: '/storage',
  });
}

/** Refresh token trong cookie HttpOnly, chỉ gửi tới các endpoint /api/auth. */
export function setRefreshCookie(req: Request, res: Response, refreshToken: string): void {
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: isHttps(req),
    sameSite: 'strict',
    path: '/api/auth',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
}

export function clearRefreshCookie(req: Request, res: Response): void {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: isHttps(req),
    sameSite: 'strict',
    path: '/api/auth',
  });
}

async function canAccessSensitiveFile(
  user: Pick<User, 'id' | 'role' | 'department_id'>,
  path: string,
): Promise<boolean> {
  if (user.role === 'admin' || user.role === 'director') return true;

  const [directory, idSegment] = path.split('/').filter(Boolean);
  const entityId = Number.parseInt(idSegment || '', 10);
  if (!Number.isFinite(entityId) || entityId <= 0) return false;

  if (directory === 'asset-disposals') {
    const disposal = await AssetDisposalCase.findByPk(entityId, {
      attributes: ['id', 'created_by', 'approved_by', 'origin_department_id'],
    });
    if (!disposal) return false;
    return (
      Number((disposal as any).created_by) === user.id ||
      Number((disposal as any).approved_by) === user.id ||
      (!!user.department_id &&
        Number((disposal as any).origin_department_id) === Number(user.department_id))
    );
  }

  if (directory === 'maintenance-requests') {
    const maintenance = await MaintenanceRequest.findByPk(entityId, {
      attributes: ['id', 'requested_by', 'department_id'],
    });
    if (!maintenance) return false;
    return (
      Number((maintenance as any).requested_by) === user.id ||
      (!!user.department_id &&
        Number((maintenance as any).department_id) === Number(user.department_id))
    );
  }

  // Ảnh kiểm kê hiện không gắn trực tiếp với báo cáo trong đường dẫn; yêu cầu
  // đăng nhập là mức bảo vệ hiện tại. Chữ ký chỉ admin được tải.
  if (directory === 'signatures') return false;

  return directory === 'inventory';
}

/**
 * Chặn truy cập ẩn danh vào các thư mục lưu trữ nhạy cảm.
 * Ảnh tài sản công khai (/storage/assets/...) vẫn được phục vụ cho trang QR.
 */
export async function storageAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (!isSensitivePath(req.path)) {
    next();
    return;
  }

  const token = readCookie(req, STORAGE_COOKIE_NAME);
  if (!token) {
    res.status(401).json({ success: false, message: 'Cần đăng nhập để xem tệp này.' });
    return;
  }

  try {
    const decoded = verifyAccessToken(token);
    const session = await AuthSession.findByPk(decoded.sid, {
      attributes: ['id', 'user_id', 'expires_at', 'revoked_at'],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'role', 'department_id', 'is_active'],
          required: false,
        },
      ],
    });

    if (!session || session.user_id !== decoded.id || session.revoked_at || session.expires_at <= new Date()) {
      res.status(401).json({ success: false, message: 'Phiên đăng nhập đã hết hạn.' });
      return;
    }

    const user = (session as any).user as User | undefined;
    if (!user || !user.is_active) {
      res.status(401).json({ success: false, message: 'Tài khoản không còn hoạt động.' });
      return;
    }

    if (!(await canAccessSensitiveFile(user, req.path))) {
      res.status(403).json({ success: false, message: 'Bạn không có quyền xem tệp này.' });
      return;
    }

    next();
  } catch {
    res.status(401).json({ success: false, message: 'Phiên đăng nhập không hợp lệ.' });
  }
}
