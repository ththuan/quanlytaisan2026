import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import maintenanceService from '../services/maintenance.service';
import { AuthRequest } from '../middleware/auth.middleware';
import logger from '../utils/logger';
import { Asset, MaintenanceRequest } from '../models';
import { assertSignature, recordSignature } from '../services/signature.service';

const recordMaintenanceSignature = async (req: AuthRequest, maintenanceId: number, action: 'submit' | 'approve' | 'reject' | 'complete', signatureImage: string) => {
  const user = req.user!;
  await recordSignature({
    entityType: 'maintenance_request',
    entityId: maintenanceId,
    action,
    signerId: user.id,
    signerName: user.fullname || user.username || `user#${user.id}`,
    signerRole: user.role,
    signatureImage,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'] as string | undefined,
  });
};

const assertMaintenanceScope = async (req: AuthRequest, id: number): Promise<void> => {
  const maintenance = await MaintenanceRequest.findByPk(id, {
    attributes: ['id', 'department_id', 'requested_by'],
  });
  if (!maintenance) {
    const { NotFoundError } = await import('../utils/errorHandler');
    throw new NotFoundError('Không tìm thấy yêu cầu sửa chữa');
  }

  const user = req.user!;
  if (user.role === 'admin' || !req.permissionScope || req.permissionScope === 'all') {
    return;
  }
  if (
    req.permissionScope === 'department' &&
    Number(maintenance.department_id) !== Number(user.department_id)
  ) {
    const { ForbiddenError } = await import('../utils/errorHandler');
    throw new ForbiddenError('Chỉ được thao tác trên yêu cầu thuộc đơn vị của mình');
  }
  if (req.permissionScope === 'own' && maintenance.requested_by !== user.id) {
    const { ForbiddenError } = await import('../utils/errorHandler');
    throw new ForbiddenError('Chỉ được thao tác trên yêu cầu do mình tạo');
  }
};

const requiresRepairSignature = async (maintenanceId: number): Promise<boolean> => {
  const request = await MaintenanceRequest.findByPk(maintenanceId, { attributes: ['id', 'request_type'] });
  return request?.request_type === 'repair';
};

