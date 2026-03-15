import { Request, Response, NextFunction } from 'express';
import { AuditLog, User, MaintenanceRequest, AssetTransfer, InventoryReport, InventoryRound, AssetDisposalCase, Department } from '../models';
import { Op } from 'sequelize';

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

export const getNotifications = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const limit = parseLimit(req.query.limit, 20);
    const offset = parseOffset(req.query.offset);

    const unreadOnly = String(req.query.unread_only ?? 'false') === 'true';

    const where: any = {};

    if (unreadOnly) {
      where.read_at = { [Op.is]: null };
    }

    const { rows, count } = await AuditLog.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit,
      offset,
      include: [
        {
          model: User as any,
          as: 'user',
          attributes: ['id', 'username', 'fullname', 'role'],
          required: false,
        },
      ],
    } as any);

    res.status(200).json({
      success: true,
      data: {
        items: rows,
        total: count,
        limit,
        offset,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = Number.parseInt(req.params.id, 10);

    await AuditLog.update(
      { read_at: new Date() },
      {
        where: {
          id,
        },
      }
    );

    res.status(200).json({
      success: true,
      message: 'Marked as read',
    });
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await AuditLog.update(
      { read_at: new Date() },
      {
        where: {
          read_at: { [Op.is]: null },
        },
      }
    );

    res.status(200).json({
      success: true,
      message: 'Marked all as read',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /notifications/pending-approvals
 * Trả về tất cả yêu cầu phê duyệt cần xử lý theo phân quyền của người dùng hiện tại.
 */
export const getPendingApprovals = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const role = user.role;
    const departmentId = user.department_id;

    const notifications: any[] = [];

    const maintenanceStatusLabels: Record<string, string> = {
      pending: 'chờ duyệt (Trưởng Đơn vị)',
      new: 'mới - chờ duyệt',
      approved_by_head: 'chờ duyệt (Quản trị viên)',
      approved_by_admin: 'chờ duyệt (Giám hiệu)',
      repair_completed: 'hoàn thành sửa chữa - chờ xác nhận',
    };
    const requestTypeLabels: Record<string, string> = {
      procurement: 'mua sắm',
      repair: 'sửa chữa',
    };

    // ─── MAINTENANCE REQUESTS ──────────────────────────────────────────────
    let maintenanceWhere: any | null = null;
    if (role === 'department_head' && departmentId) {
      maintenanceWhere = {
        status: { [Op.in]: ['pending', 'new'] },
        department_id: departmentId,
      };
    } else if (role === 'admin') {
      maintenanceWhere = { status: { [Op.in]: ['approved_by_head', 'repair_completed'] } };
    } else if (role === 'director') {
      maintenanceWhere = { status: 'approved_by_admin' };
    }

    if (maintenanceWhere) {
      const maintenanceItems = await MaintenanceRequest.findAll({
        where: maintenanceWhere,
        limit: 30,
        order: [['created_at', 'DESC']],
        include: [
          { model: Department as any, as: 'department', attributes: ['id', 'name'] },
          { model: User as any, as: 'requester', attributes: ['id', 'fullname'], required: false },
        ],
      } as any);

      maintenanceItems.forEach((item: any) => {
        const d = item.toJSON ? item.toJSON() : item;
        notifications.push({
          id: d.id,
          type: 'maintenance',
          title: `Yêu cầu ${requestTypeLabels[d.request_type] || d.request_type} cần phê duyệt`,
          message: `"${d.description || d.title || '(không có mô tả)'}" — đơn vị ${d.department?.name || ''} — ${maintenanceStatusLabels[d.status] || d.status}`,
          status: d.status,
          created_at: d.created_at,
          maintenance_id: d.id,
          department: d.department,
          requester: d.requester,
        });
      });
    }

    // ─── ASSET TRANSFERS ───────────────────────────────────────────────────
    let transferWhere: any | null = null;
    if (role === 'department_head' && departmentId) {
      transferWhere = {
        status: 'pending',
        [Op.or]: [
          { from_department_id: departmentId },
          { to_department_id: departmentId },
        ],
      };
    } else if (role === 'admin' || role === 'director') {
      transferWhere = { status: { [Op.in]: ['pending', 'approved_by_head'] } };
    }

    if (transferWhere) {
      const transferItems = await AssetTransfer.findAll({
        where: transferWhere,
        limit: 30,
        order: [['created_at', 'DESC']],
        include: [
          { model: Department as any, as: 'from_department', attributes: ['id', 'name'] },
          { model: Department as any, as: 'to_department', attributes: ['id', 'name'] },
          { model: User as any, as: 'requester', attributes: ['id', 'fullname'], required: false },
        ],
      } as any);

      transferItems.forEach((item: any) => {
        const d = item.toJSON ? item.toJSON() : item;
        const statusLabel = d.status === 'approved_by_head' ? 'chờ duyệt (Quản trị viên/Giám hiệu)' : 'chờ duyệt (Trưởng Đơn vị)';
        notifications.push({
          id: d.id,
          type: 'transfer',
          title: 'Yêu cầu điều chuyển tài sản cần phê duyệt',
          message: `Điều chuyển từ ${d.from_department?.name || ''} đến ${d.to_department?.name || ''} — ${statusLabel}`,
          status: d.status,
          created_at: d.created_at,
          transfer_id: d.id,
          from_department: d.from_department,
          to_department: d.to_department,
          requester: d.requester,
        });
      });
    }

    // ─── INVENTORY REPORTS ────────────────────────────────────────────────
    let inventoryWhere: any | null = null;
    if (role === 'department_head' && departmentId) {
      const childDepts = await Department.findAll({
        where: { parent_department_id: departmentId } as any,
        attributes: ['id'],
      } as any);
      const deptIds = [departmentId, ...(childDepts as any[]).map((d: any) => d.id)];
      inventoryWhere = { status: 'pending', department_id: { [Op.in]: deptIds } };
    } else if (role === 'admin') {
      inventoryWhere = { status: 'approved_by_head' };
    }

    if (inventoryWhere) {
      const inventoryItems = await InventoryReport.findAll({
        where: inventoryWhere,
        limit: 30,
        order: [['created_at', 'DESC']],
        include: [
          { model: Department as any, as: 'department', attributes: ['id', 'name'] },
          { model: User as any, as: 'creator', attributes: ['id', 'fullname'], required: false },
          { model: InventoryRound as any, as: 'inventory_round', attributes: ['id', 'round_name', 'round_year'], required: false },
        ],
      } as any);

      inventoryItems.forEach((item: any) => {
        const d = item.toJSON ? item.toJSON() : item;
        const roundLabel = d.inventory_round ? `đợt ${d.inventory_round.round_name}` : '';
        const statusLabel = d.status === 'approved_by_head' ? 'chờ duyệt (Quản trị viên)' : 'chờ duyệt (Trưởng Đơn vị)';
        notifications.push({
          id: d.id,
          type: 'inventory',
          title: 'Báo cáo kiểm kê cần phê duyệt',
          message: `Báo cáo của ${d.department?.name || ''} ${roundLabel} — ${statusLabel}`,
          status: d.status,
          created_at: d.created_at,
          report_id: d.id,
          department: d.department,
          requester: d.creator,
        });
      });
    }

    // ─── DISPOSAL CASES (admin only) ─────────────────────────────────────
    if (role === 'admin') {
      const disposalItems = await AssetDisposalCase.findAll({
        where: { status: 'pending' },
        limit: 30,
        order: [['created_at', 'DESC']],
        include: [
          { model: Department as any, as: 'origin_department', attributes: ['id', 'name'], required: false },
        ],
      } as any);

      disposalItems.forEach((item: any) => {
        const d = item.toJSON ? item.toJSON() : item;
        notifications.push({
          id: d.id,
          type: 'disposal',
          title: 'Hồ sơ thanh lý/tiêu hủy cần xử lý',
          message: `Hồ sơ ${d.code || ''} từ đơn vị ${d.origin_department?.name || ''} — chờ hoàn tất`,
          status: d.status,
          created_at: d.created_at,
          disposal_id: d.id,
          department: d.origin_department,
        });
      });
    }

    // Sort newest first
    notifications.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    res.status(200).json({
      success: true,
      data: notifications,
      total: notifications.length,
    });
  } catch (error) {
    next(error);
  }
};
