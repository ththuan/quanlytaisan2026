import { Request, Response, NextFunction } from 'express';
import { ForbiddenError, UnauthorizedError, NotFoundError } from '../utils/errorHandler';
import { MaintenanceRequest, AssetTransfer } from '../models';

type UserPayload = { id: number; role: string; department_id?: number };

type RequestWithUser = Request & { user?: UserPayload };

export type UserRole = 'admin' | 'director' | 'department_head' | 'staff';

export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: RequestWithUser, res: Response, next: NextFunction): void => {
    try {
      const user = req.user;
      if (!user) {
        throw new UnauthorizedError('User not authenticated');
      }

      const userRole = user.role as UserRole;

      if (!allowedRoles.includes(userRole)) {
        throw new ForbiddenError('You do not have permission to access this resource');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Check if user is admin
export const isAdmin = authorize('admin');

// Check if user is admin or director (cả hai đều quản lý tài sản)
export const isAdminOrManager = authorize('admin', 'director');

// Check if user is director
export const isDirector = authorize('director');

// Check if user is department head
export const isDepartmentHead = authorize('department_head');

/** Alias để dùng trong routes: requireRole('admin') thay vì authorize('admin') */
export const requireRole = (...roles: UserRole[]) => authorize(...roles);

// Check if user can approve maintenance requests (multi-level)
export const canApproveMaintenanceRequest = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      throw new UnauthorizedError('User not authenticated');
    }

    const requestId = parseInt(req.params.id);
    const maintenance = await MaintenanceRequest.findByPk(requestId);

    if (!maintenance) {
      throw new NotFoundError('Maintenance request not found');
    }

    const status = maintenance.status;

    // Department Head can approve at level 1 (pending/new status)
    // Only for requests from their department
    if (user.role === 'department_head') {
      const isFromMyDepartment = user.department_id === maintenance.department_id;
      const isMyTurn = status === 'new' || status === 'pending';

      if (isFromMyDepartment && isMyTurn) {
        return next();
      }
    }

    // Admin can approve at level 2 (after head approval) AND level 4 (repair completion)
    if (user.role === 'admin') {
      const isMyTurn = status === 'approved_by_head' || status === 'repair_completed';

      if (isMyTurn) {
        return next();
      }
    }

    // Director can approve at level 3 (after admin approval)
    if (user.role === 'director') {
      const isMyTurn = status === 'approved_by_admin';

      if (isMyTurn) {
        return next();
      }
    }

    throw new ForbiddenError('Không có quyền duyệt yêu cầu này hoặc chưa đến lượt duyệt');
  } catch (error) {
    next(error);
  }
};

// Check if user can view maintenance request
export const canViewMaintenanceRequest = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      throw new UnauthorizedError('User not authenticated');
    }

    const requestId = parseInt(req.params.id);
    const maintenance = await MaintenanceRequest.findByPk(requestId);

    if (!maintenance) {
      throw new NotFoundError('Maintenance request not found');
    }

    // Admin and Director can view all requests
    if (user.role === 'admin' || user.role === 'director') {
      return next();
    }

    // Department Head can view requests from their department
    if (user.role === 'department_head') {
      if (user.department_id === maintenance.department_id) {
        return next();
      }
    }

    // Staff can only view their own requests
    if (user.role === 'staff') {
      if (user.id === maintenance.requested_by) {
        return next();
      }
    }

    throw new ForbiddenError('Không có quyền xem yêu cầu này');
  } catch (error) {
    next(error);
  }
};

// Check if user can approve transfer requests
export const canApproveTransfer = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      throw new UnauthorizedError('User not authenticated');
    }

    const transferId = parseInt(req.params.id);
    const transfer = await AssetTransfer.findByPk(transferId);

    if (!transfer) {
      throw new NotFoundError('Transfer request not found');
    }

    const status = transfer.status;

    // Admin can approve all transfers
    if (user.role === 'admin') {
      return next();
    }

    // Department Head can approve transfers from their department
    if (user.role === 'department_head') {
      const isFromMyDepartment = user.department_id === transfer.from_department_id;
      const isPending = status === 'pending';

      if (isFromMyDepartment && isPending) {
        return next();
      }
    }

    throw new ForbiddenError('Không có quyền duyệt yêu cầu điều chuyển này');
  } catch (error) {
    next(error);
  }
};

// Check if user can view transfer request
export const canViewTransfer = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      throw new UnauthorizedError('User not authenticated');
    }

    const transferId = parseInt(req.params.id);
    const transfer = await AssetTransfer.findByPk(transferId);

    if (!transfer) {
      throw new NotFoundError('Transfer request not found');
    }


    // Admin and Director can view all transfers
    if (user.role === 'admin' || user.role === 'director') {
      return next();
    }

    // Department Head can view transfers from/to their department
    if (user.role === 'department_head') {
      if (user.department_id === transfer.from_department_id || 
          user.department_id === transfer.to_department_id) {
        return next();
      }
    }

    // Staff can only view their own requests
    if (user.role === 'staff') {
      if (user.id === transfer.requested_by) {
        return next();
      }
    }

    throw new ForbiddenError('Không có quyền xem yêu cầu điều chuyển này');
  } catch (error) {
    next(error);
  }
};

// Check if user belongs to the same department or is admin
export const checkDepartmentAccess = (departmentIdField: string = 'department_id') => {
  return (req: RequestWithUser, res: Response, next: NextFunction): void => {
    try {
      const user = req.user;
      if (!user) {
        throw new UnauthorizedError('User not authenticated');
      }

      // Admin can access all departments
      if (user.role === 'admin') {
        return next();
      }

      // Get department ID from request params or body
      const departmentId = req.params[departmentIdField] || req.body[departmentIdField];

      // Check if user belongs to the same department
      if (user.department_id !== parseInt(departmentId)) {
        throw new ForbiddenError('You can only access resources from your own department');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Check if user is the owner of the resource
export const checkOwnership = (userIdField: string = 'user_id') => {
  return (req: RequestWithUser, res: Response, next: NextFunction): void => {
    try {
      const user = req.user;
      if (!user) {
        throw new UnauthorizedError('User not authenticated');
      }

      // Admin can access all resources
      if (user.role === 'admin') {
        return next();
      }

      // Get user ID from request params or body
      const userId = req.params[userIdField] || req.body[userIdField];

      // Check if user is the owner
      if (user.id !== parseInt(userId)) {
        throw new ForbiddenError('You can only access your own resources');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
