import { Request, Response, NextFunction } from 'express';
import reportService from '../services/report.service';
import { AuthRequest } from '../middleware/auth.middleware';

class ReportsController {
  async getAllReports(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const viewer = req.user
        ? { role: req.user.role, department_id: req.user.department_id }
        : undefined;
      const result = await reportService.getAllReports(req.query, viewer);

      return res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  async getReportById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const data = await reportService.getReportDetailPayload(id);

      return res.json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async createReport(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const report = await reportService.createReport(req.body, userId);

      return res.status(201).json({
        success: true,
        message: 'Report created successfully',
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateReport(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const report = await reportService.updateReport(id, req.body);

      return res.json({
        success: true,
        message: 'Report updated successfully',
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }

  async submitReport(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user!.id;
      const report = await reportService.submitReport(id, userId);

      return res.json({
        success: true,
        message: 'Report submitted successfully',
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }

  async approveReport(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user!.id;
      const report = await reportService.approveReport(id, userId);

      return res.json({
        success: true,
        message: 'Report approved successfully',
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }

  async bulkApproveReports(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const raw = req.body?.ids;
      const ids = Array.isArray(raw) ? raw.map((x: unknown) => Number(x)).filter((n) => Number.isFinite(n) && n > 0) : [];
      if (ids.length === 0) {
        return res.status(400).json({ success: false, message: 'Danh sách ids không hợp lệ' });
      }
      const userId = req.user!.id;
      const summary = await reportService.bulkApproveReports(ids, userId);
      return res.json({
        success: true,
        message: 'Xử lý duyệt hàng loạt hoàn tất',
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  }

  async rejectReport(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user!.id;
      const { notes } = req.body;
      const report = await reportService.rejectReport(id, userId, notes);

      return res.json({
        success: true,
        message: 'Report rejected successfully',
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteReport(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      await reportService.deleteReport(id);

      return res.json({
        success: true,
        message: 'Report deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async getStatistics(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await reportService.getStatistics(req.query);

      return res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  async getProcurementSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await reportService.getProcurementSummary(req.query);
      return res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

}


export default new ReportsController();
