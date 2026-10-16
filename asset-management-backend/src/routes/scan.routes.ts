import { Router } from 'express';
import { scanAssetPage, scanClientScript } from '../controllers/scan.controller';

const router = Router();

// GET /scan/assets/scan.js - script cho trang quét QR (phải đặt trước /:code)
router.get('/assets/scan.js', scanClientScript);

// GET /scan/:code - Trang HTML tra cứu tài sản qua mã QR (không cần đăng nhập)
router.get('/:code', scanAssetPage);

export default router;
