import { Router } from 'express';
import assetCategoryController from '../controllers/assetCategories.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/authorization.middleware';

const router = Router();

// Public read routes (không cần đăng nhập)
router.get('/', assetCategoryController.getAll);
router.get('/tree', assetCategoryController.getTree);
router.get('/selectable', assetCategoryController.getSelectable);
router.get('/top-level', assetCategoryController.getTopLevel);
router.get('/search', assetCategoryController.search);
router.get('/group/:group', assetCategoryController.getByGroup);
router.get('/children/:parentCode', assetCategoryController.getChildren);
router.get('/code/:code', assetCategoryController.getByCode);
router.get('/:id', assetCategoryController.getById);
router.get('/:id/autofill', assetCategoryController.getAutoFill);

// Still requires login (used to generate codes / create assets)
router.post('/generate-code', authenticate, assetCategoryController.generateCode);

// Admin only routes
router.post('/', authenticate, requireRole('admin'), assetCategoryController.create);
router.put('/:id', authenticate, requireRole('admin'), assetCategoryController.update);
router.delete('/:id', authenticate, requireRole('admin'), assetCategoryController.delete);

export default router;
