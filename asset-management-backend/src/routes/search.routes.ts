import { Router } from 'express';
import { authenticateToken, requireDepartmentScope } from '../middleware/auth.middleware';
import { searchGlobal } from '../controllers/search.controller';

const router = Router();

router.use(authenticateToken, requireDepartmentScope);
router.get('/', searchGlobal);

export default router;
