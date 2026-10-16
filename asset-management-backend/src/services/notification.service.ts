import { Notification, User, Department } from '../models';
import type { NotificationType } from '../models/Notification';
import logger from '../utils/logger';

export interface NotifyInput {
  /** Danh sách user_id nhận thông báo */
  userIds: number[];
  type: NotificationType;
  title: string;
  message?: string;
  link?: string;
  entityType?: string;
  entityId?: number;
  /** Không gửi cho người này (thường là người thực hiện hành động) */
  excludeUserId?: number;
}

/**
 * Tạo thông báo cho nhiều người nhận (bỏ trùng, bỏ người bị loại trừ).
 * Không throw — lỗi thông báo không được làm hỏng nghiệp vụ chính.
 */
async function notify(input: NotifyInput): Promise<void> {
  try {
    const ids = [...new Set(input.userIds)]
      .filter((id): id is number => Number.isFinite(id) && id > 0)
      .filter((id) => id !== input.excludeUserId);

    if (!ids.length) return;

    await Notification.bulkCreate(
      ids.map((user_id) => ({
        user_id,
        type: input.type,
        title: input.title,
        message: input.message ?? null,
        link: input.link ?? null,
        entity_type: input.entityType ?? null,
        entity_id: input.entityId ?? null,
        is_read: false,
      }))
    );
  } catch (error) {
    logger.error('Failed to create notifications:', error as any);
  }
}

/** Danh sách id của tất cả admin đang hoạt động. */
async function getAdminIds(): Promise<number[]> {
  const admins = await User.findAll({
    where: { role: 'admin', is_active: true },
    attributes: ['id'],
  });
  return admins.map((u) => u.id);
}

/** Danh sách id user theo vai trò trong một đơn vị. */
async function getUserIdsByDepartmentRoles(
  departmentId: number | null | undefined,
  roles: Array<'admin' | 'director' | 'department_head' | 'staff'>
): Promise<number[]> {
  if (!departmentId) return [];
  const users = await User.findAll({
    where: { role: roles as any, department_id: departmentId, is_active: true },
    attributes: ['id'],
  });
  return users.map((u) => u.id);
}

/** Danh sách id user theo vai trò (toàn hệ thống). */
async function getUserIdsByRoles(
  roles: Array<'admin' | 'director' | 'department_head' | 'staff'>
): Promise<number[]> {
  const users = await User.findAll({
    where: { role: roles as any, is_active: true },
    attributes: ['id'],
  });
  return users.map((u) => u.id);
}

/**
 * Người duyệt cấp 1 báo cáo kiểm kê: trưởng đơn vị của chính đơn vị báo cáo
 * và trưởng đơn vị cha (nếu có) — đồng bộ với quy tắc trong inventory.service.
 */
async function getInventoryLevel1ApproverIds(
  reportDepartmentId: number | null | undefined
): Promise<number[]> {
  if (!reportDepartmentId) return [];
  const ownHeadIds = await getUserIdsByDepartmentRoles(reportDepartmentId, ['department_head']);

  // Đơn vị cha
  const dept = await Department.findByPk(reportDepartmentId, {
    attributes: ['id', 'parent_department_id'],
  });
  const parentId = (dept as any)?.parent_department_id as number | null | undefined;
  const parentHeadIds = parentId
    ? await getUserIdsByDepartmentRoles(parentId, ['department_head'])
    : [];

  return [...ownHeadIds, ...parentHeadIds];
}

export default {
  notify,
  getAdminIds,
  getUserIdsByDepartmentRoles,
  getUserIdsByRoles,
  getInventoryLevel1ApproverIds,
};
