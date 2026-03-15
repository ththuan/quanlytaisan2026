import { Request, Response, NextFunction } from 'express';
import stockHistoryService from '../services/stockHistory.service';

export const getHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await stockHistoryService.getHistory(req.query);
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
};
