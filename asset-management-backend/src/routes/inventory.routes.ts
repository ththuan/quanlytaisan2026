/**
 * Inventory Routes
 * API routes cho kiểm kê hàng năm
 */

import { Router } from 'express';
import * as inventoryController from '../controllers/inventory.controller';
import { authenticate, requireRoles } from '../middleware/auth.middleware';

const router = Router();

// Tất cả routes cần xác thực
router.use(authenticate);

// ==================== INVENTORY ROUND ROUTES ====================

// Lấy đợt kiểm kê đang hoạt động
router.get('/rounds/active', inventoryController.getActiveInventoryRound);

// Lấy tất cả đợt kiểm kê
router.get('/rounds', inventoryController.getAllInventoryRounds);

// Lấy chi tiết đợt kiểm kê
router.get('/rounds/:id', inventoryController.getInventoryRoundById);

// Tạo đợt kiểm kê mới (Admin only)
router.post('/rounds', requireRoles(['admin']), inventoryController.createInventoryRound);

// Hoàn tất đợt kiểm kê (Admin only)
router.post('/rounds/:id/complete', requireRoles(['admin']), inventoryController.completeInventoryRound);

// Gia hạn đợt kiểm kê (Admin only)
router.post('/rounds/:id/extend', requireRoles(['admin']), inventoryController.extendInventoryRound);

// ==================== INVENTORY REPORT ROUTES ====================

// Lấy danh sách tài sản cần kiểm kê trong phòng ban
router.get('/assets', inventoryController.getAssetsForInventory);

// Tìm tài sản theo mã (QR code/barcode)
router.get('/assets/by-code/:code', inventoryController.findAssetByCode);

// Lấy số báo cáo đang chờ duyệt
router.get('/reports/pending', inventoryController.getPendingReportsCount);

// Lấy danh sách báo cáo kiểm kê
router.get('/reports', inventoryController.getInventoryReports);

// Lấy chi tiết báo cáo kiểm kê
router.get('/reports/:id', inventoryController.getInventoryReportById);

// Tạo báo cáo kiểm kê mới
router.post('/reports', inventoryController.createInventoryReport);

// Thêm chi tiết kiểm kê vào báo cáo
router.post('/reports/:id/details', inventoryController.addInventoryDetail);

// Cập nhật chi tiết kiểm kê
router.patch('/reports/:id/details/:detailId', inventoryController.updateInventoryDetail);

// Nộp báo cáo kiểm kê
router.post('/reports/:id/submit', inventoryController.submitInventoryReport);

// Duyệt hoặc từ chối báo cáo kiểm kê (department_head hoặc admin)
router.post(
  '/reports/:id/approve',
  requireRoles(['department_head', 'admin']),
  inventoryController.processInventoryApproval
);

export default router;
