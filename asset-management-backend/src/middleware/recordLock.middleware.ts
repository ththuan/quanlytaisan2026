import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { assertRecordUnlocked, LockEntityType } from '../services/recordLock.service';

/**
 * Chặn thao tác nếu hồ sơ đang bị người khác giữ khóa.
 * Không bắt buộc phải có khóa mới được sửa (tương thích client cũ),
 * nhưng nếu có khóa của người khác thì trả 409.
 */
export const requireUnlockedRecord = (entityType: LockEntityType) => {
  return async (req: AuthRequest, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Number.parseInt(req.params.id, 10);
      if (Number.isFinite(id) && id > 0 && req.user) {
        await assertRecordUnlocked(entityType, id, req.user.id, req.user.role);
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};
