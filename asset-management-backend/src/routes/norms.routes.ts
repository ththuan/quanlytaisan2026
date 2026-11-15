import { Router } from 'express';
import * as normsController from '../controllers/norms.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { requirePermission, adminOnlyRoles } from '../middleware/authorization.middleware';

const router = Router();
router.use(authenticateToken);

// Đọc: admin + director
router.get('/', requirePermission('norms.view', ['admin', 'director']), normsController.listNorms);
router.get('/warnings', requirePermission('norms.view', ['admin', 'director']), normsController.listWarnings);

// Ghi: admin
router.post('/', requirePermission('norms.create', adminOnlyRoles), normsController.createNorm);
router.put('/:id', requirePermission('norms.update', adminOnlyRoles), normsController.updateNorm);
router.delete('/:id', requirePermission('norms.delete', adminOnlyRoles), normsController.deleteNorm);
router.post('/warnings/:id/ack', requirePermission('norms.update', ['admin', 'director']), normsController.acknowledgeWarning);

export default router;
