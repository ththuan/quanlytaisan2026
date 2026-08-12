import { Router } from 'express';
import multer from 'multer';
import { authenticateToken, requireRoles } from '../middleware/auth.middleware';
import assetImagesController from '../controllers/assetImages.controller';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (_req, file, cb) => {
    // Chỉ cho phép ảnh raster an toàn — CẤM SVG (chứa script → XSS)
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ cho phép upload ảnh (JPEG, PNG, GIF, WebP)') as any, false);
    }
  }
});

// Upload image for an asset
router.post(
  '/:id/image',
  authenticateToken,
  requireRoles(['admin', 'director', 'staff']),
  upload.single('image'),
  (req, res) => assetImagesController.uploadAssetImage(req as any, res)
);

// Delete image for an asset
router.delete(
  '/:id/image',
  authenticateToken,
  requireRoles(['admin', 'director']),
  (req, res) => assetImagesController.deleteAssetImage(req as any, res)
);

export default router;