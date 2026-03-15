/**
 * Inventory Controller
 * API endpoints cho kiểm kê hàng năm
 */

import { Response, NextFunction } from 'express';
import InventoryService from '../services/inventory.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { ForbiddenError } from '../utils/errorHandler';
import Department from '../models/Department';

// ==================== INVENTORY ROUND (Đợt Kiểm Kê) ====================

/**
 * Tạo đợt kiểm kê mới (Admin only)
 */
export const createInventoryRound = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const round = await InventoryService.createInventoryRound(req.body, req.user!.id);
    res.status(201).json({
      success: true,
      message: 'Inventory round created successfully',
      data: round,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Lấy tất cả đợt kiểm kê
 */
export const getAllInventoryRounds = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await InventoryService.getAllInventoryRounds(req.query);
    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Lấy chi tiết đợt kiểm kê
 */
export const getInventoryRoundById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const round = await InventoryService.getInventoryRoundById(parseInt(req.params.id));
    res.json({
      success: true,
      data: round,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Lấy đợt kiểm kê đang hoạt động
 */
export const getActiveInventoryRound = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const round = await InventoryService.getActiveInventoryRound();
    res.json({
      success: true,
      data: round,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Hoàn tất đợt kiểm kê (Admin only)
 */
export const completeInventoryRound = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const round = await InventoryService.completeInventoryRound(parseInt(req.params.id));
    res.json({
      success: true,
      message: 'Inventory round completed successfully',
      data: round,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Gia hạn thời gian đợt kiểm kê (Admin only)
 */
export const extendInventoryRound = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { end_date } = req.body;
    const round = await InventoryService.extendInventoryRound(
      parseInt(req.params.id),
      end_date,
      req.user!.id
    );
    res.json({
      success: true,
      message: 'Gia hạn đợt kiểm kê thành công',
      data: round,
    });
  } catch (error) {
    next(error);
  }
};

// ==================== INVENTORY REPORT (Báo Cáo Kiểm Kê) ====================

/**
 * Tạo báo cáo kiểm kê
 */
export const createInventoryReport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { round_id } = req.body;
    const report = await InventoryService.createInventoryReport(
      round_id,
      req.user!.id,
      req.user!.department_id!
    );
    res.status(201).json({
      success: true,
      message: 'Inventory report created successfully',
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Lấy danh sách báo cáo kiểm kê theo vai trò
 */
export const getInventoryReports = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await InventoryService.getInventoryReportsByRole(
      req.user!.id,
      req.user!.role,
      req.user!.department_id!,
      req.query
    );
    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Lấy chi tiết báo cáo kiểm kê
 */
export const getInventoryReportById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const reportId = parseInt(req.params.id);
    const report: any = await InventoryService.getInventoryReportById(reportId);

    // Phân quyền xem chi tiết báo cáo:
    // - Admin & Giám hiệu (director): xem tất cả
    // - Trưởng đơn vị cha: xem báo cáo của phòng ban mình và các đơn vị con
    // - Cán bộ: chỉ xem báo cáo do mình tạo
    if (user.role !== 'admin' && user.role !== 'director') {
      if (user.role === 'department_head') {
        if (report.department_id !== user.department_id) {
          // Allow parent-dept head to view child-dept reports
          const reportDept = await Department.findByPk(report.department_id, {
            attributes: ['id', 'parent_department_id'],
          });
          if (!reportDept || (reportDept as any).parent_department_id !== user.department_id) {
            throw new ForbiddenError('Bạn chỉ được xem báo cáo kiểm kê của phòng ban mình và các đơn vị con');
          }
        }
      } else {
        if (report.created_by !== user.id) {
          throw new ForbiddenError('Bạn không có quyền xem báo cáo kiểm kê này');
        }
      }
    }

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Thêm chi tiết kiểm kê vào báo cáo
 */
export const addInventoryDetail = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const reportId = parseInt(req.params.id);
    const { asset_id, ...detailData } = req.body;
    
    const detail = await InventoryService.addInventoryDetail(reportId, asset_id, detailData);
    res.status(201).json({
      success: true,
      message: 'Inventory detail added successfully',
      data: detail,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cập nhật chi tiết kiểm kê
 */
export const updateInventoryDetail = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const detailId = parseInt(req.params.detailId);
    const detail = await InventoryService.updateInventoryDetail(detailId, req.body);
    res.json({
      success: true,
      message: 'Inventory detail updated successfully',
      data: detail,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Nộp báo cáo kiểm kê
 */
export const submitInventoryReport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const reportId = parseInt(req.params.id);
    const report = await InventoryService.submitInventoryReport(reportId, req.user!.id);
    res.json({
      success: true,
      message: 'Inventory report submitted successfully',
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Duyệt hoặc từ chối báo cáo kiểm kê
 */
export const processInventoryApproval = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const reportId = parseInt(req.params.id);
    // Support both payload formats:
    // - New: { decision: 'approved' | 'rejected', reason?, notes? }
    // - Legacy frontend: { approved: boolean, rejection_reason? }
    const { decision: _decision, reason: _reason, notes, repair_approved_asset_ids } = req.body as any;
    let decision = _decision;
    let reason = _reason;
    const { approved, rejection_reason } = req.body as any;

    if (!decision && typeof approved === 'boolean') {
      decision = approved ? 'approved' : 'rejected';
    }
    if (!reason && rejection_reason) {
      reason = rejection_reason;
    }

    const report = await InventoryService.processInventoryApproval(
      reportId,
      req.user!.id,
      req.user!.role,
      decision,
      reason,
      notes,
      req.user!.department_id ?? undefined,
      Array.isArray(repair_approved_asset_ids) ? repair_approved_asset_ids : undefined
    );

    const message = decision === 'approved' 
      ? 'Inventory report approved successfully' 
      : 'Inventory report rejected';

    res.json({
      success: true,
      message,
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Lấy danh sách tài sản cần kiểm kê trong phòng ban
 */
export const getAssetsForInventory = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const departmentId = req.user!.department_id!;
    const result = await InventoryService.getAssetsForInventory(departmentId, req.query);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Lấy số báo cáo đang chờ duyệt
 */
export const getPendingReportsCount = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await InventoryService.getPendingReportsByRole(
      req.user!.role,
      req.user!.department_id
    );
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Tìm tài sản theo mã (QR code/barcode) trong phòng ban
 */
export const findAssetByCode = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { code } = req.params;
    const departmentId = req.user!.department_id!;
    
    const asset = await InventoryService.findAssetByCode(code, departmentId);
    res.json({
      success: true,
      data: asset,
    });
  } catch (error) {
    next(error);
  }
};