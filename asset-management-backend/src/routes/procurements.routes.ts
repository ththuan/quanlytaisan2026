import { Router } from 'express';
import procurementsController from '../controllers/procurements.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/authorization.middleware';
import { validateRequest } from '../middleware/validation';
import { createProcurementSchema, updateProcurementSchema, fulfillProcurementOnlyAdminSchema } from '../utils/validators';

const router = Router();

router.use(authenticateToken);

// Read: admin + director
router.get('/export/excel', requireRole('admin', 'director'), procurementsController.exportExcel);
router.get('/summary/yearly', requireRole('admin', 'director'), procurementsController.getYearlySummary);
router.get('/', requireRole('admin', 'director'), procurementsController.getAll);
router.get('/:id', requireRole('admin', 'director'), procurementsController.getById);

// Write: admin only
router.post('/', requireRole('admin'), validateRequest(createProcurementSchema), procurementsController.create);
router.put('/:id', requireRole('admin'), validateRequest(updateProcurementSchema), procurementsController.update);
router.delete('/:id', requireRole('admin'), procurementsController.delete);
router.post('/:id/fulfill', requireRole('admin'), validateRequest(fulfillProcurementOnlyAdminSchema), procurementsController.fulfill);

// Tạo phiếu Tăng tài sản từ đề nghị mua sắm đã duyệt cấp 3
router.post('/from-maintenance/:maintenanceId', requireRole('admin'), procurementsController.createFromMaintenance);

export default router;

