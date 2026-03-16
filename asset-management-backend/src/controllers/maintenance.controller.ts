import { Request, Response, NextFunction } from 'express';
import maintenanceService from '../services/maintenance.service';
import { AuthRequest } from '../middleware/auth.middleware';
import logger from '../utils/logger';

class MaintenanceController {
  async getAllMaintenance(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const result = await maintenanceService.getMaintenanceRequestsByRole(req.query, {
        id: user.id,
        role: user.role as any,
        department_id: user.department_id,
        fullname: user.fullname,
        email: user.email,
      });

      return res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  async getMaintenanceById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const maintenance = await maintenanceService.getMaintenanceById(id);

      // Convert to plain object - damageImages relationship is already loaded
      const maintenanceData = maintenance.toJSON();

      return res.json({
        success: true,
        data: maintenanceData,
      });
    } catch (error) {
      next(error);
    }
  }

  async createMaintenance(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      
      // Chỉ cán bộ (staff) mới được tạo yêu cầu sửa chữa
      if (user.role !== 'staff') {
        return res.status(403).json({
          success: false,
          message: 'Chỉ cán bộ mới được tạo yêu cầu sửa chữa. Trưởng đơn vị chỉ có thể xem và phê duyệt.',
        });
      }
      
      const userId = user.id;
      
      // CRITICAL: Log detailed info about damage_images in request
      const damageImagesInBody = req.body.damage_images;
      const damageImagesType = typeof damageImagesInBody;
      const diagnosticInfo = {
        type: damageImagesType,
        hasValue: !!damageImagesInBody,
        length: damageImagesInBody ? (typeof damageImagesInBody === 'string' ? damageImagesInBody.length : 'N/A') : 0,
        isArray: Array.isArray(damageImagesInBody),
      };
      
      logger.info('📝 [Controller] Creating maintenance request', {
        userId,
        userRole: user.role,
        requestType: req.body.request_type,
        diagnostics: diagnosticInfo,
        bodyKeys: Object.keys(req.body),
      });
      
      if (damageImagesInBody && typeof damageImagesInBody === 'string' && damageImagesInBody.startsWith('[')) {
        try {
          const parsed = JSON.parse(damageImagesInBody);
          logger.info(`✅ [Controller] Successfully parsed damage_images JSON. Count: ${Array.isArray(parsed) ? parsed.length : 'not an array'}`);
        } catch (e) {
          logger.error('❌ [Controller] Failed to parse damage_images JSON string despite starting with [');
        }
      }
      
      const maintenance = await maintenanceService.createMaintenance(req.body, userId);

      // Convert to plain object - damageImages relationship is already loaded
      const maintenanceData = maintenance.toJSON();

      return res.status(201).json({
        success: true,
        message: 'Maintenance request created successfully',
        data: maintenanceData,
      });
    } catch (error: any) {
      logger.error('❌ Error creating maintenance', {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
      next(error);
    }
  }

  async updateMaintenance(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const id = parseInt(req.params.id);
      
      // Chỉ cán bộ (staff) mới được sửa yêu cầu sửa chữa
      if (user.role !== 'staff') {
        return res.status(403).json({
          success: false,
          message: 'Chỉ cán bộ mới được sửa yêu cầu sửa chữa. Trưởng đơn vị chỉ có thể xem và phê duyệt.',
        });
      }
      
      const maintenance = await maintenanceService.updateMaintenance(id, req.body, {
        id: user.id,
        role: user.role as any,
        fullname: user.fullname,
        email: user.email,
        department_id: user.department_id,
      });

      // Convert to plain object - damageImages relationship is already loaded
      const maintenanceData = maintenance.toJSON();

      return res.json({
        success: true,
        message: 'Maintenance request updated successfully',
        data: maintenanceData,
      });
    } catch (error) {
      next(error);
    }
  }

  async approveMaintenance(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user!.id;
      const { assigned_to } = req.body;
      const maintenance = await maintenanceService.approveMaintenance(id, userId, assigned_to);

      return res.json({
        success: true,
        message: 'Maintenance request approved successfully',
        data: maintenance,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /maintenance/:id/approve
   * Multi-level approval using processApproval logic
   * Body: { notes?: string, assigned_to?: number }
   */
  async approveMaintenancePut(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const user = req.user!;
      const { notes, assigned_to, estimated_cost } = req.body;

      // Use processApproval with decision='approved'
      const maintenance = await maintenanceService.processApproval(
        id,
        {
          id: user.id,
          role: user.role as any,
          fullname: user.fullname,
          email: user.email,
          department_id: user.department_id,
        },
        { decision: 'approved', notes, assigned_to, estimated_cost }
      );

      return res.json({
        success: true,
        message: 'Yêu cầu đã được phê duyệt thành công',
        data: maintenance,
      });
    } catch (error) {
      next(error);
    }
  }

  async rejectMaintenance(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user!.id;
      const { notes } = req.body;
      const maintenance = await maintenanceService.rejectMaintenance(id, userId, notes);

      return res.json({
        success: true,
        message: 'Maintenance request rejected successfully',
        data: maintenance,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Multi-level approval for maintenance requests
   * POST /maintenance/:id/process-approval
   * Body: { decision: 'approved' | 'rejected', reason?: string, notes?: string }
   */
  async processApproval(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const user = req.user!;
      const { decision, reason, notes, assigned_to } = req.body;

      const maintenance = await maintenanceService.processApproval(
        id,
        {
          id: user.id,
          role: user.role as any,
          fullname: user.fullname,
          email: user.email,
          department_id: user.department_id,
        },
        { decision, reason, notes, assigned_to }
      );

      const message = decision === 'approved'
        ? 'Yêu cầu đã được phê duyệt thành công'
        : 'Yêu cầu đã bị từ chối';

      return res.json({
        success: true,
        message,
        data: maintenance,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get approval history (audit trail) for a maintenance request
   * GET /maintenance/:id/approval-history
   */
  async getApprovalHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const history = await maintenanceService.getApprovalHistory(id);

      return res.json({
        success: true,
        data: history,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get pending counts by approval level
   * GET /maintenance/pending-counts
   */
  async getPendingCounts(req: Request, res: Response, next: NextFunction) {
    try {
      const counts = await maintenanceService.getPendingCountByLevel();

      return res.json({
        success: true,
        data: counts,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Submit maintenance request for approval
   * POST /maintenance/:id/submit
   * Chuyển từ draft/new sang pending để gửi lên trưởng phòng phê duyệt
   */
  async submitForApproval(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const user = req.user!;
      const userId = user.id;

      console.log('📤 Submitting maintenance request for approval:', {
        requestId: id,
        userId,
        userRole: user.role,
        username: user.username,
      });

      const maintenance = await maintenanceService.submitForApproval(
        id, 
        userId,
        {
          id: user.id,
          role: user.role as any,
          fullname: user.fullname,
          email: user.email,
          department_id: user.department_id,
        }
      );

      console.log('✅ Successfully submitted for approval:', {
        requestId: id,
        newStatus: maintenance.status,
      });

      return res.json({
        success: true,
        message: 'Yêu cầu đã được gửi phê duyệt thành công',
        data: maintenance,
      });
    } catch (error: any) {
      console.error('❌ Error submitting for approval:', {
        requestId: req.params.id,
        userId: req.user?.id,
        error: error.message,
        errorName: error.name,
        stack: error.stack,
        original: error.original,
        validationErrors: error.errors,
      });
      next(error);
    }
  }

  /**
   * Hoàn tất mua sắm/cấp phát: tạo tài sản tự động và gán về phòng ban nhận
   * POST /maintenance/:id/fulfill-procurement
   */
  async fulfillProcurement(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const user = req.user!;

      const result = await maintenanceService.fulfillProcurement(
        id,
        {
          id: user.id,
          role: user.role as any,
          fullname: user.fullname,
          email: user.email,
          department_id: user.department_id,
        },
        req.body
      );

      return res.json({
        success: true,
        message: 'Đã hoàn tất mua sắm và tạo tài sản thành công',
        data: {
          maintenance: result.maintenance,
          created_assets: result.created_assets,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteMaintenance(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const id = parseInt(req.params.id);
      
      // Chỉ cán bộ (staff) mới được xóa yêu cầu sửa chữa
      if (user.role !== 'staff') {
        return res.status(403).json({
          success: false,
          message: 'Chỉ cán bộ mới được xóa yêu cầu sửa chữa. Trưởng đơn vị chỉ có thể xem và phê duyệt.',
        });
      }
      
      await maintenanceService.deleteMaintenance(id, {
        id: user.id,
        role: user.role as any,
        fullname: user.fullname,
        email: user.email,
        department_id: user.department_id,
      });

      return res.json({
        success: true,
        message: 'Yêu cầu đã được xóa thành công',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /maintenance/:id/start-repair
   * Admin bắt đầu thực hiện sửa chữa: approved_by_director → in_progress
   */
  async startRepair(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const user = req.user!;
      const maintenance = await maintenanceService.startRepair(id, {
        id: user.id,
        role: user.role as any,
        fullname: user.fullname,
        email: user.email,
        department_id: user.department_id,
      });
      return res.json({
        success: true,
        message: 'Đã bắt đầu thực hiện sửa chữa',
        data: maintenance,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /maintenance/:id/complete-repair
   * Admin xác nhận hoàn thành sửa chữa: in_progress → repair_completed
   */
  async completeRepair(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const user = req.user!;
      const { notes } = req.body;
      const maintenance = await maintenanceService.completeRepair(id, {
        id: user.id,
        role: user.role as any,
        fullname: user.fullname,
        email: user.email,
        department_id: user.department_id,
      }, notes);
      return res.json({
        success: true,
        message: 'Đã đánh dấu hoàn thành sửa chữa. Chờ Admin xác nhận.',
        data: maintenance,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new MaintenanceController();
