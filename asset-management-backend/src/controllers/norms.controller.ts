import { Response, NextFunction } from 'express';
import normService from '../services/norm.service';
import { AuthRequest } from '../middleware/auth.middleware';

export const listNorms = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await normService.listNorms(req.query);
    res.json({ success: true, data });
  } catch (e) { next(e); }
};

export const createNorm = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await normService.createNorm(req.body || {});
    res.status(201).json({ success: true, data });
  } catch (e) { next(e); }
};

export const updateNorm = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await normService.updateNorm(parseInt(req.params.id, 10), req.body || {});
    res.json({ success: true, data });
  } catch (e) { next(e); }
};

export const deleteNorm = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await normService.deleteNorm(parseInt(req.params.id, 10));
    res.json({ success: true, message: 'Đã xóa định mức' });
  } catch (e) { next(e); }
};

export const listWarnings = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await normService.listWarnings(req.query);
    res.json({ success: true, data });
  } catch (e) { next(e); }
};

export const acknowledgeWarning = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await normService.acknowledgeWarning(parseInt(req.params.id, 10), req.user?.id);
    res.json({ success: true, data });
  } catch (e) { next(e); }
};
