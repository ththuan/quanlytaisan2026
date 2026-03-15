/**
 * Import Routes
 * Routes cho import tài sản hàng loạt
 */

import { Router } from 'express';
import importController from '../controllers/import.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorization.middleware';

const router = Router();

// Tất cả routes đều yêu cầu đăng nhập và quyền admin
router.use(authMiddleware);
router.use(authorize('admin', 'director'));

// Download file mẫu
router.get('/template', importController.downloadTemplate);

// Import tài sản từ file Excel
router.post('/assets', importController.uploadMiddleware, importController.importAssets);

export default router;
