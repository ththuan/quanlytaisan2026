import { Router } from 'express';
import multer from 'multer';
import { authenticateToken, requireRoles } from '../middleware/auth.middleware';
import assetDisposalUploadController from '../controllers/assetDisposalUpload.controller';

const router = Router();

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB
  },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Loại file không được phép. Chỉ chấp nhận PDF, Word, và ảnh (JPG, PNG, GIF, WebP).'));
    }
  },
});

router.post(
  '/:id/decision-file',
  authenticateToken,
  requireRoles(['admin', 'director']),
  upload.single('file'),
  (req, res) => assetDisposalUploadController.uploadDecisionFile(req as any, res)
);

export default router;
