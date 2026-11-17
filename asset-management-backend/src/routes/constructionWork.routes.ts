import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/authorization.middleware';
import {
  createConstructionWork,
  deleteConstructionWork,
  getConstructionWork,
  listConstructionWorks,
  updateConstructionWork,
} from '../controllers/constructionWork.controller';

const router = Router();

router.use(authenticateToken);

router.get('/', requirePermission('construction.view', ['admin']), listConstructionWorks);
router.get('/:id', requirePermission('construction.view', ['admin']), getConstructionWork);
router.post('/', requirePermission('construction.create', ['admin']), createConstructionWork);
router.put('/:id', requirePermission('construction.update', ['admin']), updateConstructionWork);
router.delete('/:id', requirePermission('construction.delete', ['admin']), deleteConstructionWork);

export default router;
