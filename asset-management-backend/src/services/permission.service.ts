import sequelize from '../config/database';
import { AuditLog, User, UserPermission } from '../models';
import {
  PERMISSION_MAP,
  PermissionGrantInput,
  PermissionScope,
  getRoleDefaultPermissions,
  isPermissionCode,
  normalizePermissionScope,
} from '../constants/permissions';
import { NotFoundError, ValidationError } from '../utils/errorHandler';

export interface PermissionState {
  customized: boolean;
  permissions: Map<string, PermissionScope>;
}

export interface PermissionPayload {
  permissions: Array<{ code: string; scope: PermissionScope }>;
  permissions_customized: boolean;
}

const CACHE_TTL_MS = 30_000;
const stateCache = new Map<number, { state: PermissionState; expiresAt: number }>();

const cloneState = (state: PermissionState): PermissionState => ({
  customized: state.customized,
  permissions: new Map(state.permissions),
});

export const clearPermissionCache = (userId?: number): void => {
  if (userId) {
    stateCache.delete(userId);
    return;
  }
  stateCache.clear();
};

export const getPermissionState = async (userId: number): Promise<PermissionState> => {
  const cached = stateCache.get(userId);
  if (cached && cached.expiresAt > Date.now()) {
    return cloneState(cached.state);
  }

  const user = await User.findByPk(userId, {
    attributes: ['id', 'role', 'permissions_customized'],
  });

  if (!user) {
    throw new NotFoundError('Không tìm thấy người dùng');
  }

  const customized = Boolean(user.permissions_customized);
  const permissions = customized
    ? new Map<string, PermissionScope>()
    : getRoleDefaultPermissions(user.role);

  if (customized) {
    const rows = await UserPermission.findAll({
      where: { user_id: userId },
      attributes: ['permission_code', 'scope'],
      raw: true,
    });
    rows.forEach((row: any) => {
      if (isPermissionCode(row.permission_code)) {
        permissions.set(row.permission_code, row.scope as PermissionScope);
      }
    });
  }

  const state: PermissionState = { customized, permissions };
  stateCache.set(userId, { state, expiresAt: Date.now() + CACHE_TTL_MS });
  return cloneState(state);
};

export const getPermissionPayload = async (userId: number): Promise<PermissionPayload> => {
  const state = await getPermissionState(userId);
  return {
    permissions: Array.from(state.permissions.entries()).map(([code, scope]) => ({ code, scope })),
    permissions_customized: state.customized,
  };
};

export const getPermissionDetails = async (userId: number) => {
  const user = await User.findByPk(userId, {
    attributes: ['id', 'username', 'fullname', 'role', 'department_id', 'permissions_customized'],
  });
  if (!user) throw new NotFoundError('Không tìm thấy người dùng');

  const customized = Boolean(user.permissions_customized);

  let grants: Array<{ code: string; scope: PermissionScope }>;
  if (customized) {
    const rows = await UserPermission.findAll({
      where: { user_id: userId },
      attributes: ['permission_code', 'scope', 'granted_by', 'created_at', 'updated_at'],
      order: [['permission_code', 'ASC']],
      raw: true,
    });
    grants = rows
      .filter((row: any) => PERMISSION_MAP.has(row.permission_code))
      .map((row: any) => ({ code: row.permission_code, scope: row.scope as PermissionScope }));
  } else {
    grants = Array.from(getRoleDefaultPermissions(user.role).entries())
      .map(([code, scope]) => ({ code, scope }))
      .sort((a, b) => a.code.localeCompare(b.code));
  }

  return {
    user_id: userId,
    permissions_customized: customized,
    permissions: grants.map((grant) => {
      const definition = PERMISSION_MAP.get(grant.code)!;
      return {
        code: grant.code,
        scope: grant.scope,
        module: definition.module,
        module_label: definition.moduleLabel,
        label: definition.label,
        action: definition.action,
      };
    }),
  };
};

