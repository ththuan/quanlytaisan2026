import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validation';
import { registerSchema, loginSchema, changePasswordSchema } from '../utils/validators';

const router = Router();

// Public routes
router.post('/register', validateBody(registerSchema), authController.register);
router.post('/login', validateBody(loginSchema), authController.login);
router.post('/2fa/validate-login', authController.validateTotpLogin);

// Protected routes
router.get('/me', authMiddleware, authController.getCurrentUser);
router.post('/change-password', authMiddleware, validateBody(changePasswordSchema), authController.changePassword);
router.post('/logout', authMiddleware, authController.logout);
router.post('/2fa/setup', authMiddleware, authController.setupTotp);
router.post('/2fa/enable', authMiddleware, authController.enableTotp);
router.post('/2fa/disable', authMiddleware, authController.disableTotp);

export default router;
