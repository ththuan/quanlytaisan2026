import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import constructionWorkService, { type ConstructionScope } from '../services/constructionWork.service';

const getContext = (req: AuthRequest) => ({
  userId: req.user?.id,
  departmentId: req.user?.department_id ?? null,
  scope: (req.permissionScope || 'own') as ConstructionScope,
});

export const listConstructionWorks = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await constructionWorkService.list(req.query, getContext(req));
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const getConstructionWork = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const work = await constructionWorkService.getById(Number(req.params.id), getContext(req));
    res.json({ success: true, data: work });
  } catch (error) {
    next(error);
  }
};

export const createConstructionWork = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const work = await constructionWorkService.create(req.body, getContext(req));
    res.status(201).json({ success: true, data: work, message: 'Đã tạo công trình' });
  } catch (error) {
    next(error);
  }
};

export const updateConstructionWork = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const work = await constructionWorkService.update(Number(req.params.id), req.body, getContext(req));
    res.json({ success: true, data: work, message: 'Đã cập nhật công trình' });
  } catch (error) {
    next(error);
  }
};

export const deleteConstructionWork = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    await constructionWorkService.remove(Number(req.params.id), getContext(req));
    res.json({ success: true, message: 'Đã xóa công trình' });
  } catch (error) {
    next(error);
  }
};
