import { Router } from 'express';
import reportsController from '../controllers/reports.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { requirePermission, adminOnlyRoles } from '../middleware/authorization.middleware';
import { validateRequest } from '../middleware/validation';
import { createReportSchema, updateReportSchema } from '../utils/validators';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Giám hiệu được xem/đánh giá toàn bộ báo cáo (chỉ đọc)
const READ_ROLES = requirePermission('reports.view', ['admin', 'director']);

// Statistics
router.get('/statistics', READ_ROLES, reportsController.getStatistics);

// Procurement annual summary
router.get('/procurement', READ_ROLES, reportsController.getProcurementSummary);

router.post(
  '/bulk-approve',
  requirePermission('reports.approve', adminOnlyRoles),
  reportsController.bulkApproveReports
);

// Admin và giám hiệu được xem báo cáo
router.get('/', READ_ROLES, reportsController.getAllReports);
router.get('/:id', READ_ROLES, reportsController.getReportById);

// Create/Update reports (Manager/Admin only)
router.post(
  '/',
  requirePermission('reports.create', adminOnlyRoles),
  validateRequest(createReportSchema),
  reportsController.createReport
);

router.put(
  '/:id',
  requirePermission('reports.update', adminOnlyRoles),
  validateRequest(updateReportSchema),
  reportsController.updateReport
);

// Submit report for approval
router.post(
  '/:id/submit',
  requirePermission('reports.update', adminOnlyRoles),
  reportsController.submitReport
);

// Approve/Reject reports (Admin + Giám hiệu — khớp quyền trên giao diện)
router.post(
  '/:id/approve',
  requirePermission('reports.approve', adminOnlyRoles),
  reportsController.approveReport
);

router.post(
  '/:id/reject',
  requirePermission('reports.approve', adminOnlyRoles),
  reportsController.rejectReport
);

// Delete report (Admin only)
router.delete(
  '/:id',
  requirePermission('reports.delete', adminOnlyRoles),
  reportsController.deleteReport
);

export default router;
