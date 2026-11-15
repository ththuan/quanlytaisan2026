import { Router } from 'express';
import multer from 'multer';
import * as assetsController from '../controllers/assets.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requirePermission, allAuthenticatedRoles, adminOnlyRoles } from '../middleware/authorization.middleware';
import { validateBody } from '../middleware/validation';
import { createAssetSchema, updateAssetSchema } from '../utils/validators';
import { auditLog } from '../middleware/logging';
import { invalidateCache } from '../middleware/caching';
import { ALLOWED_IMAGE_MIME_TYPES } from '../constants/imageMime';

const router = Router();

// Configure multer for image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (_req, file, cb) => {
    // Chỉ cho phép ảnh raster an toàn — CẤM SVG (chứa script → XSS)
    if (ALLOWED_IMAGE_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ cho phép upload ảnh (JPEG, PNG, GIF, WebP, HEIC, AVIF, BMP, TIFF)') as any, false);
    }
  }
});

// All routes require authentication
router.use(authMiddleware);

// GET /api/assets/statistics - Get asset statistics
router.get('/statistics', requirePermission('assets.view', allAuthenticatedRoles), assetsController.getStatistics);

// GET /api/assets/export - Export assets to Excel
router.get('/export', requirePermission('assets.export', allAuthenticatedRoles), assetsController.exportAssets);

// GET /api/assets/pending-disposal-grouped - Get pending disposal assets grouped by department
router.get('/pending-disposal-grouped', requirePermission('assets.view', allAuthenticatedRoles), assetsController.getPendingDisposalGrouped);

// GET /api/assets/loss-damage - Tài sản mất/hư hỏng (người dùng thường chỉ thấy đơn vị mình)
router.get('/loss-damage', requirePermission('assets.view', allAuthenticatedRoles), assetsController.getLossDamageAssets);
router.get('/loss-damage/export', requirePermission('assets.export', ['admin', 'director']), assetsController.exportLossDamage);

// GET /api/assets - List all assets
router.get('/', requirePermission('assets.view', allAuthenticatedRoles), assetsController.getAllAssets);

// GET /api/assets/:id - Get asset details
router.get('/:id', requirePermission('assets.view', allAuthenticatedRoles), assetsController.getAssetById);

// POST /api/assets - Create new asset with image (Admin only)
router.post(
  '/',
  requirePermission('assets.create', adminOnlyRoles),
  upload.single('image'),
  validateBody(createAssetSchema),
  auditLog('create'),
  invalidateCache('assets'),
  assetsController.createAsset
);

// PUT /api/assets/:id - Update asset with image (Admin only)
router.put(
  '/:id',
  requirePermission('assets.update', adminOnlyRoles),
  upload.single('image'),
  validateBody(updateAssetSchema),
  auditLog('update'),
  invalidateCache('assets'),
  assetsController.updateAsset
);

// POST /api/assets/:id/image - Upload image strictly for an asset (Admin only)
router.post(
  '/:id/image',
  requirePermission('assets.update', adminOnlyRoles),
  upload.single('image'),
  auditLog('update'),
  invalidateCache('assets'),
  assetsController.uploadAssetImage
);

// DELETE /api/assets/:id - Delete asset (Admin only)
router.delete('/:id', requirePermission('assets.delete', adminOnlyRoles), auditLog('delete'), invalidateCache('assets'), assetsController.deleteAsset);

// GET /api/assets/:id/history - Get asset transfer history
router.get('/:id/history', requirePermission('assets.view', allAuthenticatedRoles), assetsController.getAssetHistory);

// GET /api/assets/:id/timeline - Get unified asset history timeline
router.get('/:id/timeline', requirePermission('assets.view', allAuthenticatedRoles), assetsController.getAssetTimeline);

// GET /api/assets/:id/repair-history - Get asset repair history
router.get('/:id/repair-history', requirePermission('assets.view', allAuthenticatedRoles), assetsController.getRepairHistory);

// GET /api/assets/:id/assignment-history - Lịch sử bàn giao người sử dụng
router.get('/:id/assignment-history', requirePermission('assets.view', allAuthenticatedRoles), assetsController.getAssignmentHistory);

// GET /api/assets/:id/depreciation - Get depreciation history by year
router.get('/:id/depreciation', requirePermission('assets.view', allAuthenticatedRoles), assetsController.getDepreciationHistory);
router.get('/:id/disposal-history', requirePermission('assets.view', allAuthenticatedRoles), assetsController.getDisposalHistory);

// POST /api/assets/:id/recalculate - Recalculate current value based on depreciation
router.post('/:id/recalculate', requirePermission('assets.update', adminOnlyRoles), invalidateCache('assets'), assetsController.recalculateCurrentValue);

// POST /api/assets/:id/calculate-depreciation - Calculate depreciation theo Thông tư 141/2025/TT-BTC
router.post('/:id/calculate-depreciation', requirePermission('assets.update', adminOnlyRoles), invalidateCache('assets'), assetsController.calculateAssetDepreciation);

// POST /api/assets/depreciation/schedule - Get depreciation schedule
router.post('/depreciation/schedule', requirePermission('assets.view', allAuthenticatedRoles), assetsController.getDepreciationSchedule);

// POST /api/assets/depreciation/validate - Validate depreciation input
router.post('/depreciation/validate', requirePermission('assets.view', allAuthenticatedRoles), assetsController.validateDepreciation);

// QR Code routes
// POST /api/assets/qrcode/decode - Decode QR code và tìm tài sản
router.post('/qrcode/decode', requirePermission('assets.view', allAuthenticatedRoles), assetsController.decodeQRCode);

// POST /api/assets/qrcode/generate-all - Generate QR code cho tất cả tài sản chưa có
router.post('/qrcode/generate-all', requirePermission('assets.qr', adminOnlyRoles), invalidateCache('assets'), assetsController.generateAllQRCodes);

// GET /api/assets/:id/qrcode - Lấy QR code của tài sản (chỉ admin)
router.get('/:id/qrcode', requirePermission('assets.qr', adminOnlyRoles), assetsController.getQRCode);

// POST /api/assets/:id/qrcode/generate - Generate QR code cho tài sản
router.post('/:id/qrcode/generate', requirePermission('assets.qr', adminOnlyRoles), invalidateCache('assets'), assetsController.generateQRCode);
export default router;
