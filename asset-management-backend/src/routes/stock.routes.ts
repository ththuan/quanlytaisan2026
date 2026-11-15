import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { requirePermission, adminOnlyRoles } from '../middleware/authorization.middleware';
import { validateRequest } from '../middleware/validation';
import * as stockController from '../controllers/stock.controller';
import * as stockHistoryController from '../controllers/stockHistory.controller';
import { createStockItemSchema, createStockReceiptSchema, createStockIssueSchema } from '../utils/validators.stock';

const router = Router();

router.use(authenticateToken);

// Read: admin only
router.get('/items', requirePermission('stock.view', adminOnlyRoles), stockController.listItems);
router.get('/history', requirePermission('stock.view', adminOnlyRoles), stockHistoryController.getHistory);

// Write: admin only
router.post('/items', requirePermission('stock.adjust', adminOnlyRoles), validateRequest(createStockItemSchema), stockController.createItem);
router.post('/receipts', requirePermission('stock.import', adminOnlyRoles), validateRequest(createStockReceiptSchema), stockController.createReceipt);
router.post('/issues', requirePermission('stock.export', adminOnlyRoles), validateRequest(createStockIssueSchema), stockController.createIssue);

export default router;
