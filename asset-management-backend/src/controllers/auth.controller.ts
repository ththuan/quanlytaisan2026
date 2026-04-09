import { Request, Response, NextFunction } from 'express';
import authService from '../services/auth.service';

type AuthenticatedRequest = Request & { user?: { id: number } };

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await authService.register(req.body);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await authService.login(req.body ?? {});

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getCurrentUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const user = await authService.getCurrentUser(userId);

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { old_password, new_password } = req.body;

    await authService.changePassword(userId, old_password, new_password);

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.status(200).json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refresh_token } = req.body;
    if (!refresh_token || typeof refresh_token !== 'string') {
      res.status(400).json({ success: false, message: 'refresh_token là bắt buộc' });
      return;
    }
    const result = await authService.refreshAccessToken(refresh_token);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// ── TOTP / Google Authenticator ───────────────────────────────────────────────

/** POST /auth/2fa/validate-login  — verify TOTP code during login */
export const validateTotpLogin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { temp_token, totp_code } = req.body;
    if (!temp_token || !totp_code) {
      res.status(400).json({ success: false, message: 'temp_token và totp_code là bắt buộc' });
      return;
    }
    const result = await authService.validateTotpLogin(temp_token, String(totp_code));
    res.status(200).json({ success: true, message: 'Login successful', data: result });
  } catch (error) {
    next(error);
  }
};

/** POST /auth/2fa/setup  – generate QR code (must be logged in) */
export const setupTotp = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await authService.generateTotpSetup(req.user!.id);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

/** POST /auth/2fa/enable  – confirm TOTP code and activate 2FA */
export const enableTotp = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { totp_code } = req.body;
    if (!totp_code) {
      res.status(400).json({ success: false, message: 'totp_code là bắt buộc' });
      return;
    }
    await authService.enableTotp(req.user!.id, String(totp_code));
    res.status(200).json({ success: true, message: 'Xác thực 2 bước đã được bật.' });
  } catch (error) {
    next(error);
  }
};

/** POST /auth/2fa/disable  – disable 2FA (requires current password) */
export const disableTotp = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { password } = req.body;
    if (!password) {
      res.status(400).json({ success: false, message: 'password là bắt buộc' });
      return;
    }
    await authService.disableTotp(req.user!.id, password);
    res.status(200).json({ success: true, message: 'Xác thực 2 bước đã được tắt.' });
  } catch (error) {
    next(error);
  }
};
