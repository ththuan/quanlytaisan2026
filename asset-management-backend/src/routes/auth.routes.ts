import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validation';
import { registerSchema, loginSchema, changePasswordSchema } from '../utils/validators';
import rateLimit from 'express-rate-limit';
import Joi from 'joi';

const router = Router();

// Rate limiter chuyên dùng cho 2FA: max 5 lần / 15 phút
const twoFaLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Quá nhiều lần thử xác thực. Vui lòng thử lại sau 15 phút.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const totpValidateSchema = Joi.object({
  temp_token: Joi.string().required(),
  totp_code: Joi.string().length(6).pattern(/^\d{6}$/).required()
    .messages({ 'string.pattern.base': 'Mã xác thực phải là 6 chữ số' }),
});

// Public routes
router.post('/register', validateBody(registerSchema), authController.register);
router.post('/login', validateBody(loginSchema), authController.login);
router.post('/2fa/validate-login', twoFaLimiter, validateBody(totpValidateSchema), authController.validateTotpLogin);
router.post('/refresh', authController.refreshToken);

// Protected routes
router.get('/me', authMiddleware, authController.getCurrentUser);
router.post('/change-password', authMiddleware, validateBody(changePasswordSchema), authController.changePassword);
router.post('/logout', authMiddleware, authController.logout);
router.post('/2fa/setup', authMiddleware, authController.setupTotp);
router.post('/2fa/enable', authMiddleware, authController.enableTotp);
router.post('/2fa/disable', authMiddleware, authController.disableTotp);

export default router;
