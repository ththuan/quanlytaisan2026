import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import {
  PERMISSION_DEFINITIONS,
  PERMISSION_MODULES,
  PERMISSION_PRESETS,
  ROLE_DEFAULT_PERMISSIONS,
} from '../constants/permissions';
import {
  getPermissionDetails,
  resetUserPermissionsToLegacy,
  setUserPermissions,
} from '../services/permission.service';

export const getPermissionCatalog = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    res.json({
      success: true,
      data: {
        modules: PERMISSION_MODULES,
        definitions: PERMISSION_DEFINITIONS,
        presets: PERMISSION_PRESETS,
        role_defaults: ROLE_DEFAULT_PERMISSIONS,
        scopes: [
          { value: 'own', label: 'Cá nhân' },
          { value: 'department', label: 'Đơn vị' },
          { value: 'all', label: 'Toàn trường' },
        ],
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getUserPermissions = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = Number.parseInt(req.params.id, 10);
    const data = await getPermissionDetails(userId);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const updateUserPermissions = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = Number.parseInt(req.params.id, 10);
    const actorId = req.user!.id;
    const grants = Array.isArray(req.body?.permissions) ? req.body.permissions : [];
    const data = await setUserPermissions(userId, grants, actorId);
    res.json({
      success: true,
      message: 'Đã cập nhật quyền chức năng',
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const resetUserPermissions = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = Number.parseInt(req.params.id, 10);
    const actorId = req.user!.id;
    const data = await resetUserPermissionsToLegacy(userId, actorId);
    res.json({
      success: true,
      message: 'Đã chuyển người dùng về quyền mặc định theo vai trò',
      data,
    });
  } catch (error) {
    next(error);
  }
};
