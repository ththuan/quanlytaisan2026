import { Router } from 'express';
import departmentsController from '../controllers/departments.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/authorization.middleware';
import { validateRequest } from '../middleware/validation';
import { createDepartmentSchema, updateDepartmentSchema } from '../utils/validators';
import multer from 'multer';
import { invalidateCache } from '../middleware/caching';

// Cấu hình multer để xử lý file upload
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (_req, file, cb) => {
    // Chỉ chấp nhận file Excel
    const allowedMimes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file Excel (.xlsx, .xls)'));
    }
  },
});

const uploadMiddleware = upload.single('file');

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Public routes (authenticated users can view)
router.get('/', departmentsController.getAllDepartments);
router.get('/tree', departmentsController.getDepartmentTree);
router.get('/:id', departmentsController.getDepartmentById);

// Admin/Manager only routes
router.post(
  '/',
  requireRole('admin'),
  validateRequest(createDepartmentSchema),
  invalidateCache('departments'),
  departmentsController.createDepartment
);

router.put(
  '/:id',
  requireRole('admin'),
  validateRequest(updateDepartmentSchema),
  invalidateCache('departments'),
  departmentsController.updateDepartment
);

router.delete(
  '/:id',
  requireRole('admin'),
  invalidateCache('departments'),
  departmentsController.deleteDepartment
);

// Import Excel routes (Admin only)
router.get(
  '/import/template',
  requireRole('admin'),
  departmentsController.downloadTemplate
);

router.post(
  '/import',
  requireRole('admin'),
  uploadMiddleware,
  invalidateCache('departments'),
  departmentsController.importExcel
);

export default router;
