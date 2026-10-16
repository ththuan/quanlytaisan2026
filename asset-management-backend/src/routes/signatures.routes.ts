import { Router } from 'express';
import { getSignatures } from '../controllers/signature.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);
router.get('/', getSignatures);

export default router;
