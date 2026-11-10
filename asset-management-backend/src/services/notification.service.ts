import { Notification, User, Department } from '../models';
import type { NotificationType } from '../models/Notification';
import logger from '../utils/logger';
import { sendPushToUsers } from '../config/webPush';

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

    // Push tới thiết bị đã đăng ký; lỗi push không ảnh hưởng nghiệp vụ.
    void sendPushToUsers(ids, {
      title: input.title,
      body: input.message || input.title,
      url: input.link || '/notifications',
      tag: `notif:${input.type}`,
    });
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
 * và trưởng của toàn bộ đơn vị cha/ông/kỵ phía trên — đồng bộ với quy tắc
 * duyệt theo cây trong inventory.service.
 */
async function getInventoryLevel1ApproverIds(
  reportDepartmentId: number | null | undefined
): Promise<number[]> {
  if (!reportDepartmentId) return [];

  const approverIds = new Set<number>();
  const visited = new Set<number>();
  let currentId: number | null | undefined = Number(reportDepartmentId);

  // Đi ngược lên cây đơn vị, tối đa 50 cấp để tránh dữ liệu vòng lặp.
  for (let depth = 0; currentId && depth < 50; depth += 1) {
    if (visited.has(currentId)) break;
    visited.add(currentId);

    const headIds = await getUserIdsByDepartmentRoles(currentId, ['department_head']);
    headIds.forEach((id) => approverIds.add(id));

    const dept = await Department.findByPk(currentId, {
      attributes: ['id', 'parent_department_id'],
    });
    currentId = (dept as any)?.parent_department_id as number | null | undefined;
  }

  return [...approverIds];
}

export default {
  notify,
  getAdminIds,
  getUserIdsByDepartmentRoles,
  getUserIdsByRoles,
  getInventoryLevel1ApproverIds,
};
