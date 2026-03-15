import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import systemAdminService from '../services/systemAdmin.service';

export const getSystemInfo = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await systemAdminService.getSystemInfo();
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
};

export const getDockerInfo = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await systemAdminService.getDockerInfo();
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
};

export const getDatabaseInfo = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await systemAdminService.getDatabaseInfo();
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
};

export const restartContainer = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { containerName } = req.params;
    const result = await systemAdminService.restartContainer(containerName);
    res.json({ success: result.success, message: result.message });
  } catch (e) {
    next(e);
  }
};

export const stopContainer = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { containerName } = req.params;
    const result = await systemAdminService.stopContainer(containerName);
    res.json({ success: result.success, message: result.message });
  } catch (e) {
    next(e);
  }
};

export const startContainer = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { containerName } = req.params;
    const result = await systemAdminService.startContainer(containerName);
    res.json({ success: result.success, message: result.message });
  } catch (e) {
    next(e);
  }
};

export const getContainerLogs = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { containerName } = req.params;
    const lines = parseInt(req.query.lines as string) || 100;
    const result = await systemAdminService.getContainerLogs(containerName, lines);
    res.json({ success: result.success, logs: result.logs, error: result.error });
  } catch (e) {
    next(e);
  }
};

export const createBackup = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await systemAdminService.createBackup();
    res.json({ success: result.success, message: result.message, filename: result.filename });
  } catch (e) {
    next(e);
  }
};

export const listBackups = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await systemAdminService.listBackups();
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
};

export const resetBusinessData = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { confirm } = req.body;
    if (confirm !== 'RESET_DATA') {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng xác nhận bằng cách gửi confirm: "RESET_DATA"',
      });
    }
    const result = await systemAdminService.resetBusinessData();
    res.json({ success: result.success, message: result.message });
  } catch (e) {
    next(e);
  }
};

export const runMigrations = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await systemAdminService.runMigrations();
    res.json({ success: result.success, message: result.message });
  } catch (e) {
    next(e);
  }
};

export const seedDatabase = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await systemAdminService.seedDatabase();
    res.json({ success: result.success, message: result.message });
  } catch (e) {
    next(e);
  }
};

export const getHealthCheck = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await systemAdminService.getHealthCheck();
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
};
