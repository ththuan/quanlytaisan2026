import { Router } from 'express';
import reportsController from '../controllers/reports.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/authorization.middleware';
import { validateRequest } from '../middleware/validation';
import { createReportSchema, updateReportSchema } from '../utils/validators';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Giám hiệu được xem/đánh giá toàn bộ báo cáo (chỉ đọc)
const READ_ROLES = requireRole('admin', 'director');

// Statistics
router.get('/statistics', READ_ROLES, reportsController.getStatistics);

// Procurement annual summary
router.get('/procurement', READ_ROLES, reportsController.getProcurementSummary);

router.post(
  '/bulk-approve',
  requireRole('admin'),
  reportsController.bulkApproveReports
);

// Admin và giám hiệu được xem báo cáo
router.get('/', READ_ROLES, reportsController.getAllReports);
router.get('/:id', READ_ROLES, reportsController.getReportById);

// Create/Update reports (Manager/Admin only)
router.post(
  '/',
  requireRole('admin'),
  validateRequest(createReportSchema),
  reportsController.createReport
);

router.put(
  '/:id',
  requireRole('admin'),
  validateRequest(updateReportSchema),
  reportsController.updateReport
);

// Submit report for approval
router.post(
  '/:id/submit',
  requireRole('admin'),
  reportsController.submitReport
);

// Approve/Reject reports (Admin + Giám hiệu — khớp quyền trên giao diện)
router.post(
  '/:id/approve',
  requireRole('admin'),
  reportsController.approveReport
);

router.post(
  '/:id/reject',
  requireRole('admin'),
  reportsController.rejectReport
);

// Delete report (Admin only)
router.delete(
  '/:id',
  requireRole('admin'),
  reportsController.deleteReport
);

export default router;
