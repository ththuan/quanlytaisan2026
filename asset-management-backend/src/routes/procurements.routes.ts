import { Router } from 'express';
import procurementsController from '../controllers/procurements.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { requirePermission, adminOnlyRoles } from '../middleware/authorization.middleware';
import { validateRequest } from '../middleware/validation';
import { requireUnlockedRecord } from '../middleware/recordLock.middleware';
import { auditLog } from '../middleware/logging';
import { createProcurementSchema, updateProcurementSchema, fulfillProcurementOnlyAdminSchema } from '../utils/validators';

const router = Router();

router.use(authenticateToken);

// Read: admin only
router.get('/export/excel', requirePermission('procurement.export', adminOnlyRoles), procurementsController.exportExcel);
router.get('/summary/yearly', requirePermission('procurement.view', adminOnlyRoles), procurementsController.getYearlySummary);
router.get('/', requirePermission('procurement.view', adminOnlyRoles), procurementsController.getAll);
router.get('/:id', requirePermission('procurement.view', adminOnlyRoles), procurementsController.getById);

// Write: admin only
router.post('/', requirePermission('procurement.create', adminOnlyRoles), validateRequest(createProcurementSchema), auditLog('create'), procurementsController.create);
router.put('/:id', requirePermission('procurement.update', adminOnlyRoles), requireUnlockedRecord('procurement'), validateRequest(updateProcurementSchema), auditLog('update'), procurementsController.update);
router.delete('/:id', requirePermission('procurement.delete', adminOnlyRoles), requireUnlockedRecord('procurement'), auditLog('delete'), procurementsController.delete);
router.post('/:id/fulfill', requirePermission('procurement.fulfill', adminOnlyRoles), requireUnlockedRecord('procurement'), validateRequest(fulfillProcurementOnlyAdminSchema), auditLog('approve'), procurementsController.fulfill);

// Tạo phiếu tăng tài sản từ yêu cầu mua sắm đã duyệt.
router.post('/from-maintenance/:maintenanceId', requirePermission('procurement.create', adminOnlyRoles), auditLog('create'), procurementsController.createFromMaintenance);

export default router;

