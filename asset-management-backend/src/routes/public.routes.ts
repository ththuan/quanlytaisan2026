/**
 * Public Routes - Không yêu cầu xác thực
 * Dùng cho tính năng quét QR code công khai
 */
import { Router } from 'express';
import { getPublicAssetByCode } from '../controllers/public.controller';

const router = Router();

// GET /api/public/asset/:code - Tra cứu tài sản qua mã QR (không cần đăng nhập)
router.get('/asset/:code', getPublicAssetByCode);

export default router;
