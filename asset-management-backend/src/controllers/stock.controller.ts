import { Request, Response, NextFunction } from 'express';
import stockService from '../services/stock.service';
import { AuthRequest } from '../middleware/auth.middleware';

export const listItems = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await stockService.listItemsWithStock(req.query);
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
};

export const createItem = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await stockService.createItem(req.body);
    res.status(201).json({ success: true, data });
  } catch (e) {
    next(e);
  }
};

export const createReceipt = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const data = await stockService.createReceipt(req.body, userId);
    res.status(201).json({ success: true, message: 'Nhập kho thành công', data });
  } catch (e) {
    next(e);
  }
};

export const createIssue = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const data = await stockService.createIssue(req.body, userId);
    res.status(201).json({ success: true, message: 'Xuất kho thành công', data });
  } catch (e) {
    next(e);
  }
};