class MaintenanceController {
  async getAllMaintenance(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const result = await maintenanceService.getMaintenanceRequestsByRole(req.query, {
        id: user.id,
        role: user.role as any,
        department_id: user.department_id,
        fullname: user.fullname,
        permission_scope: req.permissionScope,
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

  async getMaintenanceById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      await assertMaintenanceScope(req, id);
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
      
      const requestedDepartmentId = Number(req.body.department_id) || undefined;

      // Admin manages procurement centrally and chooses the receiving unit in
      // the request form. Other roles must still belong to a department.
      if (user.role === 'admin' || req.permissionScope === 'all') {
        if (!requestedDepartmentId) {
          return res.status(400).json({
            success: false,
            message: 'Vui lÃ²ng chá»n Ä‘Æ¡n vá»‹ sá»­ dá»¥ng trá»±c tiáº¿p.',
          });
        }
        req.body.department_id = requestedDepartmentId;
      } else if (!user.department_id) {
        return res.status(400).json({
          success: false,
          message: 'Báº¡n chÆ°a Ä‘Æ°á»£c phÃ¢n cÃ´ng vÃ o Ä‘Æ¡n vá»‹ nÃ o.',
        });
      } else {
        // Prevent non-admin users from creating requests for another unit.
        req.body.department_id = user.department_id;
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
      
      logger.info('ðŸ“ [Controller] Creating maintenance request', {
        userId,
        userRole: user.role,
        requestType: req.body.request_type,
        diagnostics: diagnosticInfo,
        bodyKeys: Object.keys(req.body),
      });
      
      if (damageImagesInBody && typeof damageImagesInBody === 'string' && damageImagesInBody.startsWith('[')) {
        try {
          const parsed = JSON.parse(damageImagesInBody);
          logger.info(`âœ… [Controller] Successfully parsed damage_images JSON. Count: ${Array.isArray(parsed) ? parsed.length : 'not an array'}`);
        } catch (e) {
          logger.error('âŒ [Controller] Failed to parse damage_images JSON string despite starting with [');
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
      logger.error('âŒ Error creating maintenance', {
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
      await assertMaintenanceScope(req, id);

      if (user.role !== 'admin' && !user.department_id) {
        return res.status(400).json({
          success: false,
          message: 'Báº¡n chÆ°a Ä‘Æ°á»£c phÃ¢n cÃ´ng vÃ o Ä‘Æ¡n vá»‹ nÃ o.',
        });
      }

      const maintenance = await maintenanceService.updateMaintenance(id, req.body, {
        id: user.id,
        role: user.role as any,
        fullname: user.fullname,
        permission_scope: req.permissionScope,
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
      const requiresSignature = await requiresRepairSignature(id);
      const signatureImage = requiresSignature ? assertSignature(req.body?.signature) : '';
      const { assigned_to } = req.body;
      const maintenance = await maintenanceService.approveMaintenance(id, userId, assigned_to);
      if (requiresSignature) await recordMaintenanceSignature(req, id, 'approve', signatureImage);

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
      const requiresSignature = await requiresRepairSignature(id);
      const signatureImage = requiresSignature ? assertSignature(req.body?.signature) : '';
      const { notes, assigned_to, estimated_cost } = req.body;

      // Use processApproval with decision='approved'
      const maintenance = await maintenanceService.processApproval(
        id,
        {
          id: user.id,
          role: user.role as any,
          fullname: user.fullname,
        permission_scope: req.permissionScope,
          department_id: user.department_id,
        },
        { decision: 'approved', notes, assigned_to, estimated_cost }
      );

      if (requiresSignature) await recordMaintenanceSignature(req, id, 'approve', signatureImage);

      return res.json({
        success: true,
        message: 'YÃªu cáº§u Ä‘Ã£ Ä‘Æ°á»£c phÃª duyá»‡t thÃ nh cÃ´ng',
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
      const requiresSignature = await requiresRepairSignature(id);
      const signatureImage = requiresSignature ? assertSignature(req.body?.signature) : '';
      const { notes } = req.body;
      const maintenance = await maintenanceService.rejectMaintenance(id, userId, notes);
      if (requiresSignature) await recordMaintenanceSignature(req, id, 'reject', signatureImage);

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
      const requiresSignature = await requiresRepairSignature(id);
      const signatureImage = requiresSignature ? assertSignature(req.body?.signature) : '';
      const { decision, reason, notes, assigned_to } = req.body;

      const maintenance = await maintenanceService.processApproval(
        id,
        {
          id: user.id,
          role: user.role as any,
          fullname: user.fullname,
        permission_scope: req.permissionScope,
          department_id: user.department_id,
        },
        { decision, reason, notes, assigned_to }
      );

      if (requiresSignature) {
        await recordMaintenanceSignature(req, id, decision === 'approved' ? 'approve' : 'reject', signatureImage);
      }

      const message = decision === 'approved'
        ? 'YÃªu cáº§u Ä‘Ã£ Ä‘Æ°á»£c phÃª duyá»‡t thÃ nh cÃ´ng'
        : 'YÃªu cáº§u Ä‘Ã£ bá»‹ tá»« chá»‘i';

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
  async getApprovalHistory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      await assertMaintenanceScope(req, id);
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
   * Chuyá»ƒn tá»« draft/new sang pending Ä‘á»ƒ gá»­i lÃªn trÆ°á»Ÿng phÃ²ng phÃª duyá»‡t
   */
  async submitForApproval(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      await assertMaintenanceScope(req, id);
      const user = req.user!;
      const userId = user.id;
      const requiresSignature = await requiresRepairSignature(id);
      const signatureImage = requiresSignature ? assertSignature(req.body?.signature) : '';

      console.log('ðŸ“¤ Submitting maintenance request for approval:', {
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
        permission_scope: req.permissionScope,
          department_id: user.department_id,
        }
      );

      if (requiresSignature) await recordMaintenanceSignature(req, id, 'submit', signatureImage);

      console.log('âœ… Successfully submitted for approval:', {
        requestId: id,
        newStatus: maintenance.status,
      });

      return res.json({
        success: true,
        message: 'YÃªu cáº§u Ä‘Ã£ Ä‘Æ°á»£c gá»­i phÃª duyá»‡t thÃ nh cÃ´ng',
        data: maintenance,
      });
    } catch (error: any) {
      console.error('âŒ Error submitting for approval:', {
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

  /* Tạo tài sản từ yêu cầu mua sắm đã duyệt. */
  async fulfillProcurement(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      await assertMaintenanceScope(req, id);
      const user = req.user!;

      const result = await maintenanceService.fulfillProcurement(
        id,
        {
          id: user.id,
          role: user.role as any,
          fullname: user.fullname,
        permission_scope: req.permissionScope,
          department_id: user.department_id,
        },
        req.body
      );

      return res.json({
        success: true,
        message: 'ÄÃ£ hoÃ n táº¥t mua sáº¯m vÃ  táº¡o tÃ i sáº£n thÃ nh cÃ´ng',
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
      await assertMaintenanceScope(req, id);

      if (user.role !== 'admin' && !user.department_id) {
        return res.status(400).json({
          success: false,
          message: 'Báº¡n chÆ°a Ä‘Æ°á»£c phÃ¢n cÃ´ng vÃ o Ä‘Æ¡n vá»‹ nÃ o.',
        });
      }

      await maintenanceService.deleteMaintenance(id, {
        id: user.id,
        role: user.role as any,
        fullname: user.fullname,
        permission_scope: req.permissionScope,
        department_id: user.department_id,
      });

      return res.json({
        success: true,
        message: 'YÃªu cáº§u Ä‘Ã£ Ä‘Æ°á»£c xÃ³a thÃ nh cÃ´ng',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /maintenance/:id/start-repair
   * Admin báº¯t Ä‘áº§u thá»±c hiá»‡n sá»­a chá»¯a: approved_by_director â†’ in_progress
   */
  async startRepair(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      await assertMaintenanceScope(req, id);
      const user = req.user!;
      const maintenance = await maintenanceService.startRepair(id, {
        id: user.id,
        role: user.role as any,
        fullname: user.fullname,
        permission_scope: req.permissionScope,
        department_id: user.department_id,
      });
      return res.json({
        success: true,
        message: 'ÄÃ£ báº¯t Ä‘áº§u thá»±c hiá»‡n sá»­a chá»¯a',
        data: maintenance,
      });
    } catch (error) {
      next(error);
    }
  }

  /* Xác nhận hoàn thành sửa chữa. */
  async completeRepair(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      await assertMaintenanceScope(req, id);
      const user = req.user!;
      const { notes } = req.body;
      const maintenance = await maintenanceService.completeRepair(id, {
        id: user.id,
        role: user.role as any,
        fullname: user.fullname,
        permission_scope: req.permissionScope,
        department_id: user.department_id,
      }, notes);
      return res.json({
        success: true,
        message: 'ÄÃ£ Ä‘Ã¡nh dáº¥u hoÃ n thÃ nh sá»­a chá»¯a. Chá» Admin xÃ¡c nháº­n.',
        data: maintenance,
      });
    } catch (error) {
      next(error);
    }
  }

  /* Báo hỏng tài sản nhanh. */
  async reportDamage(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const signatureImage = assertSignature(req.body?.signature);
      const assetId = Number(req.body.asset_id);
      const description = String(req.body.description || '').trim();
      const urgency = ['low', 'normal', 'high', 'critical'].includes(req.body.urgency)
        ? req.body.urgency
        : 'normal';

      if (!assetId || !description) {
        return res.status(400).json({
          success: false,
          message: 'Vui lÃ²ng chá»n tÃ i sáº£n vÃ  mÃ´ táº£ tÃ¬nh tráº¡ng há»ng',
        });
      }

      if (description.length < 5) {
        return res.status(400).json({
          success: false,
          message: 'MÃ´ táº£ tÃ¬nh tráº¡ng cáº§n chi tiáº¿t hÆ¡n',
        });
      }

      const asset = await Asset.findByPk(assetId);
      if (!asset) {
        return res.status(404).json({
          success: false,
          message: 'KhÃ´ng tÃ¬m tháº¥y tÃ i sáº£n',
        });
      }

      if ((asset as any).status !== 'active') {
        return res.status(409).json({
          success: false,
          message: 'TÃ i sáº£n khÃ´ng á»Ÿ tráº¡ng thÃ¡i Ä‘ang sá»­ dá»¥ng, khÃ´ng thá»ƒ gá»­i bÃ¡o há»ng',
        });
      }

      if (user.role === 'director') {
        return res.status(403).json({
          success: false,
          message: 'GiÃ¡m hiá»‡u chá»‰ cÃ³ quyá»n xem, khÃ´ng thá»±c hiá»‡n bÃ¡o há»ng',
        });
      }

      if (user.role !== 'admin') {
        const assetDepartmentId = Number((asset as any).current_department_id);
        if (!user.department_id || assetDepartmentId !== Number(user.department_id)) {
          return res.status(403).json({
            success: false,
            message: 'Chá»‰ Ä‘Æ°á»£c bÃ¡o há»ng tÃ i sáº£n thuá»™c Ä‘Æ¡n vá»‹ cá»§a báº¡n',
          });
        }
      }

      const existing = await MaintenanceRequest.findOne({
        where: {
          asset_id: assetId,
          request_type: 'repair',
          status: {
            [Op.in]: ['new', 'pending', 'approved_by_head', 'approved_by_admin', 'in_progress', 'repair_completed'],
          },
        },
      });

      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'TÃ i sáº£n Ä‘ang cÃ³ yÃªu cáº§u sá»­a chá»¯a chá» xá»­ lÃ½',
        });
      }

      const maintenance = await maintenanceService.createMaintenance(
        {
          request_type: 'repair',
          asset_id: assetId,
          department_id: (asset as any).current_department_id || user.department_id,
          description,
          justification: String(req.body.justification || description),
          urgency,
          status: 'new',
          damage_images: req.body.damage_images,
        } as any,
        user.id
      );

      await recordMaintenanceSignature(req, maintenance.id, 'submit', signatureImage);

      return res.status(201).json({
        success: true,
        message: 'ÄÃ£ gá»­i bÃ¡o há»ng. Quáº£n trá»‹ viÃªn sáº½ xem xÃ©t vÃ  phÃª duyá»‡t.',
        data: maintenance,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new MaintenanceController();
