import { Request, Response, NextFunction } from 'express';
import { export04a, export04b, export04c, export04d, exportKeKhai } from '../services/exportTT120.service';
import { AuthRequest } from '../middleware/auth.middleware';

/**
 * Controller for TT120/2025/TT-BTC public disclosure reports
 * ACCESS: admin, director only (regulatory reports)
 */

export async function exportReport04a(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const buffer = await export04a(year);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="04a-CKTSC_HinhThanh_${year}.xlsx"`);
    res.send(buffer);
  } catch (error) { next(error); }
}

export async function exportReport04b(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const buffer = await export04b(year);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="04b-CKTSC_SuDung_${year}.xlsx"`);
    res.send(buffer);
  } catch (error) { next(error); }
}

export async function exportReport04c(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const buffer = await export04c(year);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="04c-CKTSC_XuLy_${year}.xlsx"`);
    res.send(buffer);
  } catch (error) { next(error); }
}

export async function exportReport04d(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const buffer = await export04d(year);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="04d-CKTSC_KhaiThac_${year}.xlsx"`);
    res.send(buffer);
  } catch (error) { next(error); }
}

export async function exportKeKhaiReport(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const buffer = await exportKeKhai(year);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="KeKhai_TSC_${year}.xlsx"`);
    res.send(buffer);
  } catch (error) { next(error); }
}
