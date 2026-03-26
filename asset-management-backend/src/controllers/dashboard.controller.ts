import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import dashboardService from '../services/dashboard.service';

export const getOverviewStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const query = { ...req.query };
    if (!['admin', 'director'].includes(req.user?.role || '')) {
      const deptId = req.user?.department_id;
      if (deptId) query.departmentId = String(deptId);
    }
    const data = await dashboardService.getOverviewStats(query);
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
};

export const getAssetStatusStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const query = { ...req.query };
    if (!['admin', 'director'].includes(req.user?.role || '')) {
      const deptId = req.user?.department_id;
      if (deptId) query.departmentId = String(deptId);
    }
    const data = await dashboardService.getAssetStatusStats(query);
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
};

export const getDepartmentStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const query = { ...req.query };
    // Với Trưởng đơn vị/Viên chức, có thể muốn xem nhánh phòng ban của mình
    if (!['admin', 'director'].includes(req.user?.role || '')) {
      const deptId = req.user?.department_id;
      if (deptId) query.rootDepartmentId = String(deptId);
    }
    const data = await dashboardService.getDepartmentStats(query);
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
};

export const getProcurementStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const query = { ...req.query };
    if (!['admin', 'director'].includes(req.user?.role || '')) {
      const deptId = req.user?.department_id;
      if (deptId) query.departmentId = String(deptId);
    }
    const data = await dashboardService.getProcurementStats(query);
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
};

export const getStockStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const query = { ...req.query };
    // Nhập/Xuất kho liên quan đến đơn vị
    if (!['admin', 'director'].includes(req.user?.role || '')) {
      const deptId = req.user?.department_id;
      if (deptId) query.departmentId = String(deptId);
    }
    const data = await dashboardService.getStockStats(query);
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
};

export const getCategoryBreakdown = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const query = { ...req.query };
    if (!['admin', 'director'].includes(req.user?.role || '')) {
      const deptId = req.user?.department_id;
      if (deptId) query.departmentId = String(deptId);
    }
    const data = await dashboardService.getCategoryBreakdown(query);
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
};

export const getAuditLogs = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const query = { ...req.query };
    // Với người dùng thường, chỉ xem log liên quan đến đơn vị mình hoặc bản thân
    if (!['admin', 'director'].includes(req.user?.role || '')) {
      const deptId = req.user?.department_id;
      if (deptId) query.departmentId = String(deptId);
    }
    const data = await dashboardService.getAuditLogs(query);
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
};

export const getMaintenanceStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const query = { ...req.query };
    if (!['admin', 'director'].includes(req.user?.role || '')) {
      const deptId = req.user?.department_id;
      if (deptId) query.departmentId = String(deptId);
    }
    const data = await dashboardService.getMaintenanceStats(query);
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
};

export const getHierarchyStats = async (req: AuthRequest, res: Response, _next: NextFunction) => {
  try {
    const query = { ...req.query };
    if (!['admin', 'director'].includes(req.user?.role || '')) {
      const deptId = req.user?.department_id;
      if (deptId) query.departmentId = String(deptId);
    }
    const data = await dashboardService.getHierarchyStats(query);
    res.json({ success: true, data });
  } catch (e) {
    console.error('[getHierarchyStats]', e);
    res.json({ success: true, data: [] });
  }
};