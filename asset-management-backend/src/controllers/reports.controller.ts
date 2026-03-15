import { Request, Response, NextFunction } from 'express';
import reportService from '../services/report.service';
import { AuthRequest } from '../middleware/auth.middleware';

class ReportsController {
  async getAllReports(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await reportService.getAllReports(req.query);

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
      const report = await reportService.getReportById(id);

      return res.json({
        success: true,
        data: report,
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
