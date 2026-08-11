import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/authorization.middleware';
import * as dashboardController from '../controllers/dashboard.controller';

const router = Router();

router.use(authenticateToken);
// Mọi vai trò sau khi đăng nhập đều có thể truy cập dashboard thống kê
// router.use(requireRole('admin', 'director'));

router.get('/overview', dashboardController.getOverviewStats);
router.get('/asset-status', dashboardController.getAssetStatusStats);
router.get('/departments', dashboardController.getDepartmentStats);
router.get('/procurements', dashboardController.getProcurementStats);
router.get('/stock', dashboardController.getStockStats);
router.get('/categories', dashboardController.getCategoryBreakdown);
router.get('/audit-logs', dashboardController.getAuditLogs);
router.get('/maintenance', requireRole('admin', 'director'), dashboardController.getMaintenanceStats);
router.get('/hierarchy', dashboardController.getHierarchyStats);

export default router;
