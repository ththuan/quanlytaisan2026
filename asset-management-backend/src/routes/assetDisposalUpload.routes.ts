import { Router } from 'express';
import multer from 'multer';
import { authenticateToken, requireRoles } from '../middleware/auth.middleware';
import assetDisposalUploadController from '../controllers/assetDisposalUpload.controller';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB
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
