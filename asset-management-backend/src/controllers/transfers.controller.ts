import { Request, Response, NextFunction } from 'express';
import transferService from '../services/transfer.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { assertSignature, recordSignature } from '../services/signature.service';

class TransfersController {
  async getAllTransfers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const result = await transferService.getTransfersByRole(req.query, {
        id: user.id,
        role: user.role as any,
        department_id: user.department_id,
        fullname: user.fullname,
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

  async getTransferById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const transfer = await transferService.getTransferById(id);

      return res.json({
        success: true,
        data: transfer,
      });
    } catch (error) {
      next(error);
    }
  }

  async createTransfer(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user!;

      // Bắt buộc chữ ký số của người tạo đề nghị điều chuyển
      const signatureImage = assertSignature(req.body?.signature);

      const transfer = await transferService.createTransfer(req.body, {
        id: user.id,
        role: user.role as any,
        department_id: user.department_id,
      });

      await recordSignature({
        entityType: 'asset_transfer',
        entityId: transfer.id,
        action: 'create',
        signerId: user.id,
        signerName: user.fullname || user.username || `user#${user.id}`,
        signerRole: user.role,
        signatureImage,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] as string | undefined,
      });

      return res.status(201).json({
        success: true,
        message: 'Transfer request created successfully',
        data: transfer,
      });
    } catch (error) {
      next(error);
    }
  }

  async approveTransfer(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const user = req.user!;

      // Bắt buộc chữ ký số; dùng chung luồng duyệt nhiều bước để không bỏ qua đơn vị nhận.
      const signatureImage = assertSignature(req.body?.signature);
      const before = await transferService.getTransferById(id);
      const statusBefore = (before as any)?.status as string | undefined;

      const transfer = await transferService.processTransferApproval(
        id,
        {
          id: user.id,
          role: user.role as any,
          fullname: user.fullname,
          department_id: user.department_id,
        },
        { decision: 'approved' },
      );

      await recordSignature({
        entityType: 'asset_transfer',
        entityId: id,
        action: statusBefore === 'approved_by_head' ? 'receive'
          : statusBefore === 'approved_by_destination' ? 'approve' : 'approve_source',
        signerId: user.id,
        signerName: user.fullname || user.username || `user#${user.id}`,
        signerRole: user.role,
        signatureImage,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] as string | undefined,
      });

      return res.json({
        success: true,
        message: 'Transfer approved successfully',
        data: transfer,
      });
    } catch (error) {
      next(error);
    }
  }

  async rejectTransfer(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const user = req.user!;
      const { notes, reason } = req.body;

      const signatureImage = assertSignature(req.body?.signature);

      const transfer = await transferService.processTransferApproval(
        id,
        {
          id: user.id,
          role: user.role as any,
          fullname: user.fullname,
          department_id: user.department_id,
        },
        { decision: 'rejected', reason: notes || reason },
      );

      await recordSignature({
        entityType: 'asset_transfer',
        entityId: id,
        action: 'reject',
        signerId: user.id,
        signerName: user.fullname || user.username || `user#${user.id}`,
        signerRole: user.role,
        signatureImage,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] as string | undefined,
      });

      return res.json({
        success: true,
        message: 'Transfer rejected successfully',
        data: transfer,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Multi-level approval for transfer requests
   * POST /transfers/:id/process-approval
   * Body: { decision: 'approved' | 'rejected', reason?: string, notes?: string }
   */
  async processApproval(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const user = req.user!;
      const { decision, reason, notes } = req.body;

      // Bắt buộc chữ ký số ở mọi bước duyệt/từ chối điều chuyển.
      const signatureImage = assertSignature(req.body?.signature);
      const before = await transferService.getTransferById(id);
      const statusBefore = (before as any)?.status as string | undefined;

      const transfer = await transferService.processTransferApproval(
        id,
        {
          id: user.id,
          role: user.role as any,
          fullname: user.fullname,
          department_id: user.department_id,
        },
        { decision, reason, notes }
      );

      const signatureAction = decision === 'rejected'
        ? 'reject'
        : statusBefore === 'approved_by_head'
          ? 'receive'
          : statusBefore === 'approved_by_destination'
            ? 'approve'
            : 'approve_source';

      await recordSignature({
        entityType: 'asset_transfer',
        entityId: id,
        action: signatureAction,
        signerId: user.id,
        signerName: user.fullname || user.username || `user#${user.id}`,
        signerRole: user.role,
        signatureImage,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] as string | undefined,
      });

      const message = decision === 'approved'
        ? 'Yêu cầu điều chuyển đã được phê duyệt thành công'
        : 'Yêu cầu điều chuyển đã bị từ chối';

      return res.json({
        success: true,
        message,
        data: transfer,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get approval history (audit trail) for a transfer request
   * GET /transfers/:id/approval-history
   */
  async getApprovalHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const history = await transferService.getTransferApprovalHistory(id);

      return res.json({
        success: true,
        data: history,
      });
    } catch (error) {
      next(error);
    }
  }

  async getTransferHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const assetId = parseInt(req.params.assetId);
      const history = await transferService.getTransferHistory(assetId);

      return res.json({
        success: true,
        data: history,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new TransfersController();
