import { Request, Response, NextFunction } from 'express';
import departmentService from '../services/department.service';
import { AuthRequest } from '../middleware/auth.middleware';
import path from 'path';
import fs from 'fs';

class DepartmentsController {
  async getAllDepartments(req: Request, res: Response, next: NextFunction) {
    try {
      // If limit is not specified or is 'all', return all departments without pagination
      if (req.query.limit === 'all' || req.query.limit === undefined) {
        const allDepartments = await departmentService.getAllDepartments({ ...req.query, limit: 10000, page: 1 });
        return res.json({
          success: true,
          data: allDepartments.data,
        });
      }

      const result = await departmentService.getAllDepartments(req.query);

      return res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  async getDepartmentById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const department = await departmentService.getDepartmentById(id);

      return res.json({
        success: true,
        data: department,
      });
    } catch (error) {
      next(error);
    }
  }

  async createDepartment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const department = await departmentService.createDepartment(req.body);

      return res.status(201).json({
        success: true,
        message: 'Department created successfully',
        data: department,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateDepartment(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const department = await departmentService.updateDepartment(id, req.body);

      return res.json({
        success: true,
        message: 'Department updated successfully',
        data: department,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteDepartment(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      await departmentService.deleteDepartment(id);

      return res.json({
        success: true,
        message: 'Department deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async getDepartmentTree(req: Request, res: Response, next: NextFunction) {
    try {
      const tree = await departmentService.getDepartmentTree();

      return res.json({
        success: true,
        data: tree,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Download Excel template for importing departments
   */
  async downloadTemplate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // Tạo thư mục temp nếu chưa có
      const tempDir = path.join(__dirname, '../../temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // Tạo tên file unique
      const uniqueFilename = `mau_import_phong_ban_${Date.now()}.xlsx`;
      const filePath = path.join(tempDir, uniqueFilename);

      // Generate template
      const buffer = await departmentService.generateDepartmentTemplate();
      fs.writeFileSync(filePath, buffer);

      // Kiểm tra file tồn tại
      if (!fs.existsSync(filePath)) {
        throw new Error('File was not created');
      }

      const stats = fs.statSync(filePath);

      // Set headers và gửi file
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="mau_import_phong_ban.xlsx"');
      res.setHeader('Content-Length', stats.size);

      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);

      // Xóa file sau khi gửi xong
      fileStream.on('close', () => {
        fs.unlink(filePath, (err) => {
          if (err) console.error('Error deleting temp file:', err);
        });
      });
    } catch (error) {
      console.error('Error in downloadTemplate:', error);
      next(error);
    }
  }

  /**
   * Import departments from Excel file
   */
  async importExcel(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng upload file Excel',
        });
      }

      const result = await departmentService.importExcel(req.file.buffer);

      return res.json({
        success: result.success,
        message: result.success
          ? `Import thành công ${result.imported}/${result.total} phòng ban`
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

  /**
   * Deprecated alias - keep for backward compatibility
   */
  async importDepartments(req: AuthRequest, res: Response, next: NextFunction) {
    return this.importExcel(req, res, next);
  }
}

export default new DepartmentsController();
