import { Router } from 'express';
import maintenanceController from '../controllers/maintenance.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { 
  requireRole, 
  canApproveMaintenanceRequest,
  canViewMaintenanceRequest 
} from '../middleware/authorization.middleware';
import { validateRequest } from '../middleware/validation';
import { createMaintenanceSchema, updateMaintenanceSchema, processApprovalSchema } from '../utils/validators';
import { fulfillProcurementSchema } from '../utils/validators';
import { auditLog } from '../middleware/logging';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Get pending counts (must be before /:id routes)
router.get('/pending-counts', maintenanceController.getPendingCounts);

// All authenticated users can view and create maintenance requests
router.get('/', maintenanceController.getAllMaintenance);
router.get('/:id', canViewMaintenanceRequest, maintenanceController.getMaintenanceById);

// Get approval history for a request
router.get('/:id/approval-history', canViewMaintenanceRequest, maintenanceController.getApprovalHistory);

// Submit for approval (must be before /:id routes)
router.post('/:id/submit', auditLog('approve'), maintenanceController.submitForApproval);

// Admin bắt đầu thực hiện sửa chữa: approved_by_director → in_progress
router.post(
  '/:id/start-repair',
  requireRole('admin'),
  auditLog('approve'),
  maintenanceController.startRepair
);

// Admin xác nhận hoàn thành sửa chữa: in_progress → repair_completed
router.post(
  '/:id/complete-repair',
  requireRole('admin'),
  auditLog('approve'),
  maintenanceController.completeRepair
);

// Fulfill procurement (create assets & allocate) - Admin/Director only
router.post(
  '/:id/fulfill-procurement',
  requireRole('admin', 'director'),
  validateRequest(fulfillProcurementSchema),
  auditLog('approve'),
  maintenanceController.fulfillProcurement
);

router.post(
  '/',
  validateRequest(createMaintenanceSchema),
  auditLog('create'),
  maintenanceController.createMaintenance
);

// Update maintenance (creator or admin/manager)
router.put(
  '/:id',
  validateRequest(updateMaintenanceSchema),
  auditLog('update'),
  maintenanceController.updateMaintenance
);

// Multi-level approval (Department Head, Admin, Director)
router.post(
  '/:id/process-approval',
  canApproveMaintenanceRequest,
  validateRequest(processApprovalSchema),
  auditLog('approve'),
  maintenanceController.processApproval
);

// PUT route for approval (uses processApproval logic for multi-level workflow)
router.put(
  '/:id/approve',
  canApproveMaintenanceRequest,
  auditLog('approve'),
  maintenanceController.approveMaintenancePut
);

// Legacy approve/reject routes (for backward compatibility)
router.post(
  '/:id/approve',
  requireRole('admin', 'department_head'),
  auditLog('approve'),
  maintenanceController.approveMaintenance
);

router.post(
  '/:id/reject',
  requireRole('admin', 'department_head'),
  auditLog('approve'),
  maintenanceController.rejectMaintenance
);

// Delete maintenance (creator or admin)
router.delete(
  '/:id',
  auditLog('delete'),
  maintenanceController.deleteMaintenance
);

export default router;
