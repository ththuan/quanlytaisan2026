import { Router } from 'express';
import assetDisposalController from '../controllers/assetDisposal.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { requirePermission, adminOnlyRoles } from '../middleware/authorization.middleware';

const router = Router();

// Admin/Director handle disposal, Staff can view their department's cases
router.get('/', authenticateToken, requirePermission('disposal.view', adminOnlyRoles), (req, res) => assetDisposalController.listCases(req, res));
router.get('/:id', authenticateToken, requirePermission('disposal.view', adminOnlyRoles), (req, res) => assetDisposalController.getCaseById(req, res));
router.put('/:id', authenticateToken, requirePermission('disposal.update', adminOnlyRoles), (req, res) => assetDisposalController.updateCase(req, res));
router.delete('/:id', authenticateToken, requirePermission('disposal.delete', adminOnlyRoles), (req, res) => assetDisposalController.deleteCase(req, res));
router.post('/:id/complete', authenticateToken, requirePermission('disposal.complete', adminOnlyRoles), (req, res) => assetDisposalController.completeCase(req, res));

// POST /manual – Tạo hồ sơ tiêu hủy/thanh lý thủ công (không từ kiểm kê)
// Theo Điều 23 (Thanh lý) và Điều 24 (Tiêu hủy) Quy chế 2026
// Các đơn vị (staff/head) tạo hồ sơ cho phòng mình; admin/director tổng hợp tất cả
router.post('/manual', authenticateToken, requirePermission('disposal.create', adminOnlyRoles), (req, res) => assetDisposalController.createManualCase(req, res));

// POST /from-maintenance/:maintenanceId – Chuyển đề nghị sửa chữa sang thanh lý/tiêu hủy
router.post('/from-maintenance/:maintenanceId', authenticateToken, requirePermission('disposal.create', adminOnlyRoles), (req, res) => assetDisposalController.createFromMaintenance(req, res));

export default router;
