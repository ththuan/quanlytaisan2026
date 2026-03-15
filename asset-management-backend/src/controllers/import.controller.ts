/**
 * Import Controller
 * API endpoints cho import tài sản hàng loạt
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import importService from '../services/import.service';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Cấu hình multer để xử lý file upload
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (_req, file, cb) => {
    // Chỉ chấp nhận file Excel
    const allowedMimes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file Excel (.xlsx, .xls)'));
    }
  },
});

export const uploadMiddleware = upload.single('file');

/**
 * Download file mẫu Excel
 */
export const downloadTemplate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Tạo thư mục temp nếu chưa có
    const tempDir = path.join(__dirname, '../../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // Tạo tên file unique để tránh xung đột
    const uniqueFilename = `mau_import_tai_san_${Date.now()}.xlsx`;
    const filePath = path.join(tempDir, uniqueFilename);
    
    // Sử dụng hàm ghi file trực tiếp
    await importService.generateTemplateToFile(filePath);
    
    // Kiểm tra file tồn tại
    if (!fs.existsSync(filePath)) {
      throw new Error('File was not created');
    }
    
    const stats = fs.statSync(filePath);
    
    // Set headers và gửi file
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="mau_import_tai_san.xlsx"');
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
};

/**
 * Import tài sản từ file Excel
 */
export const importAssets = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng upload file Excel',
      });
    }
    
    const result = await importService.importAssetsFromExcel(req.file.buffer, req.user!.id);
    
    res.json({
      success: result.success,
      message: result.success 
        ? `Import thành công ${result.imported}/${result.total} tài sản`
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
};

export default {
  uploadMiddleware,
  downloadTemplate,
  importAssets,
};
