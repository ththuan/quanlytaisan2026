import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { searchGlobal } from '../controllers/search.controller';

const router = Router();

router.use(authenticateToken);
router.get('/', searchGlobal);

export default router;
