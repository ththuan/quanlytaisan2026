import { Request, Response, NextFunction } from 'express';
import { listSignatures } from '../services/signature.service';
import {
  AssetTransfer,
  InventoryReport,
  AnnualReport,
  AssetDisposalCase,
} from '../models';
import { ForbiddenError } from '../utils/errorHandler';

type AuthRequest = Request & {
  user?: { id: number; role: string; department_id?: number | null };
};

async function canAccessEntity(
  user: NonNullable<AuthRequest['user']>,
  entityType: string,
  entityId: number,
): Promise<boolean> {
  if (user.role === 'admin' || user.role === 'director') return true;

  switch (entityType) {
    case 'asset_transfer': {
      const transfer = await AssetTransfer.findByPk(entityId, {
        attributes: [
          'id',
          'requested_by',
          'approved_by',
          'head_approved_by',
          'from_department_id',
          'to_department_id',
        ],
      });
      if (!transfer) return false;
      return (
        Number((transfer as any).requested_by) === user.id ||
        Number((transfer as any).approved_by) === user.id ||
        Number((transfer as any).head_approved_by) === user.id ||
        (!!user.department_id &&
          (Number((transfer as any).from_department_id) === Number(user.department_id) ||
            Number((transfer as any).to_department_id) === Number(user.department_id)))
      );
    }
    case 'inventory_report': {
      const report = await InventoryReport.findByPk(entityId, {
        attributes: [
          'id',
          'created_by',
          'department_id',
          'head_approved_by',
          'admin_approved_by',
        ],
      });
      if (!report) return false;
      return (
        Number((report as any).created_by) === user.id ||
        Number((report as any).head_approved_by) === user.id ||
        Number((report as any).admin_approved_by) === user.id ||
        (!!user.department_id &&
          Number((report as any).department_id) === Number(user.department_id))
      );
    }
    case 'annual_report': {
      const report = await AnnualReport.findByPk(entityId, {
        attributes: ['id', 'created_by', 'department_id', 'approved_by'],
      });
      if (!report) return false;
      return (
        Number((report as any).created_by) === user.id ||
        Number((report as any).approved_by) === user.id ||
        (!!user.department_id &&
          Number((report as any).department_id) === Number(user.department_id))
      );
    }
    case 'asset_disposal_case': {
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
    default:
      return false;
  }
}

/**
 * GET /api/signatures?entity_type=&entity_id=
 * Danh sách chữ ký sống của một đối tượng (dùng cho biên bản/chi tiết).
 */
export const getSignatures = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const entityType = String(req.query.entity_type ?? '').trim();
    const entityId = Number.parseInt(String(req.query.entity_id ?? ''), 10);
    const user = req.user!;

    if (!entityType || !Number.isFinite(entityId) || entityId <= 0) {
      res.status(400).json({ success: false, message: 'Thiếu entity_type hoặc entity_id' });
      return;
    }

    if (!(await canAccessEntity(user, entityType, entityId))) {
      throw new ForbiddenError('Bạn không có quyền xem chữ ký của đối tượng này.');
    }

    const signatures = await listSignatures(entityType, entityId);
    const data = signatures.map((signature) => {
      const plain = signature.toJSON() as unknown as Record<string, unknown>;
      if (user.role !== 'admin') {
        delete plain.ip_address;
        delete plain.user_agent;
      }
      return plain;
    });

    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
