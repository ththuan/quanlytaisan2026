import { Router } from 'express';
import procurementDocumentsController from '../controllers/procurementDocuments.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// All authenticated users who can view the asset can open its documents via Asset module.
// Asset permission checks (department-based) are handled by assets controller/service.
router.use(authMiddleware);

router.get('/:assetId/procurement-documents', procurementDocumentsController.listByAsset);
router.get('/:assetId/procurement-documents/:docId/download', procurementDocumentsController.downloadByAsset);

export default router;
