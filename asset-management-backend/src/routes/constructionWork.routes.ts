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
const ALL_ROLES = ['admin', 'director', 'department_head', 'staff'] as const;

router.use(authenticateToken);

router.get('/', requirePermission('maintenance.view', [...ALL_ROLES]), listConstructionWorks);
router.get('/:id', requirePermission('maintenance.view', [...ALL_ROLES]), getConstructionWork);
router.post('/', requirePermission('maintenance.create', [...ALL_ROLES]), createConstructionWork);
router.put('/:id', requirePermission('maintenance.update', [...ALL_ROLES]), updateConstructionWork);
router.delete('/:id', requirePermission('maintenance.delete', [...ALL_ROLES]), deleteConstructionWork);

export default router;
