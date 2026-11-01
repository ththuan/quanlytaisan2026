import { Router } from 'express';
import { authenticateToken, requireDepartmentScope } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/authorization.middleware';
import * as dashboardController from '../controllers/dashboard.controller';
import { cacheResponse } from '../middleware/redisCache';

const router = Router();

router.use(authenticateToken, requireDepartmentScope);
// Mỗi vai trò sau khi đăng nhập đều có thể truy cập dashboard thống kê
// router.use(requireRole('admin', 'director'));

// Dashboard là read-heavy: cache Redis 15 giây theo phạm vi để giảm tải DB khi đông người.
router.get('/overview', cacheResponse(15), dashboardController.getOverviewStats);
router.get('/asset-status', cacheResponse(15), dashboardController.getAssetStatusStats);
router.get('/departments', cacheResponse(15), dashboardController.getDepartmentStats);
router.get('/procurements', cacheResponse(15), dashboardController.getProcurementStats);
router.get('/stock', cacheResponse(15), dashboardController.getStockStats);
router.get('/categories', cacheResponse(15), dashboardController.getCategoryBreakdown);
router.get('/audit-logs', requireRole('admin'), cacheResponse(15), dashboardController.getAuditLogs);
router.get('/maintenance', requireRole('admin'), cacheResponse(15), dashboardController.getMaintenanceStats);
router.get('/hierarchy', cacheResponse(15), dashboardController.getHierarchyStats);

export default router;
