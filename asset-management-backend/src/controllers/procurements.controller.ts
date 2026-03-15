import { Request, Response, NextFunction } from 'express';
import procurementService from '../services/procurement.service';
import procurementExportService from '../services/procurementExport.service';
import { AuthRequest } from '../middleware/auth.middleware';

class ProcurementsController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await procurementService.getAll(req.query);
      return res.json({ success: true, data: result.data, pagination: result.pagination });
    } catch (e) {
      next(e);
    }
  }

  async getYearlySummary(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await procurementService.getYearlySummary(req.query);
      return res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  }

  async exportExcel(req: Request, res: Response, next: NextFunction) {
    try {
      const buffer = await procurementExportService.exportProcurementsToExcel(req.query);
      
      const filename = `Tong_Hop_Mua_Sam_${req.query.year || 'All'}.xlsx`;
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      return res.send(buffer);
    } catch (e) {
      next(e);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const data = await procurementService.getById(id);
      return res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const data = await procurementService.create(req.body, userId);
      return res.status(201).json({ success: true, message: 'Tạo phiếu mua sắm/cấp phát thành công', data });
    } catch (e) {
      next(e);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const data = await procurementService.update(id, req.body);
      return res.json({ success: true, message: 'Cập nhật phiếu mua sắm/cấp phát thành công', data });
    } catch (e) {
      next(e);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      await procurementService.delete(id);
      return res.json({ success: true, message: 'Xóa phiếu thành công' });
    } catch (e) {
      next(e);
    }
  }

  async fulfill(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
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

