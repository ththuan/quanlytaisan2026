import { Router } from 'express';
import multer from 'multer';
import procurementDocumentsController from '../controllers/procurementDocuments.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/authorization.middleware';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});

// Admin only module for procurement-level upload/list/download
router.use(authenticateToken);
router.use(requireRole('admin'));

router.get('/:id/documents', procurementDocumentsController.listByProcurement);
router.post('/:id/documents', upload.single('file'), procurementDocumentsController.uploadToProcurement);
router.get('/:id/documents/:docId/download', procurementDocumentsController.download);
router.delete('/:id/documents/:docId', procurementDocumentsController.delete);

export default router;
