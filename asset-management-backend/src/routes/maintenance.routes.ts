import { Router } from 'express';
import maintenanceController from '../controllers/maintenance.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import {
  requirePermission,
  allAuthenticatedRoles,
  adminOnlyRoles,
  canApproveMaintenanceRequest,
} from '../middleware/authorization.middleware';
import { validateRequest } from '../middleware/validation';
import { createMaintenanceSchema, updateMaintenanceSchema, processApprovalSchema } from '../utils/validators';
import { fulfillProcurementSchema } from '../utils/validators';
import { auditLog } from '../middleware/logging';
import { requireUnlockedRecord } from '../middleware/recordLock.middleware';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Quick damage report - any authenticated user can report damage for their unit
router.post('/report-damage', requirePermission('maintenance.create', allAuthenticatedRoles), auditLog('create'), maintenanceController.reportDamage);

// Get pending counts - admin only
router.get('/pending-counts', requirePermission('maintenance.view', adminOnlyRoles), maintenanceController.getPendingCounts);

// Danh sách yêu cầu sửa chữa (phân quyền theo chức năng)
router.get('/', requirePermission('maintenance.view', adminOnlyRoles), maintenanceController.getAllMaintenance);
router.post('/', requirePermission('maintenance.create', adminOnlyRoles), validateRequest(createMaintenanceSchema), auditLog('create'), maintenanceController.createMaintenance);
router.get('/:id', requirePermission('maintenance.view', adminOnlyRoles), maintenanceController.getMaintenanceById);

// Get approval history for a request
router.get('/:id/approval-history', requirePermission('maintenance.view', adminOnlyRoles), maintenanceController.getApprovalHistory);

// Submit for approval - all authenticated users
router.post('/:id/submit', requirePermission('maintenance.submit', adminOnlyRoles), auditLog('approve'), maintenanceController.submitForApproval);

// Update/delete - all authenticated users (controller checks ownership/permission)
router.put('/:id', requirePermission('maintenance.update', adminOnlyRoles), requireUnlockedRecord('maintenance'), validateRequest(updateMaintenanceSchema), auditLog('update'), maintenanceController.updateMaintenance);
router.delete('/:id', requirePermission('maintenance.delete', adminOnlyRoles), requireUnlockedRecord('maintenance'), auditLog('delete'), maintenanceController.deleteMaintenance);

// Admin starts repair: approved_by_director -> in_progress
router.post(
  '/:id/start-repair',
  requirePermission('maintenance.execute', adminOnlyRoles),
  requireUnlockedRecord('maintenance'),
  auditLog('approve'),
  maintenanceController.startRepair
);

// Admin confirms repair completion: in_progress -> repair_completed
router.post(
  '/:id/complete-repair',
  requirePermission('maintenance.execute', adminOnlyRoles),
  requireUnlockedRecord('maintenance'),
  auditLog('approve'),
  maintenanceController.completeRepair
);

// Fulfill procurement (create assets & allocate) - Admin/Director only
router.post(
  '/:id/fulfill-procurement',
  requirePermission('procurement.fulfill', adminOnlyRoles),
  requireUnlockedRecord('maintenance'),
  validateRequest(fulfillProcurementSchema),
  auditLog('approve'),
  maintenanceController.fulfillProcurement
);

// Multi-level approval - admin, director, and department_head (via canApproveMaintenanceRequest)
router.post(
  '/:id/process-approval',
  requirePermission('maintenance.approve', adminOnlyRoles),
  requireUnlockedRecord('maintenance'),
  canApproveMaintenanceRequest,
  validateRequest(processApprovalSchema),
  auditLog('approve'),
  maintenanceController.processApproval
);

// PUT route for approval (multi-level workflow)
router.put(
  '/:id/approve',
  requirePermission('maintenance.approve', adminOnlyRoles),
  requireUnlockedRecord('maintenance'),
  canApproveMaintenanceRequest,
  auditLog('approve'),
  maintenanceController.approveMaintenancePut
);

// PUT alias for process-approval (frontend reject action)
router.put(
  '/:id/process-approval',
  requirePermission('maintenance.approve', adminOnlyRoles),
  requireUnlockedRecord('maintenance'),
  canApproveMaintenanceRequest,
  validateRequest(processApprovalSchema),
  auditLog('approve'),
  maintenanceController.processApproval
);

// Legacy approve/reject routes
router.post(
  '/:id/approve',
  requirePermission('maintenance.approve', adminOnlyRoles),
  requireUnlockedRecord('maintenance'),
  canApproveMaintenanceRequest,
  auditLog('approve'),
  maintenanceController.approveMaintenance
);

router.post(
  '/:id/reject',
  requirePermission('maintenance.approve', adminOnlyRoles),
  requireUnlockedRecord('maintenance'),
  canApproveMaintenanceRequest,
  auditLog('approve'),
  maintenanceController.rejectMaintenance
);

export default router;
