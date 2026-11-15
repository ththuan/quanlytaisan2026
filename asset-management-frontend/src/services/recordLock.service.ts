import api from './api';

export type RecordLockEntity = 'maintenance' | 'procurement' | 'inventory_report';

export interface RecordLockInfo {
  locked: boolean;
  mine?: boolean;
  locked_by?: { id: number; fullname?: string; username?: string };
  expires_at?: string;
  lock_token?: string;
}

export const recordLockService = {
  async claim(entityType: RecordLockEntity, entityId: number): Promise<{ data: RecordLockInfo }> {
    return api.post('/locks/claim', { entity_type: entityType, entity_id: entityId });
  },

  async release(
    entityType: RecordLockEntity,
    entityId: number,
    force = false,
  ): Promise<{ data: { released: boolean } }> {
    return api.post('/locks/release', { entity_type: entityType, entity_id: entityId, force });
  },

  async heartbeat(
    entityType: RecordLockEntity,
    entityId: number,
    lockToken: string,
  ): Promise<{ data: RecordLockInfo }> {
    return api.post('/locks/heartbeat', {
      entity_type: entityType,
      entity_id: entityId,
      lock_token: lockToken,
    });
  },

  async status(entityType: RecordLockEntity, entityId: number): Promise<{ data: RecordLockInfo }> {
    return api.get(`/locks/${entityType}/${entityId}`);
  },
};
