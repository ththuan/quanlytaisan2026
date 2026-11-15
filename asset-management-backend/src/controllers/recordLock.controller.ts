import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import {
  claimRecord,
  getRecordLock,
  heartbeatRecord,
  releaseRecord,
} from '../services/recordLock.service';

const readEntity = (req: AuthRequest) => ({
  entityType: String(req.body?.entity_type || req.query?.entity_type || ''),
  entityId: Number(req.body?.entity_id || req.query?.entity_id),
});

export const claim = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { entityType, entityId } = readEntity(req);
    const data = await claimRecord(entityType, entityId, req.user!.id);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const release = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { entityType, entityId } = readEntity(req);
    const force = Boolean(req.body?.force);
    const data = await releaseRecord(
      entityType,
      entityId,
      req.user!.id,
      req.user!.role,
      force,
    );
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const status = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const entityType = String(req.params.entityType || '');
    const entityId = Number(req.params.entityId);
    const data = await getRecordLock(entityType, entityId, req.user!.id);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const heartbeat = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { entityType, entityId } = readEntity(req);
    const token = String(req.body?.lock_token || '');
    const data = await heartbeatRecord(entityType, entityId, req.user!.id, token);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
