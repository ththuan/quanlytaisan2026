import { Router } from 'express';
import assetDisposalController from '../controllers/assetDisposal.controller';
import { authenticateToken, requireRoles } from '../middleware/auth.middleware';

const router = Router();

// Admin/Director handle disposal, Staff can view their department's cases
router.get('/', authenticateToken, requireRoles(['admin', 'director', 'staff', 'department_head']), (req, res) => assetDisposalController.listCases(req, res));
router.get('/:id', authenticateToken, requireRoles(['admin', 'director', 'staff', 'department_head']), (req, res) => assetDisposalController.getCaseById(req, res));
router.post('/:id/complete', authenticateToken, requireRoles(['admin', 'director']), (req, res) => assetDisposalController.completeCase(req, res));

// POST /manual – Tạo hồ sơ tiêu hủy/thanh lý thủ công (không từ kiểm kê)
// Theo Điều 23 (Thanh lý) và Điều 24 (Tiêu hủy) Quy chế 2026
router.post('/manual', authenticateToken, requireRoles(['admin', 'director']), (req, res) => assetDisposalController.createManualCase(req, res));

// POST /from-maintenance/:maintenanceId – Chuyển đề nghị sửa chữa sang thanh lý/tiêu hủy
router.post('/from-maintenance/:maintenanceId', authenticateToken, requireRoles(['admin']), (req, res) => assetDisposalController.createFromMaintenance(req, res));

export default router;
