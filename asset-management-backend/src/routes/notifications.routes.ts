import { Router } from 'express';
import * as notificationsController from '../controllers/notifications.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

// Thông báo của chính người dùng hiện tại
router.get('/', notificationsController.getNotifications);

// Tương thích ngược cho frontend cũ (đã ngừng dùng)
router.get('/pending-approvals', notificationsController.getPendingApprovalsCompat);

router.get('/unread-count', notificationsController.getUnreadCount);
router.post('/read-all', notificationsController.markAllAsRead);
router.delete('/read', notificationsController.clearRead);
router.post('/:id/read', notificationsController.markAsRead);

export default router;
