import { Request, Response } from 'express';
import assetDisposalService from '../services/assetDisposal.service';

class AssetDisposalController {
  async listCases(req: Request, res: Response) {
    const user = (req as any).user;
    const query = { ...req.query };

    // Staff/Head chỉ xem hồ sơ của phòng mình
    if (['staff', 'department_head'].includes(user?.role)) {
      query.origin_department_id = user?.department_id;
    }

    const result = await assetDisposalService.listCases(query);
    res.json(result);
  }

  async getCaseById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id, 10);
      const user = (req as any).user;
      const result = await assetDisposalService.getCaseById(id);

      // Check permission
      if (['staff', 'department_head'].includes(user?.role) && result.origin_department_id !== user?.department_id) {
        return res.status(403).json({ success: false, message: 'Bạn không có quyền xem hồ sơ này' });
      }

      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(err.statusCode ?? 404).json({ success: false, message: err.message });
    }
  }

  async completeCase(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id, 10);
      const userId = (req as any).user?.id;
      const result = await assetDisposalService.completeCase(id, userId, req.body);
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(err.statusCode ?? 400).json({ success: false, message: err.message });
    }
  }

  /**
   * POST /api/asset-disposals/manual
   * Tạo hồ sơ tiêu hủy hoặc thanh lý thủ công (không từ kiểm kê) theo Điều 23, 24 Quy chế.
   */
  async createManualCase(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const payload = { ...req.body };

      // Staff/Head chỉ được tạo cho phòng mình
      if (['staff', 'department_head'].includes(user?.role)) {
        payload.origin_department_id = user?.department_id;
      }

      const result = await assetDisposalService.createManualCase(user.id, payload);
      res.status(201).json({ success: true, data: result });
    } catch (err: any) {
      res.status(err.statusCode ?? 400).json({ success: false, message: err.message });
    }
  }

  /**
   * POST /api/asset-disposals/from-maintenance/:maintenanceId
   * Chuyển đề nghị sửa chữa sang hồ sơ thanh lý/tiêu hủy khi chi phí > giá trị tài sản.
   */
  async createFromMaintenance(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const maintenanceId = parseInt(req.params.maintenanceId, 10);
      const disposalType = req.body?.disposal_type ?? 'liquidation';
      const result = await assetDisposalService.createFromMaintenance(maintenanceId, userId, disposalType);
      res.status(201).json({ success: true, message: 'Đã tạo hồ sơ thanh lý/tiêu hủy từ đề nghị sửa chữa', data: result });
    } catch (err: any) {
      res.status(err.statusCode ?? 400).json({ success: false, message: err.message });
    }
  }
}

export default new AssetDisposalController();
