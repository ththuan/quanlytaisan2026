import { Router } from 'express';
import * as notificationsController from '../controllers/notifications.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { isAdmin } from '../middleware/authorization.middleware';

const router = Router();

router.use(authMiddleware);

// Accessible to all authenticated users — filtered by role inside controller
router.get('/pending-approvals', notificationsController.getPendingApprovals);

// Admin-only: full audit-log notifications
router.get('/', isAdmin, notificationsController.getNotifications);
router.post('/:id/read', isAdmin, notificationsController.markAsRead);
router.post('/read-all', isAdmin, notificationsController.markAllAsRead);

export default router;