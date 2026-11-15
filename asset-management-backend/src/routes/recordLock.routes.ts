import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { claim, release, status, heartbeat } from '../controllers/recordLock.controller';

const router = Router();

router.use(authenticateToken);

router.post('/claim', claim);
router.post('/release', release);
router.post('/heartbeat', heartbeat);
router.get('/:entityType/:entityId', status);

export default router;
