import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/authorization.middleware';
import * as tt120Controller from '../controllers/tt120Export.controller';

const router = Router();

// All TT120 export routes require admin
router.use(authenticateToken);
router.use(requireRole('admin'));

// Mẫu 04a-CK/TSC – Công khai hình thành tài sản công
router.get('/04a', tt120Controller.exportReport04a);

// Mẫu 04b-CK/TSC – Công khai tình hình sử dụng tài sản công
router.get('/04b', tt120Controller.exportReport04b);

// Mẫu 04c-CK/TSC – Công khai tình hình xử lý tài sản công
router.get('/04c', tt120Controller.exportReport04c);

// Mẫu 04d-CK/TSC – Công khai tình hình khai thác nguồn lực tài sản công
router.get('/04d', tt120Controller.exportReport04d);

// Kê khai tài sản công – CSDL Quốc gia
router.get('/ke-khai', tt120Controller.exportKeKhaiReport);

export default router;
