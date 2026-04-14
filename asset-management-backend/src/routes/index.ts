import { Router } from 'express';
import publicRoutes from './public.routes';
import authRoutes from './auth.routes';
import assetsRoutes from './assets.routes';
import usersRoutes from './users.routes';
import departmentsRoutes from './departments.routes';
import transfersRoutes from './transfers.routes';
import maintenanceRoutes from './maintenance.routes';
import reportsRoutes from './reports.routes';
import inventoryRoutes from './inventory.routes';
import assetCategoriesRoutes from './assetCategories.routes';
import importRoutes from './import.routes';
import procurementsRoutes from './procurements.routes';
import procurementDocumentsRoutes from './procurementDocuments.routes';
import stockRoutes from './stock.routes';
import dashboardRoutes from './dashboard.routes';
import assetProcurementDocumentsRoutes from './assetProcurementDocuments.routes';
import assetDisposalRoutes from './assetDisposal.routes';
import assetDisposalUploadRoutes from './assetDisposalUpload.routes';
import assetImagesRoutes from './assetImages.routes';
import notificationsRoutes from './notifications.routes';
import systemAdminRoutes from './systemAdmin.routes';
import searchRoutes from './search.routes';

const router = Router();

// Public routes - không yêu cầu xác thực (đặt trước các route có auth)
router.use('/public', publicRoutes);

// API Routes
router.use('/auth', authRoutes);

router.use('/assets', assetsRoutes);
router.use('/assets', assetImagesRoutes);
router.use('/users', usersRoutes);
router.use('/departments', departmentsRoutes);
router.use('/transfers', transfersRoutes);
router.use('/maintenance', maintenanceRoutes);
router.use('/reports', reportsRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/asset-categories', assetCategoriesRoutes);
router.use('/import', importRoutes);
router.use('/procurements', procurementsRoutes);
router.use('/procurements', procurementDocumentsRoutes);
router.use('/stock', stockRoutes);
router.use('/assets', assetProcurementDocumentsRoutes);
router.use('/asset-disposals', assetDisposalRoutes);
router.use('/asset-disposals', assetDisposalUploadRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/search', searchRoutes);
router.use('/system-admin', systemAdminRoutes);

// Health check route
router.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

export default router;