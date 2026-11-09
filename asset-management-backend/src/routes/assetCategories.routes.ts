import { Router } from 'express';
import assetCategoryController from '../controllers/assetCategories.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/authorization.middleware';
import { invalidateCache } from '../middleware/caching';
import { cacheResponse } from '../middleware/redisCache';

const router = Router();

// Dữ liệu danh mục ít thay đổi → cache 5 phút, giảm tải truy vấn lặp lại.
const cacheCategories = cacheResponse(300, { allowAnonymous: true });

// Public read routes (không cần đăng nhập)
router.get('/', cacheCategories, assetCategoryController.getAll);
router.get('/tree', cacheCategories, assetCategoryController.getTree);
router.get('/selectable', cacheCategories, assetCategoryController.getSelectable);
router.get('/top-level', cacheCategories, assetCategoryController.getTopLevel);
router.get('/search', cacheCategories, assetCategoryController.search);
router.get('/group/:group', cacheCategories, assetCategoryController.getByGroup);
router.get('/children/:parentCode', cacheCategories, assetCategoryController.getChildren);
router.get('/code/:code', cacheCategories, assetCategoryController.getByCode);
router.get('/:id', cacheCategories, assetCategoryController.getById);
router.get('/:id/autofill', cacheCategories, assetCategoryController.getAutoFill);

// Still requires login (used to generate codes / create assets)
router.post('/generate-code', authenticate, assetCategoryController.generateCode);

// Admin only routes
router.post('/', authenticate, requireRole('admin'), invalidateCache('categories'), assetCategoryController.create);
router.put('/:id', authenticate, requireRole('admin'), invalidateCache('categories'), assetCategoryController.update);
router.delete('/:id', authenticate, requireRole('admin'), invalidateCache('categories'), assetCategoryController.delete);

export default router;
