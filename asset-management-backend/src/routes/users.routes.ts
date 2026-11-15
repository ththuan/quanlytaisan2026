import { Router } from 'express';
import usersController, { uploadUserImport } from '../controllers/users.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { requirePermission, adminOnlyRoles } from '../middleware/authorization.middleware';
import { validateRequest } from '../middleware/validation';
import { createUserSchema, updateUserSchema, updateProfileSchema } from '../utils/validators';
import { invalidateCache } from '../middleware/caching';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Get current user profile
router.get('/profile', usersController.getProfile);

// Update current user profile (chỉ trường an toàn, KHÔNG cho sửa role/quyền)
router.put('/profile', validateRequest(updateProfileSchema), invalidateCache('users'), usersController.updateProfile);

// Admin xem tất cả; Trưởng đơn vị chỉ xem người thuộc đơn vị mình
router.get(
  '/',
  requirePermission('users.view', ['admin', 'department_head']),
  usersController.getAllUsers
);

// Import người dùng (phải đặt trước /:id)
router.get(
  '/import/template',
  requirePermission('users.create', adminOnlyRoles),
  usersController.downloadImportTemplate
);
router.post(
  '/import',
  requirePermission('users.create', adminOnlyRoles),
  uploadUserImport,
  invalidateCache('users'),
  usersController.importUsers
);

router.get(
  '/:id',
  requirePermission('users.view', adminOnlyRoles),
  usersController.getUserById
);

router.post(
  '/',
  requirePermission('users.create', adminOnlyRoles),
  validateRequest(createUserSchema),
  invalidateCache('users'),
  usersController.createUser
);

router.put(
  '/:id',
  requirePermission('users.update', adminOnlyRoles),
  validateRequest(updateUserSchema),
  invalidateCache('users'),
  usersController.updateUser
);

router.delete(
  '/:id',
  requirePermission('users.delete', adminOnlyRoles),
  invalidateCache('users'),
  usersController.deleteUser
);

// Reset password to default (Admin only)
router.post(
  '/:id/reset-password',
  requirePermission('users.reset', adminOnlyRoles),
  invalidateCache('users'),
  usersController.resetPassword
);

export default router;
