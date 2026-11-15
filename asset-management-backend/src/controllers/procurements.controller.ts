import { Response, NextFunction } from 'express';
import procurementService from '../services/procurement.service';
import procurementExportService from '../services/procurementExport.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { Procurement } from '../models';
import { ForbiddenError, NotFoundError } from '../utils/errorHandler';

const applyProcurementScope = (req: AuthRequest, query: any) => {
  const scoped = { ...query };
  if (req.permissionScope === 'department') {
    scoped.receiving_department_id = req.user?.department_id;
  } else if (req.permissionScope === 'own') {
    scoped.created_by = req.user?.id;
  }
  return scoped;
};

const assertProcurementScope = async (req: AuthRequest, id: number): Promise<void> => {
  const procurement = await Procurement.findByPk(id, {
    attributes: ['id', 'receiving_department_id', 'created_by'],
  });
  if (!procurement) throw new NotFoundError('Không tìm thấy phiếu mua sắm');

  if (req.user?.role === 'admin' || !req.permissionScope || req.permissionScope === 'all') {
    return;
  }
  if (
    req.permissionScope === 'department' &&
    Number(procurement.receiving_department_id) !== Number(req.user?.department_id)
  ) {
    throw new ForbiddenError('Chỉ được thao tác trên phiếu thuộc đơn vị của mình');
  }
  if (req.permissionScope === 'own' && procurement.created_by !== req.user?.id) {
    throw new ForbiddenError('Chỉ được thao tác trên phiếu do mình tạo');
  }
};

class ProcurementsController {
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await procurementService.getAll(applyProcurementScope(req, req.query));
      return res.json({ success: true, data: result.data, pagination: result.pagination });
    } catch (e) {
      next(e);
    }
  }

  async getYearlySummary(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await procurementService.getYearlySummary(applyProcurementScope(req, req.query));
      return res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  }

  async exportExcel(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const buffer = await procurementExportService.exportProcurementsToExcel(
        applyProcurementScope(req, req.query),
      );
      
      const filename = `Tong_Hop_Mua_Sam_${req.query.year || 'All'}.xlsx`;
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      return res.send(buffer);
    } catch (e) {
      next(e);
    }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      await assertProcurementScope(req, id);
      const data = await procurementService.getById(id);
      return res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const payload = { ...req.body };
      if (
        (req.permissionScope === 'department' || req.permissionScope === 'own') &&
        req.user?.department_id
      ) {
        payload.receiving_department_id = req.user.department_id;
      }
      const data = await procurementService.create(payload, userId);
      return res.status(201).json({ success: true, message: 'Tạo phiếu mua sắm/cấp phát thành công', data });
    } catch (e) {
      next(e);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      await assertProcurementScope(req, id);
      const data = await procurementService.update(id, req.body);
      return res.json({ success: true, message: 'Cập nhật phiếu mua sắm/cấp phát thành công', data });
    } catch (e) {
      next(e);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      await assertProcurementScope(req, id);
      await procurementService.delete(id);
      return res.json({ success: true, message: 'Xóa phiếu thành công' });
    } catch (e) {
      next(e);
    }
  }

  async fulfill(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      await assertProcurementScope(req, id);
      const userId = req.user!.id;
      const result = await procurementService.fulfill(id, userId, req.body);
      return res.json({
        success: true,
        message: 'Đã hoàn tất và tạo tài sản thành công',
        data: result,
      });
    } catch (e) {
      next(e);
    }
  }

  async createFromMaintenance(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const maintenanceId = parseInt(req.params.maintenanceId);
      const userId = req.user!.id;
      const procurement = await procurementService.createFromMaintenance(maintenanceId, userId);
      return res.status(201).json({
        success: true,
        message: 'Đã tạo phiếu Tăng tài sản từ đề nghị mua sắm',
        data: procurement,
      });
    } catch (e) {
      next(e);
    }
  }
}

export default new ProcurementsController();

