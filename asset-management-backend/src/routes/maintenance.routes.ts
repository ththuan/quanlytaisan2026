import { Router } from 'express';
import maintenanceController from '../controllers/maintenance.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import {
  requireRole,
  canApproveMaintenanceRequest,
} from '../middleware/authorization.middleware';
import { validateRequest } from '../middleware/validation';
import { createMaintenanceSchema, updateMaintenanceSchema, processApprovalSchema } from '../utils/validators';
import { fulfillProcurementSchema } from '../utils/validators';
import { auditLog } from '../middleware/logging';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Get pending counts - admin only
router.get('/pending-counts', requireRole('admin'), maintenanceController.getPendingCounts);

// List - admin only (ẩn khỏi director, sau này cần bật lại → mở lại requireRole)
router.get('/', requireRole('admin'), maintenanceController.getAllMaintenance);
router.post('/', requireRole('admin'), validateRequest(createMaintenanceSchema), auditLog('create'), maintenanceController.createMaintenance);
router.get('/:id', requireRole('admin'), maintenanceController.getMaintenanceById);

// Get approval history for a request
router.get('/:id/approval-history', requireRole('admin'), maintenanceController.getApprovalHistory);

// Submit for approval - all authenticated users
router.post('/:id/submit', requireRole('admin'), auditLog('approve'), maintenanceController.submitForApproval);

// Update/delete - all authenticated users (controller checks ownership/permission)
router.put('/:id', requireRole('admin'), validateRequest(updateMaintenanceSchema), auditLog('update'), maintenanceController.updateMaintenance);
router.delete('/:id', requireRole('admin'), auditLog('delete'), maintenanceController.deleteMaintenance);

// Admin starts repair: approved_by_director -> in_progress
router.post(
  '/:id/start-repair',
  requireRole('admin'),
  auditLog('approve'),
  maintenanceController.startRepair
);

// Admin confirms repair completion: in_progress -> repair_completed
router.post(
  '/:id/complete-repair',
  requireRole('admin'),
  auditLog('approve'),
  maintenanceController.completeRepair
);

// Fulfill procurement (create assets & allocate) - Admin/Director only
router.post(
  '/:id/fulfill-procurement',
  requireRole('admin'),
  validateRequest(fulfillProcurementSchema),
  auditLog('approve'),
  maintenanceController.fulfillProcurement
);

// Multi-level approval - admin, director, and department_head (via canApproveMaintenanceRequest)
router.post(
  '/:id/process-approval',
  canApproveMaintenanceRequest,
  validateRequest(processApprovalSchema),
  auditLog('approve'),
  maintenanceController.processApproval
);

// PUT route for approval (multi-level workflow)
router.put(
  '/:id/approve',
  canApproveMaintenanceRequest,
  auditLog('approve'),
  maintenanceController.approveMaintenancePut
);

// Legacy approve/reject routes
router.post(
  '/:id/approve',
  canApproveMaintenanceRequest,
  auditLog('approve'),
  maintenanceController.approveMaintenance
);

router.post(
  '/:id/reject',
  canApproveMaintenanceRequest,
  auditLog('approve'),
  maintenanceController.rejectMaintenance
);

export default router;
