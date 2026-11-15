import { Router } from 'express';
import transfersController from '../controllers/transfers.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import {
  requirePermission,
  allAuthenticatedRoles,
  adminOnlyRoles,
  canApproveTransfer,
  canViewTransfer,
} from '../middleware/authorization.middleware';
import { validateRequest } from '../middleware/validation';
import { createTransferSchema } from '../utils/validators';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

// All authenticated users can view transfers (filtered by role)
router.get('/', requirePermission('transfers.view', allAuthenticatedRoles), transfersController.getAllTransfers);
router.get('/:id', requirePermission('transfers.view', allAuthenticatedRoles), canViewTransfer, transfersController.getTransferById);
router.get('/asset/:assetId/history', requirePermission('transfers.view', allAuthenticatedRoles), transfersController.getTransferHistory);

// Get approval history for a transfer
router.get('/:id/approval-history', requirePermission('transfers.view', allAuthenticatedRoles), canViewTransfer, transfersController.getApprovalHistory);

// Create transfer request (Staff, Department Head can create)
router.post(
  '/',
  requirePermission('transfers.create', allAuthenticatedRoles),
  validateRequest(createTransferSchema),
  transfersController.createTransfer
);

// Multi-level approval (Department Head or Admin)
router.post(
  '/:id/process-approval',
  requirePermission('transfers.approve', allAuthenticatedRoles),
  canApproveTransfer,
  transfersController.processApproval
);

// Legacy approve/reject routes (for backward compatibility)
router.post(
  '/:id/approve',
  requirePermission('transfers.approve', adminOnlyRoles),
  transfersController.approveTransfer
);

router.post(
  '/:id/reject',
  requirePermission('transfers.approve', adminOnlyRoles),
  transfersController.rejectTransfer
);

export default router;
