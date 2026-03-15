import { Router } from 'express';
import transfersController from '../controllers/transfers.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { 
  requireRole,
  canApproveTransfer,
  canViewTransfer 
} from '../middleware/authorization.middleware';
import { validateRequest } from '../middleware/validation';
import { createTransferSchema } from '../utils/validators';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

// All authenticated users can view transfers (filtered by role)
router.get('/', transfersController.getAllTransfers);
router.get('/:id', canViewTransfer, transfersController.getTransferById);
router.get('/asset/:assetId/history', transfersController.getTransferHistory);

// Get approval history for a transfer
router.get('/:id/approval-history', canViewTransfer, transfersController.getApprovalHistory);

// Create transfer request (Staff, Department Head can create)
router.post(
  '/',
  validateRequest(createTransferSchema),
  transfersController.createTransfer
);

// Multi-level approval (Department Head or Admin)
router.post(
  '/:id/process-approval',
  canApproveTransfer,
  transfersController.processApproval
);

// Legacy approve/reject routes (for backward compatibility)
router.post(
  '/:id/approve',
  requireRole('admin', 'department_head'),
  transfersController.approveTransfer
);

router.post(
  '/:id/reject',
  requireRole('admin', 'department_head'),
  transfersController.rejectTransfer
);

export default router;