export const setUserPermissions = async (
  userId: number,
  grants: PermissionGrantInput[],
  grantedBy: number,
): Promise<PermissionPayload> => {
  const user = await User.findByPk(userId, {
    attributes: ['id', 'username', 'role', 'permissions_customized'],
  });
  if (!user) throw new NotFoundError('Không tìm thấy người dùng');

  if (user.role === 'admin') {
    throw new ValidationError('Tài khoản admin mặc định có toàn bộ quyền, không cần phân quyền riêng.');
  }

  if (!Array.isArray(grants)) {
    throw new ValidationError('Danh sách quyền không hợp lệ.');
  }

  const normalized = new Map<string, PermissionScope>();
  for (const grant of grants) {
    if (!grant || typeof grant.code !== 'string') {
      throw new ValidationError('Quyền không hợp lệ.');
    }
    const definition = PERMISSION_MAP.get(grant.code);
    if (!definition) {
      throw new ValidationError(`Quyền không tồn tại: ${grant.code}`);
    }
    if (definition.adminOnly) {
      throw new ValidationError(`Quyền "${definition.label}" chỉ dành cho quản trị viên.`);
    }
    normalized.set(grant.code, normalizePermissionScope(grant.code, grant.scope));
  }

  const oldRows = await UserPermission.findAll({
    where: { user_id: userId },
    attributes: ['permission_code', 'scope'],
    raw: true,
  });

  await sequelize.transaction(async (transaction) => {
    await UserPermission.destroy({ where: { user_id: userId }, transaction });
    if (normalized.size > 0) {
      await UserPermission.bulkCreate(
        Array.from(normalized.entries()).map(([code, scope]) => ({
          user_id: userId,
          permission_code: code,
          scope,
          granted_by: grantedBy,
        })),
        { transaction },
      );
    }
    await user.update({ permissions_customized: true }, { transaction });
  });

  const newRows = Array.from(normalized.entries()).map(([code, scope]) => ({ code, scope }));

  await AuditLog.create({
    user_id: grantedBy,
    action: 'permission',
    table_name: 'user_permissions',
    record_id: userId,
    old_value: {
      permissions_customized: Boolean(user.permissions_customized),
      permissions: oldRows.map((row: any) => ({ code: row.permission_code, scope: row.scope })),
    },
    new_value: {
      permissions_customized: true,
      permissions: newRows,
    },
  });

  clearPermissionCache(userId);
  return {
    permissions: newRows,
    permissions_customized: true,
  };
};

export const resetUserPermissionsToLegacy = async (
  userId: number,
  actorId: number,
): Promise<PermissionPayload> => {
  const user = await User.findByPk(userId, { attributes: ['id', 'role', 'permissions_customized'] });
  if (!user) throw new NotFoundError('Không tìm thấy người dùng');

  const oldRows = await UserPermission.findAll({
    where: { user_id: userId },
    attributes: ['permission_code', 'scope'],
    raw: true,
  });

  await sequelize.transaction(async (transaction) => {
    await UserPermission.destroy({ where: { user_id: userId }, transaction });
    await user.update({ permissions_customized: false }, { transaction });
  });

  await AuditLog.create({
    user_id: actorId,
    action: 'permission',
    table_name: 'user_permissions',
    record_id: userId,
    old_value: {
      permissions_customized: Boolean(user.permissions_customized),
      permissions: oldRows.map((row: any) => ({ code: row.permission_code, scope: row.scope })),
    },
    new_value: { permissions_customized: false, permissions: [] },
  });

  clearPermissionCache(userId);
  return {
    permissions: Array.from(getRoleDefaultPermissions(user.role).entries()).map(([code, scope]) => ({
      code,
      scope,
    })),
    permissions_customized: false,
  };
};

export const countCustomizedUsers = async (): Promise<number> =>
  User.count({ where: { permissions_customized: true } as any });

export const getUserPermissionCodes = async (userId: number): Promise<string[]> => {
  const state = await getPermissionState(userId);
  return Array.from(state.permissions.keys());
};

export const hasExplicitPermission = async (
  userId: number,
  code: string,
): Promise<PermissionScope | undefined> => {
  const state = await getPermissionState(userId);
  if (!state.customized) return undefined;
  return state.permissions.get(code);
};
