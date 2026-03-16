import { Router } from 'express';
import usersController, { uploadUserImport } from '../controllers/users.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/authorization.middleware';
import { validateRequest } from '../middleware/validation';
import { createUserSchema, updateUserSchema } from '../utils/validators';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Get current user profile
router.get('/profile', usersController.getProfile);

// Update current user profile
router.put('/profile', validateRequest(updateUserSchema), usersController.updateProfile);

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
  usersController.createUser
);

router.put(
  '/:id',
  requireRole('admin'),
  validateRequest(updateUserSchema),
  usersController.updateUser
);

router.delete(
  '/:id',
  requireRole('admin'),
  usersController.deleteUser
);

// Reset password to default (Admin only)
router.post(
  '/:id/reset-password',
  requireRole('admin'),
  usersController.resetPassword
);

export default router;
