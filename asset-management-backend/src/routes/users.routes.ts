import { Router } from 'express';
import usersController, { uploadUserImport } from '../controllers/users.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/authorization.middleware';
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

// Admin only routes
router.get(
  '/',
  requireRole('admin'),
  usersController.getAllUsers
);

// Import người dùng (phải đặt trước /:id)
router.get(
  '/import/template',
  requireRole('admin'),
  usersController.downloadImportTemplate
);
router.post(
  '/import',
  requireRole('admin'),
  uploadUserImport,
  invalidateCache('users'),
  usersController.importUsers
);

router.get(
  '/:id',
  requireRole('admin'),
  usersController.getUserById
);

router.post(
  '/',
  requireRole('admin'),
  validateRequest(createUserSchema),
  invalidateCache('users'),
  usersController.createUser
);

router.put(
  '/:id',
  requireRole('admin'),
  validateRequest(updateUserSchema),
  invalidateCache('users'),
  usersController.updateUser
);

router.delete(
  '/:id',
  requireRole('admin'),
  invalidateCache('users'),
  usersController.deleteUser
);

// Reset password to default (Admin only)
router.post(
  '/:id/reset-password',
  requireRole('admin'),
  invalidateCache('users'),
  usersController.resetPassword
);

export default router;
