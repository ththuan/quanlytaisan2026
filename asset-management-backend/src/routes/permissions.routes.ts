import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/authorization.middleware';
import {
  getPermissionCatalog,
  getUserPermissions,
  resetUserPermissions,
  updateUserPermissions,
} from '../controllers/permissions.controller';

const router = Router();

router.use(authenticateToken, requireRole('admin'));

router.get('/catalog', getPermissionCatalog);
router.get('/users/:id', getUserPermissions);
router.put('/users/:id', updateUserPermissions);
router.delete('/users/:id', resetUserPermissions);

export default router;
