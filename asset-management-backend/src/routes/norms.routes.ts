import { Router } from 'express';
import * as normsController from '../controllers/norms.controller';
import { authenticateToken, requireRoles } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticateToken);

// Đọc: admin + director
router.get('/', requireRoles(['admin', 'director']), normsController.listNorms);
router.get('/warnings', requireRoles(['admin', 'director']), normsController.listWarnings);

// Ghi: admin
router.post('/', requireRoles(['admin']), normsController.createNorm);
router.put('/:id', requireRoles(['admin']), normsController.updateNorm);
router.delete('/:id', requireRoles(['admin']), normsController.deleteNorm);
router.post('/warnings/:id/ack', requireRoles(['admin', 'director']), normsController.acknowledgeWarning);

export default router;
