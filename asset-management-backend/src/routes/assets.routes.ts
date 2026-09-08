import { Router } from 'express';
import multer from 'multer';
import * as assetsController from '../controllers/assets.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/authorization.middleware';
import { validateBody } from '../middleware/validation';
import { createAssetSchema, updateAssetSchema } from '../utils/validators';
import { auditLog } from '../middleware/logging';
import { invalidateCache } from '../middleware/caching';

const router = Router();

// Configure multer for image uploads
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

// All routes require authentication
router.use(authMiddleware);

// GET /api/assets/statistics - Get asset statistics
router.get('/statistics', assetsController.getStatistics);

// GET /api/assets/export - Export assets to Excel
router.get('/export', assetsController.exportAssets);

// GET /api/assets/pending-disposal-grouped - Get pending disposal assets grouped by department
router.get('/pending-disposal-grouped', assetsController.getPendingDisposalGrouped);

// GET /api/assets - List all assets
router.get('/', assetsController.getAllAssets);

// GET /api/assets/:id - Get asset details
router.get('/:id', assetsController.getAssetById);

// POST /api/assets - Create new asset with image (Admin/Manager only)
router.post(
  '/',
  requireRole('admin'),
  upload.single('image'),
  validateBody(createAssetSchema),
  auditLog('create'),
  invalidateCache('assets'),
  assetsController.createAsset
);

// PUT /api/assets/:id - Update asset with image (Admin/Manager only)
router.put(
  '/:id',
  requireRole('admin'),
  upload.single('image'),
  validateBody(updateAssetSchema),
  auditLog('update'),
  invalidateCache('assets'),
  assetsController.updateAsset
);

// POST /api/assets/:id/image - Upload image strictly for an asset (admin/director/staff)
router.post(
  '/:id/image',
  requireRole('admin'),
  upload.single('image'),
  auditLog('update'),
  invalidateCache('assets'),
  assetsController.uploadAssetImage
);

// DELETE /api/assets/:id - Delete asset (Admin/Manager only)
router.delete('/:id', requireRole('admin'), auditLog('delete'), invalidateCache('assets'), assetsController.deleteAsset);

// GET /api/assets/:id/history - Get asset transfer history
router.get('/:id/history', assetsController.getAssetHistory);

// GET /api/assets/:id/repair-history - Get asset repair history
router.get('/:id/repair-history', assetsController.getRepairHistory);

// GET /api/assets/:id/depreciation - Get depreciation history by year
router.get('/:id/depreciation', assetsController.getDepreciationHistory);
router.get('/:id/disposal-history', assetsController.getDisposalHistory);

// POST /api/assets/:id/recalculate - Recalculate current value based on depreciation
router.post('/:id/recalculate', requireRole('admin'), invalidateCache('assets'), assetsController.recalculateCurrentValue);

// POST /api/assets/:id/calculate-depreciation - Calculate depreciation theo Thông tư 141/2025/TT-BTC
router.post('/:id/calculate-depreciation', requireRole('admin'), invalidateCache('assets'), assetsController.calculateAssetDepreciation);

// POST /api/assets/depreciation/schedule - Get depreciation schedule
router.post('/depreciation/schedule', assetsController.getDepreciationSchedule);

// POST /api/assets/depreciation/validate - Validate depreciation input
router.post('/depreciation/validate', assetsController.validateDepreciation);

// QR Code routes
// POST /api/assets/qrcode/decode - Decode QR code và tìm tài sản
router.post('/qrcode/decode', assetsController.decodeQRCode);

// POST /api/assets/qrcode/generate-all - Generate QR code cho tất cả tài sản chưa có
router.post('/qrcode/generate-all', requireRole('admin'), invalidateCache('assets'), assetsController.generateAllQRCodes);

// GET /api/assets/:id/qrcode - Lấy QR code của tài sản
router.get('/:id/qrcode', assetsController.getQRCode);

// POST /api/assets/:id/qrcode/generate - Generate QR code cho tài sản
router.post('/:id/qrcode/generate', requireRole('admin'), invalidateCache('assets'), assetsController.generateQRCode);
export default router;
