import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { globalSearch } from '../services/search.service';

export const searchGlobal = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q : '';
    const user = req.user!;
    const result = await globalSearch(q, {
      id: user.id,
      role: user.role,
      department_id: user.department_id ?? undefined,
    });
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
