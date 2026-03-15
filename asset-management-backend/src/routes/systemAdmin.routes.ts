import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/authorization.middleware';
import * as systemAdminController from '../controllers/systemAdmin.controller';

const router = Router();

router.use(authenticateToken);
router.use(requireRole('admin'));

router.get('/health', systemAdminController.getHealthCheck);
router.get('/system', systemAdminController.getSystemInfo);
router.get('/docker', systemAdminController.getDockerInfo);
router.get('/database', systemAdminController.getDatabaseInfo);

router.post('/docker/:containerName/restart', systemAdminController.restartContainer);
router.post('/docker/:containerName/stop', systemAdminController.stopContainer);
router.post('/docker/:containerName/start', systemAdminController.startContainer);
router.get('/docker/:containerName/logs', systemAdminController.getContainerLogs);

router.post('/backup', systemAdminController.createBackup);
router.get('/backups', systemAdminController.listBackups);

router.post('/reset-data', systemAdminController.resetBusinessData);
router.post('/migrate', systemAdminController.runMigrations);
router.post('/seed', systemAdminController.seedDatabase);

export default router;
