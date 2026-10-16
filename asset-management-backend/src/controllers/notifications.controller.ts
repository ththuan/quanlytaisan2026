import { Request, Response, NextFunction } from 'express';
import { Notification } from '../models';

type AuthenticatedRequest = Request & {
  user?: { id: number; role: string; department_id?: number; fullname?: string; email?: string };
};

const parseLimit = (value: any, defaultValue: number) => {
  const n = Number.parseInt(String(value ?? ''), 10);
  if (Number.isNaN(n) || n <= 0) return defaultValue;
  return Math.min(n, 100);
};

const parseOffset = (value: any) => {
  const n = Number.parseInt(String(value ?? ''), 10);
  if (Number.isNaN(n) || n < 0) return 0;
  return n;
};

/**
 * GET /api/notifications
 * Danh sách thông báo của CHÍNH người dùng hiện tại.
 */
export const getNotifications = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const limit = parseLimit(req.query.limit, 20);
    const offset = parseOffset(req.query.offset);
    const unreadOnly = String(req.query.unread_only ?? 'false') === 'true';

    const where: any = { user_id: userId };
    if (unreadOnly) where.is_read = false;

    const { rows, count } = await Notification.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    const unreadCount = await Notification.count({ where: { user_id: userId, is_read: false } });

    res.status(200).json({
      success: true,
      data: {
        items: rows,
        total: count,
        unread_count: unreadCount,
        limit,
        offset,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/notifications/unread-count
 */
export const getUnreadCount = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const unreadCount = await Notification.count({ where: { user_id: userId, is_read: false } });
    res.status(200).json({ success: true, data: { unread_count: unreadCount } });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/notifications/:id/read — đánh dấu 1 thông báo của mình đã đọc
 */
export const markAsRead = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const id = Number.parseInt(req.params.id, 10);

    const [affected] = await Notification.update(
      { is_read: true, read_at: new Date() },
      { where: { id, user_id: userId, is_read: false } }
    );

    res.status(200).json({ success: true, updated: affected });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/notifications/read-all — đánh dấu tất cả thông báo của mình đã đọc
 */
export const markAllAsRead = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const [affected] = await Notification.update(
      { is_read: true, read_at: new Date() },
      { where: { user_id: userId, is_read: false } }
    );
    res.status(200).json({ success: true, updated: affected });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/notifications/read — xóa các thông báo đã đọc của mình
 */
export const clearRead = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const deleted = await Notification.destroy({ where: { user_id: userId, is_read: true } });
    res.status(200).json({ success: true, deleted });
  } catch (error) {
    next(error);
  }
};
