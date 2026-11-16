import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorization.middleware';
import { getTableLayout, saveTableLayout } from '../controllers/tableLayout.controller';

const router = Router();

router.use(authenticateToken);

router.get('/:tableKey', getTableLayout);
router.put('/:tableKey', authorize('admin'), saveTableLayout);

export default router;
