import { Request, Response, NextFunction } from 'express';
import fs from 'fs/promises';
import path from 'path';
import assetService from '../services/asset.service';
import depreciationCalculatorService from '../services/depreciationCalculator.service';
import exportService from '../services/export.service';
import qrcodeService from '../services/qrcode.service';
import assetDisposalService from '../services/assetDisposal.service';
import envConfig from '../config/env';
import { AuthRequest } from '../middleware/auth.middleware';

// Helper: check if a non-admin/director user can access an asset's data
async function checkAssetDeptAccess(assetId: number, user: { role: string; department_id?: number | null }): Promise<boolean> {
  if (user.role === 'admin') return true;
  if (!user.department_id) return false;
  const asset = await assetService.getAssetById(assetId);
  if (!asset) return false;
  return (asset as any).current_department_id === user.department_id;
}

export const getAllAssets = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const query = { ...req.query };

    // Phân quyền: Cán bộ và Trưởng đơn vị chỉ xem tài sản của phòng ban mình
    if (user.role !== 'admin') {
      if (user.department_id) {
        query.current_department_id = String(user.department_id);
        // Không ẩn tài sản đã thanh lý — viên chức/trưởng đơn vị có quyền xem tài sản đã thanh lý của đơn vị mình
      } else {
        // Nếu user không có department_id, trả về danh sách rỗng
        res.status(200).json({
          success: true,
          data: [],
          pagination: {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0,
          },
        });
        return;
      }
    }

    const result = await assetService.getAllAssets(query);

    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

export const getAssetById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const asset = await assetService.getAssetById(parseInt(req.params.id));

    if (!asset) {
      res.status(404).json({
        success: false,
        message: 'Tài sản không tồn tại',
      });
      return;
    }

    // Phân quyền: Cán bộ và Trưởng đơn vị chỉ xem tài sản của phòng ban mình
    if (user.role !== 'admin') {
      if (!user.department_id || asset.current_department_id !== user.department_id) {
        res.status(403).json({
          success: false,
          message: 'Bạn không có quyền truy cập tài sản này',
        });
        return;
      }
    }

    res.status(200).json({
      success: true,
      data: asset,
    });
  } catch (error) {
    next(error);
  }
};

export const createAsset = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    console.log('📝 Creating asset with data:', JSON.stringify(req.body, null, 2));

    const asset = await assetService.createAsset(req.body);

    res.status(201).json({
      success: true,
      message: 'Tài sản đã được tạo thành công',
      data: asset,
    });
  } catch (error) {
    console.error('❌ Error creating asset:', error);
    next(error);
  }
};

export const updateAsset = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const asset = await assetService.updateAsset(parseInt(req.params.id), req.body);

    res.status(200).json({
      success: true,
      message: 'Tài sản đã được cập nhật thành công',
      data: asset,
    });
  } catch (error) {
    next(error);
  }
};

export const uploadAssetImage = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const assetId = parseInt(req.params.id);
    if (!req.file) {
      res.status(400).json({ success: false, message: 'Không có file ảnh được tải lên' });
      return;
    }

    const { Asset } = await import('../models');
    const asset = await Asset.findByPk(assetId);
    if (!asset) {
      res.status(404).json({ success: false, message: 'Không tìm thấy tài sản' });
      return;
    }

    // Kiểm tra quyền
    if (user.role !== 'admin' && user.role !== 'director') {
      if (asset.current_department_id !== user.department_id) {
        res.status(403).json({ success: false, message: 'Bạn không có quyền cập nhật ảnh cho tài sản này' });
        return;
      }
    }

    const uploadDir = path.join(__dirname, '../../storage/public/assets');
    await fs.mkdir(uploadDir, { recursive: true });

    const ext = req.file.mimetype === 'image/jpeg' ? '.jpg' : req.file.mimetype === 'image/png' ? '.png' : req.file.mimetype === 'image/gif' ? '.gif' : '.jpg';
    const filename = `asset-${assetId}-${Date.now()}${ext}`;
    const filePath = path.join(uploadDir, filename);

    await fs.writeFile(filePath, req.file.buffer);

    // Xóa ảnh cũ nếu có và là ảnh cục bộ
    if (asset.image_url && asset.image_url.startsWith('/storage/assets/')) {
      const oldFilename = asset.image_url.replace('/storage/assets/', '');
      const oldFilePath = path.join(uploadDir, oldFilename);
      try {
        await fs.unlink(oldFilePath);
      } catch (err) {
        // Ignored
      }
    }

    asset.image_url = `/storage/assets/${filename}`;
    await asset.save();

    res.status(200).json({
      success: true,
      message: 'Upload hình ảnh thành công',
      data: { image_url: asset.image_url },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAsset = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await assetService.deleteAsset(parseInt(req.params.id));

    res.status(200).json({
      success: true,
      message: 'Tài sản đã được xóa thành công',
    });
  } catch (error) {
    next(error);
  }
};

