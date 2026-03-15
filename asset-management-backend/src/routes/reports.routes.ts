import { Router } from 'express';
import reportsController from '../controllers/reports.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/authorization.middleware';
import { validateRequest } from '../middleware/validation';
import { createReportSchema, updateReportSchema } from '../utils/validators';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Statistics (all authenticated users can view)
router.get('/statistics', reportsController.getStatistics);

// Procurement annual summary (all authenticated users can view)
router.get('/procurement', reportsController.getProcurementSummary);

// All authenticated users can view reports
router.get('/', reportsController.getAllReports);
router.get('/:id', reportsController.getReportById);

// Create/Update reports (Manager/Admin only)
router.post(
  '/',
  requireRole('admin', 'department_head'),
  validateRequest(createReportSchema),
  reportsController.createReport
);

router.put(
  '/:id',
  requireRole('admin', 'department_head'),
  validateRequest(updateReportSchema),
  reportsController.updateReport
);

// Submit report for approval
router.post(
  '/:id/submit',
  requireRole('admin', 'department_head'),
  reportsController.submitReport
);

// Approve/Reject reports (Admin only)
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
