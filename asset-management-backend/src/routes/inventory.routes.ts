/**
 * Inventory Routes
 * API routes cho kiểm kê hàng năm
 */

import { Router } from 'express';
import multer from 'multer';
import * as inventoryController from '../controllers/inventory.controller';
import { authenticate } from '../middleware/auth.middleware';
import {
  requirePermission,
  allAuthenticatedRoles,
  adminOnlyRoles,
  departmentHeadOrAdminRoles,
} from '../middleware/authorization.middleware';
import { ALLOWED_IMAGE_MIME_TYPES } from '../constants/imageMime';
import { requireUnlockedRecord } from '../middleware/recordLock.middleware';
import { auditLog } from '../middleware/logging';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_IMAGE_MIME_TYPES.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Chỉ cho phép ảnh (JPEG, PNG, GIF, WebP, HEIC, AVIF, BMP, TIFF)') as any, false);
  },
});

// Tất cả routes cần xác thực
router.use(authenticate);

// ==================== INVENTORY ROUND ROUTES ====================

// Lấy đợt kiểm kê đang hoạt động
router.get('/rounds/active', requirePermission('inventory.view', allAuthenticatedRoles), inventoryController.getActiveInventoryRound);

// Lấy tất cả đợt kiểm kê
router.get('/rounds', requirePermission('inventory.view', allAuthenticatedRoles), inventoryController.getAllInventoryRounds);

// Lấy chi tiết đợt kiểm kê
router.get('/rounds/:id', requirePermission('inventory.view', allAuthenticatedRoles), inventoryController.getInventoryRoundById);

// Tạo đợt kiểm kê mới (Admin only)
router.post('/rounds', requirePermission('inventory.round.manage', adminOnlyRoles), auditLog('create'), inventoryController.createInventoryRound);

// Hoàn tất đợt kiểm kê (Admin only)
router.post('/rounds/:id/complete', requirePermission('inventory.round.manage', adminOnlyRoles), auditLog('update'), inventoryController.completeInventoryRound);

// Gia hạn đợt kiểm kê (Admin only)
router.post('/rounds/:id/extend', requirePermission('inventory.round.manage', adminOnlyRoles), auditLog('update'), inventoryController.extendInventoryRound);

// ==================== INVENTORY REPORT ROUTES ====================

// Lấy danh sách tài sản cần kiểm kê trong phòng ban
router.get('/assets', requirePermission('inventory.count', allAuthenticatedRoles), inventoryController.getAssetsForInventory);

// Tìm tài sản theo mã (QR code/barcode)
router.get('/assets/by-code/:code', requirePermission('inventory.count', allAuthenticatedRoles), inventoryController.findAssetByCode);

// Lấy số báo cáo đang chờ duyệt
router.get('/reports/pending', requirePermission('inventory.view', allAuthenticatedRoles), inventoryController.getPendingReportsCount);

// Upload ảnh hiện trạng kiểm kê (tài sản hoặc tổng thể)
router.post('/images', requirePermission('inventory.count', allAuthenticatedRoles), upload.single('image'), inventoryController.uploadInventoryImage);

// Lấy danh sách báo cáo kiểm kê
router.get('/reports', requirePermission('inventory.view', allAuthenticatedRoles), inventoryController.getInventoryReports);

// Lấy chi tiết báo cáo kiểm kê
router.get('/reports/:id', requirePermission('inventory.view', allAuthenticatedRoles), inventoryController.getInventoryReportById);

// Tạo báo cáo kiểm kê mới
router.post('/reports', requirePermission('inventory.count', allAuthenticatedRoles), auditLog('create'), inventoryController.createInventoryReport);

// Thêm chi tiết kiểm kê vào báo cáo
router.post('/reports/:id/details', requirePermission('inventory.count', allAuthenticatedRoles), requireUnlockedRecord('inventory_report'), auditLog('create'), inventoryController.addInventoryDetail);

// Thêm nhiều chi tiết kiểm kê trong một request (hàng loạt)
router.post('/reports/:id/details/bulk', requirePermission('inventory.count', allAuthenticatedRoles), requireUnlockedRecord('inventory_report'), auditLog('create'), inventoryController.addInventoryDetailsBulk);

// Xóa kết quả kiểm kê của cả nhóm công cụ dụng cụ để làm lại
router.delete('/reports/:id/details/group/:categoryId', requirePermission('inventory.count', allAuthenticatedRoles), requireUnlockedRecord('inventory_report'), auditLog('delete'), inventoryController.resetBatchGroupDetails);

// Cập nhật chi tiết kiểm kê
router.patch('/reports/:id/details/:detailId', requirePermission('inventory.count', allAuthenticatedRoles), requireUnlockedRecord('inventory_report'), auditLog('update'), inventoryController.updateInventoryDetail);

// Nộp báo cáo kiểm kê
router.post('/reports/:id/submit', requirePermission('inventory.submit', allAuthenticatedRoles), requireUnlockedRecord('inventory_report'), auditLog('approve'), inventoryController.submitInventoryReport);

// Cập nhật ảnh tổng thể của báo cáo/đơn vị
router.patch('/reports/:id/images', requirePermission('inventory.count', allAuthenticatedRoles), requireUnlockedRecord('inventory_report'), auditLog('update'), inventoryController.updateReportImages);

// Duyệt hoặc từ chối báo cáo kiểm kê (department_head hoặc admin)
router.post(
  '/reports/:id/approve',
  requirePermission('inventory.approve', departmentHeadOrAdminRoles),
  requireUnlockedRecord('inventory_report'),
  auditLog('approve'),
  inventoryController.processInventoryApproval
);

export default router;
