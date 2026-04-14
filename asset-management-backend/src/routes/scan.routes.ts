import { Router } from 'express';
import { scanAssetPage } from '../controllers/scan.controller';

const router = Router();

// GET /scan/:code - Trang HTML tra cứu tài sản qua mã QR (không cần đăng nhập)
router.get('/:code', scanAssetPage);

export default router;
