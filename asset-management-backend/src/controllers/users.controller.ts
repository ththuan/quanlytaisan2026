import { Request, Response, NextFunction } from 'express';
import userService from '../services/user.service';
import { AuthRequest } from '../middleware/auth.middleware';

class UsersController {
  async getAllUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await userService.getAllUsers(req.query);

      return res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserById(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = parseInt(req.params.id);
      const user = await userService.getUserById(userId);

      return res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async createUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await userService.createUser(req.body);

      return res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = parseInt(req.params.id);
      const requestingUserId = req.user!.id;
      const user = await userService.updateUser(userId, req.body, requestingUserId);

      return res.json({
        success: true,
        message: 'User updated successfully',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = parseInt(req.params.id);
      const requestingUserId = req.user!.id;
      await userService.deleteUser(userId, requestingUserId);

      return res.json({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const user = await userService.getUserById(userId);

      return res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const user = await userService.updateUser(userId, req.body, userId);

      return res.json({
        success: true,
        message: 'Profile updated successfully',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = parseInt(req.params.id);
      const user = await userService.resetPasswordToDefault(userId);

      return res.json({
        success: true,
        message: 'Password has been reset to default (Ctec@123)',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new UsersController();
