import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/authorization.middleware';
import { validateRequest } from '../middleware/validation';
import * as stockController from '../controllers/stock.controller';
import * as stockHistoryController from '../controllers/stockHistory.controller';
import { createStockItemSchema, createStockReceiptSchema, createStockIssueSchema } from '../utils/validators.stock';

const router = Router();

router.use(authenticateToken);

// Read: admin + director
router.get('/items', requireRole('admin', 'director'), stockController.listItems);
router.get('/history', requireRole('admin', 'director'), stockHistoryController.getHistory);

// Write: admin only
router.post('/items', requireRole('admin'), validateRequest(createStockItemSchema), stockController.createItem);
router.post('/receipts', requireRole('admin'), validateRequest(createStockReceiptSchema), stockController.createReceipt);
router.post('/issues', requireRole('admin'), validateRequest(createStockIssueSchema), stockController.createIssue);

export default router;
