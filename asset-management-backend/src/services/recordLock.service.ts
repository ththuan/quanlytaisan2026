import crypto from 'crypto';
import { Op } from 'sequelize';
import { RecordLock, User } from '../models';
import { ConflictError, NotFoundError, ValidationError } from '../utils/errorHandler';

export type LockEntityType = 'maintenance' | 'procurement' | 'inventory_report';

const LOCK_TTL_MS = 10 * 60 * 1000;
const ALLOWED_ENTITIES: LockEntityType[] = ['maintenance', 'procurement', 'inventory_report'];

const assertEntityType = (entityType: string): LockEntityType => {
  if (!ALLOWED_ENTITIES.includes(entityType as LockEntityType)) {
    throw new ValidationError('Loại hồ sơ không hỗ trợ khóa');
  }
  return entityType as LockEntityType;
};

const cleanupExpired = async (): Promise<void> => {
  await RecordLock.destroy({ where: { expires_at: { [Op.lt]: new Date() } } });
};

const loadLockWithUser = async (entityType: LockEntityType, entityId: number) => {
  const lock = await RecordLock.findOne({
    where: { entity_type: entityType, entity_id: entityId },
    include: [{ model: User, as: 'lockedBy', attributes: ['id', 'username', 'fullname'] }],
  });
  return lock;
};

const lockPayload = (lock: RecordLock, userId: number) => {
  const lockedBy = (lock as any).lockedBy;
  return {
    entity_type: lock.entity_type,
    entity_id: lock.entity_id,
    locked: true,
    mine: Number(lock.locked_by) === Number(userId),
    locked_by: lockedBy
      ? { id: Number(lock.locked_by), fullname: lockedBy.fullname, username: lockedBy.username }
      : { id: Number(lock.locked_by) },
    expires_at: lock.expires_at,
  };
};

export const claimRecord = async (entityTypeRaw: string, entityId: number, userId: number) => {
  const entityType = assertEntityType(entityTypeRaw);
  if (!Number.isFinite(entityId) || entityId <= 0) throw new ValidationError('ID hồ sơ không hợp lệ');

  await cleanupExpired();
  const existing = await loadLockWithUser(entityType, entityId);

  if (existing) {
    if (Number(existing.locked_by) === Number(userId)) {
      const token = crypto.randomBytes(24).toString('hex');
      await existing.update({
        lock_token: token,
        expires_at: new Date(Date.now() + LOCK_TTL_MS),
      });
      return { ...lockPayload(existing, userId), lock_token: token };
    }
    throw new ConflictError(
      `Hồ sơ đang được ${(existing as any).lockedBy?.fullname || (existing as any).lockedBy?.username || 'người khác'} xử lý. Vui lòng thử lại sau.`,
    );
  }

  const token = crypto.randomBytes(24).toString('hex');
  try {
    const lock = await RecordLock.create({
      entity_type: entityType,
      entity_id: entityId,
      locked_by: userId,
      lock_token: token,
      expires_at: new Date(Date.now() + LOCK_TTL_MS),
    } as any);
    return { ...lockPayload(lock, userId), lock_token: token };
  } catch (error: any) {
    // Hai người claim cùng lúc: unique constraint sẽ chặn người đến sau.
    if (String(error?.name).includes('Unique') || String(error?.message).includes('unique')) {
      const current = await loadLockWithUser(entityType, entityId);
      if (current && Number(current.locked_by) !== Number(userId)) {
        throw new ConflictError(
          `Hồ sơ đang được ${(current as any).lockedBy?.fullname || 'người khác'} xử lý. Vui lòng thử lại sau.`,
        );
      }
    }
    throw error;
  }
};

export const heartbeatRecord = async (
  entityTypeRaw: string,
  entityId: number,
  userId: number,
  token: string,
) => {
  const entityType = assertEntityType(entityTypeRaw);
  const lock = await RecordLock.findOne({
    where: { entity_type: entityType, entity_id: entityId },
  });
  if (!lock) throw new NotFoundError('Hồ sơ không còn khóa');
  if (Number(lock.locked_by) !== Number(userId) || lock.lock_token !== token) {
    throw new ConflictError('Bạn không còn giữ khóa hồ sơ này');
  }
  await lock.update({ expires_at: new Date(Date.now() + LOCK_TTL_MS) });
  return { locked: true, expires_at: lock.expires_at };
};

export const releaseRecord = async (
  entityTypeRaw: string,
  entityId: number,
  userId: number,
  role?: string,
  force = false,
) => {
  const entityType = assertEntityType(entityTypeRaw);
  const lock = await RecordLock.findOne({
    where: { entity_type: entityType, entity_id: entityId },
  });
  if (!lock) return { released: false };
  if (Number(lock.locked_by) !== Number(userId) && role !== 'admin' && !force) {
    throw new ConflictError('Hồ sơ đang được người khác xử lý');
  }
  await lock.destroy();
  return { released: true };
};

export const getRecordLock = async (entityTypeRaw: string, entityId: number, userId: number) => {
  const entityType = assertEntityType(entityTypeRaw);
  await cleanupExpired();
  const lock = await loadLockWithUser(entityType, entityId);
  if (!lock) return { locked: false };
  return lockPayload(lock, userId);
};

export const assertRecordUnlocked = async (
  entityTypeRaw: string,
  entityId: number,
  userId: number,
  role?: string,
) => {
  const entityType = assertEntityType(entityTypeRaw);
  await cleanupExpired();
  const lock = await RecordLock.findOne({
    where: { entity_type: entityType, entity_id: entityId },
    include: [{ model: User, as: 'lockedBy', attributes: ['id', 'username', 'fullname'] }],
  });
  if (!lock) return;
  if (Number(lock.locked_by) === Number(userId) || role === 'admin') return;
  throw new ConflictError(
    `Hồ sơ đang được ${(lock as any).lockedBy?.fullname || 'người khác'} xử lý. Vui lòng tải lại sau.`,
  );
};
