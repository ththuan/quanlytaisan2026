import { Request, Response, NextFunction } from 'express';
import { listSignatures } from '../services/signature.service';

type AuthRequest = Request & { user?: { id: number; role: string; department_id?: number } };

/**
 * GET /api/signatures?entity_type=&entity_id=
 * Danh sách chữ ký sống của một đối tượng (dùng cho biên bản/chi tiết).
 */
export const getSignatures = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const entityType = String(req.query.entity_type ?? '').trim();
    const entityId = Number.parseInt(String(req.query.entity_id ?? ''), 10);

    if (!entityType || !Number.isFinite(entityId) || entityId <= 0) {
      res.status(400).json({ success: false, message: 'Thiếu entity_type hoặc entity_id' });
      return;
    }

    const signatures = await listSignatures(entityType, entityId);
    res.status(200).json({ success: true, data: signatures });
  } catch (error) {
    next(error);
  }
};
