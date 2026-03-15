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
    // Only allow image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ cho phép upload file ảnh (JPEG, PNG, GIF)') as any, false);
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