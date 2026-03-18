import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import userService from '../services/user.service';
import * as userImportService from '../services/userImport.service';
import { AuthRequest } from '../middleware/auth.middleware';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req: any, file: any, cb: any) => {
    const allowed = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Chỉ chấp nhận file Excel (.xlsx, .xls)'));
  },
});

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
        message: 'Password has been reset to default',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  /** GET /users/import/template - Tải file mẫu Excel import người dùng */
  async downloadImportTemplate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tempDir = path.join(__dirname, '../../temp');
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
      const filePath = path.join(tempDir, `mau_import_nguoi_dung_${Date.now()}.xlsx`);
      const buffer = await userImportService.generateUserImportTemplate();
      fs.writeFileSync(filePath, buffer);
      if (!fs.existsSync(filePath)) throw new Error('File was not created');
      const stats = fs.statSync(filePath);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="mau_import_nguoi_dung.xlsx"');
      res.setHeader('Content-Length', stats.size);
      const stream = fs.createReadStream(filePath);
      stream.pipe(res);
      stream.on('close', () => { fs.unlink(filePath, () => {}); });
    } catch (error) {
      next(error);
    }
  }

  /** POST /users/import - Import người dùng từ Excel (?validateOnly=true để chỉ kiểm tra) */
  async importUsers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'Vui lòng upload file Excel' });
      }
      const validateOnly = req.query.validateOnly === 'true';
      const result = await userImportService.importUsersFromExcel(req.file.buffer, { validateOnly });

      if (validateOnly) {
        return res.json({
          success: result.failed === 0,
          message: result.failed === 0
            ? `Kiểm tra xong: ${result.imported} dòng hợp lệ, sẵn sàng import.`
            : `Phát hiện ${result.failed} lỗi. Vui lòng sửa file rồi kiểm tra lại.`,
          data: {
            total: result.total,
            imported: result.imported,
            failed: result.failed,
            errors: result.errors,
            validatedOnly: true,
          },
        });
      }

      return res.json({
        success: result.success,
        message: result.success
          ? `Import thành công ${result.imported}/${result.total} người dùng`
          : `Import hoàn tất với ${result.failed} lỗi`,
        data: {
          total: result.total,
          imported: result.imported,
          failed: result.failed,
          errors: result.errors,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new UsersController();
export const uploadUserImport = upload.single('file');
