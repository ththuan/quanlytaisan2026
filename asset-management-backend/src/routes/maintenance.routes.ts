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

// Get pending counts - admin, director only
router.get('/pending-counts', requireRole('admin', 'director'), maintenanceController.getPendingCounts);

// List/create/view - all authenticated users (service filters by role/department)
router.get('/', maintenanceController.getAllMaintenance);
router.post('/', validateRequest(createMaintenanceSchema), auditLog('create'), maintenanceController.createMaintenance);
router.get('/:id', canViewMaintenanceRequest, maintenanceController.getMaintenanceById);

// Get approval history for a request
router.get('/:id/approval-history', canViewMaintenanceRequest, maintenanceController.getApprovalHistory);

// Submit for approval - all authenticated users
router.post('/:id/submit', auditLog('approve'), maintenanceController.submitForApproval);

// Update/delete - all authenticated users (controller checks ownership/permission)
router.put('/:id', validateRequest(updateMaintenanceSchema), auditLog('update'), maintenanceController.updateMaintenance);
router.delete('/:id', auditLog('delete'), maintenanceController.deleteMaintenance);

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
  requireRole('admin', 'director'),
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