export const getAssetHistory = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    if (!await checkAssetDeptAccess(parseInt(req.params.id), user)) {
      res.status(403).json({ success: false, message: 'Bạn không có quyền truy cập tài sản này' });
      return;
    }
    const history = await assetService.getAssetHistory(parseInt(req.params.id));

    res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error) {
    next(error);
  }
};
/**
 * Lấy tài sản chờ thanh lý nhóm theo đơn vị
 */
export const getPendingDisposalGrouped = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = (req as any).user;
    // Staff/Head chỉ xem tài sản của phòng mình
    const departmentId = ['staff', 'department_head'].includes(user?.role) ? user?.department_id : undefined;
    const data = await assetService.getPendingDisposalGrouped(departmentId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

/**
 * Lấy lịch sử sửa chữa của tài sản
 */
export const getRepairHistory = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    if (!await checkAssetDeptAccess(parseInt(req.params.id), user)) {
      res.status(403).json({ success: false, message: 'Bạn không có quyền truy cập tài sản này' });
      return;
    }
    const history = await assetService.getRepairHistory(parseInt(req.params.id));

    res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Lấy lịch sử khấu hao theo từng năm của tài sản
 */
export const getDepreciationHistory = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    if (!await checkAssetDeptAccess(parseInt(req.params.id), user)) {
      res.status(403).json({ success: false, message: 'Bạn không có quyền truy cập tài sản này' });
      return;
    }
    const history = await assetService.getDepreciationHistory(parseInt(req.params.id));

    res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Tính lại giá trị hiện tại dựa trên khấu hao
 */
export const recalculateCurrentValue = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const asset = await assetService.recalculateCurrentValue(parseInt(req.params.id));

    res.status(200).json({
      success: true,
      message: 'Giá trị hiện tại đã được tính lại thành công',
      data: asset,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Tính toán khấu hao chi tiết theo Thông tư 141/2025/TT-BTC
 */
export const calculateAssetDepreciation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await depreciationCalculatorService.updateAssetDepreciation(parseInt(req.params.id));

    res.status(200).json({
      success: true,
      message: 'Đã tính toán hao mòn thành công',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Lấy lịch sử khấu hao chi tiết theo từng năm
 */
export const getDepreciationSchedule = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { categoryCode, originalValue, yearInUse, usefulLife, depreciationRate } = req.body;

    const schedule = await depreciationCalculatorService.generateDepreciationSchedule({
      categoryCode,
      originalValue: parseFloat(originalValue),
      yearInUse: yearInUse ? parseInt(yearInUse) : undefined, // CHỈ DÙNG yearInUse
      customUsefulLife: usefulLife ? parseInt(usefulLife) : undefined,
      customDepreciationRate: depreciationRate ? parseFloat(depreciationRate) : undefined,
    });

    res.status(200).json({
      success: true,
      data: schedule,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Validate thông tin khấu hao
 */
export const validateDepreciation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validation = depreciationCalculatorService.validateDepreciationInput(req.body);

    res.status(200).json({
      success: true,
      data: validation,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Lấy thống kê tổng hợp tài sản
 */
export const getStatistics = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const query: any = { ...req.query };

    // Phân quyền: Cán bộ và Trưởng đơn vị chỉ xem tài sản của phòng ban mình
    if (user.role !== 'admin') {
      if (user.department_id) {
        query.current_department_id = String(user.department_id);
      }
    }

    const statistics = await assetService.getStatistics(query);

    res.status(200).json({
      success: true,
      data: statistics,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Export assets to Excel
 * Admin và Giám hiệu: xuất toàn bộ tài sản
 * Trưởng đơn vị và Cán bộ: chỉ xuất tài sản của phòng ban mình
 */
export const exportAssets = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const query = { ...req.query };

    // Generate Excel file
    const buffer = await exportService.exportAssetsToExcel(
      query,
      user.role,
      user.department_id
    );

    // Set response headers
    const filename = `Danh_sach_tai_san_${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.setHeader('Content-Length', buffer.length);

    // Send file
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

/**
 * Generate QR code cho tài sản
 * POST /api/assets/:id/qrcode/generate
 */
export const generateQRCode = async (req: AuthRequest, res: Response, _next: NextFunction): Promise<void> => {
  try {
    const assetId = parseInt(req.params.id);
    
    if (isNaN(assetId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid asset ID',
      });
      return;
    }

    const asset = await assetService.getAssetById(assetId);

    if (!asset) {
      res.status(404).json({
        success: false,
        message: 'Asset not found',
      });
      return;
    }

    // Validate asset có đủ thông tin
    if (!asset.asset_code || !asset.name) {
      res.status(400).json({
        success: false,
        message: 'Asset must have asset_code and name to generate QR code',
      });
      return;
    }

    // Generate QR code
    // Note: asset từ getAssetById có thể là plain object, qrcodeService sẽ tự load lại instance
    const result = await qrcodeService.generateQRCodeForAsset(asset);

    res.status(200).json({
      success: true,
      message: 'QR code generated successfully',
      data: {
        qr_code: result.qrCode,
        qr_code_image: result.qrCodeImage,
        asset: {
          id: asset.id,
          asset_code: asset.asset_code,
          name: asset.name,
        },
      },
    });
  } catch (error: any) {
    console.error('Error generating QR code:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate QR code',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};

/**
 * Decode QR code và tìm tài sản
 * POST /api/assets/qrcode/decode
 */
export const decodeQRCode = async (req: AuthRequest, res: Response, _next: NextFunction): Promise<void> => {
  try {
    const { qr_data } = req.body;

    if (!qr_data) {
      res.status(400).json({
        success: false,
        message: 'QR code data is required',
      });
      return;
    }

    // Decode QR code
    const qrCodeData = qrcodeService.decodeQRCodeData(qr_data);

    // Tìm tài sản
    const asset = await qrcodeService.findAssetByQRCode(qr_data);

    if (!asset) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài sản với mã QR code này',
        qr_data: qrCodeData,
      });
      return;
    }

    // Kiểm tra quyền: Cán bộ chỉ xem tài sản của phòng ban mình
    const user = req.user!;
    if (user.role !== 'admin') {
      if (!user.department_id || asset.current_department_id !== user.department_id) {
        res.status(403).json({
          success: false,
          message: 'Bạn không có quyền truy cập tài sản này',
        });
        return;
      }
    }

    res.status(200).json({
      success: true,
      data: {
        asset,
        qr_data: qrCodeData,
      },
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Invalid QR code data',
    });
  }
};

/**
 * Lấy QR code image của tài sản
 * GET /api/assets/:id/qrcode
 */
export const getQRCode = async (req: AuthRequest, res: Response, _next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const assetId = parseInt(req.params.id);

    if (isNaN(assetId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid asset ID',
      });
      return;
    }

    if (!await checkAssetDeptAccess(assetId, user)) {
      res.status(403).json({ success: false, message: 'Bạn không có quyền truy cập tài sản này' });
      return;
    }

    const asset = await assetService.getAssetById(assetId);

    if (!asset) {
      res.status(404).json({
        success: false,
        message: 'Asset not found',
      });
      return;
    }

    // Nếu chưa có QR code, hoặc QR code chứa URL cũ (không khớp FRONTEND_URL hiện tại) → generate lại
    const expectedBase = envConfig.frontendUrl.replace(/\/$/, '');
    const qrOutdated = asset.qr_code && !asset.qr_code.startsWith(expectedBase);
    if (!asset.qr_code || !asset.qr_code_image || qrOutdated) {
      try {
        const result = await qrcodeService.generateQRCodeForAsset(asset);
        res.status(200).json({
          success: true,
          data: {
            qr_code: result.qrCode,
            qr_code_image: result.qrCodeImage,
          },
        });
        return;
      } catch (generateError: any) {
        console.error('Error generating QR code:', generateError);
        res.status(500).json({
          success: false,
          message: generateError.message || 'Failed to generate QR code',
          error: process.env.NODE_ENV === 'development' ? generateError.stack : undefined,
        });
        return;
      }
    }

    res.status(200).json({
      success: true,
      data: {
        qr_code: asset.qr_code,
        qr_code_image: asset.qr_code_image,
      },
    });
  } catch (error: any) {
    console.error('Error getting QR code:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get QR code',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};

// POST /api/assets/qrcode/generate-all - Generate QR code cho tất cả tài sản chưa có QR
export const generateAllQRCodes = async (req: AuthRequest, res: Response, _next: NextFunction): Promise<void> => {
  try {
    const { Asset } = await import('../models');
    const { Op } = await import('sequelize');

    // Lấy tất cả tài sản chưa có QR code
    const assetsWithoutQR = await Asset.findAll({
      where: {
        [Op.or]: [
          { qr_code: null },
          { qr_code: '' },
        ],
      },
      order: [['id', 'ASC']],
    });

    if (assetsWithoutQR.length === 0) {
      res.status(200).json({
        success: true,
        message: 'Tất cả tài sản đã có QR code',
        data: { generated: 0, total: 0 },
      });
      return;
    }

    let generated = 0;
    let failed = 0;
    const errors: string[] = [];

    // Generate QR cho từng tài sản (tuần tự để tránh quá tải)
    for (const asset of assetsWithoutQR) {
      try {
        await qrcodeService.generateQRCodeForAsset(asset);
        generated++;
      } catch (err: any) {
        failed++;
        errors.push(`${asset.asset_code}: ${err.message}`);
      }
    }

    res.status(200).json({
      success: true,
      message: `Đã tạo QR code cho ${generated}/${assetsWithoutQR.length} tài sản${failed > 0 ? `, lỗi ${failed} tài sản` : ''}`,
      data: { generated, failed, total: assetsWithoutQR.length, errors: errors.slice(0, 10) },
    });
  } catch (error: any) {
    console.error('Error generating all QR codes:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Không thể tạo QR code hàng loạt',
    });
  }
};

export const getDisposalHistory = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const assetId = parseInt(req.params.id);
    const user = req.user!;
    if (!await checkAssetDeptAccess(assetId, user)) {
      res.status(403).json({ success: false, message: 'Bạn không có quyền truy cập tài sản này' });
      return;
    }

    const result = await assetDisposalService.listCases({ asset_id: assetId, page: 1, limit: 50 });
    res.status(200).json({ success: true, data: result.data });
  } catch (error) {
    next(error);
  }
};
