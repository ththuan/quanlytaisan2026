import { Request, Response, NextFunction } from 'express';
import fs from 'fs/promises';
import path from 'path';
import ExcelJS from 'exceljs';
import assetService from '../services/asset.service';
import depreciationCalculatorService from '../services/depreciationCalculator.service';
import exportService from '../services/export.service';
import qrcodeService from '../services/qrcode.service';
import assetDisposalService from '../services/assetDisposal.service';
import { AuthRequest } from '../middleware/auth.middleware';
import normService from '../services/norm.service';
import { campusLabel } from '../constants/campuses';
import { imageExtension } from '../constants/imageMime';

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

    const asset = await assetService.createAsset(req.body, (req as any).user?.id);

    // Cảnh báo vượt định mức (chỉ cảnh báo, không chặn)
    let normWarnings: any[] = [];
    try {
      normWarnings = await normService.evaluateAsset(asset as any, (req as any).user?.id);
    } catch (e) {
      console.warn('Norm evaluation failed:', e);
    }

    res.status(201).json({
      success: true,
      message: 'Tài sản đã được tạo thành công',
      data: asset,
      norm_warnings: normWarnings,
    });
  } catch (error) {
    console.error('❌ Error creating asset:', error);
    next(error);
  }
};

export const updateAsset = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const asset = await assetService.updateAsset(parseInt(req.params.id), req.body, (req as any).user?.id);

    let normWarnings: any[] = [];
    try {
      normWarnings = await normService.evaluateAsset(asset as any, (req as any).user?.id);
    } catch (e) {
      console.warn('Norm evaluation failed:', e);
    }

    res.status(200).json({
      success: true,
      message: 'Tài sản đã được cập nhật thành công',
      data: asset,
      norm_warnings: normWarnings,
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

    const ext = `.${imageExtension(req.file.mimetype)}`;
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
 * Lịch sử tài sản hợp nhất (nhập → điều chuyển → kiểm kê → thanh lý)
 * GET /api/assets/:id/timeline
 */
export const getAssetTimeline = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    if (!await checkAssetDeptAccess(parseInt(req.params.id), user)) {
      res.status(403).json({ success: false, message: 'Bạn không có quyền truy cập tài sản này' });
      return;
    }
    const timeline = await assetService.getAssetTimeline(parseInt(req.params.id));

    res.status(200).json({
      success: true,
      data: timeline,
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

export const getAssignmentHistory = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const assetId = parseInt(req.params.id);
    if (!await checkAssetDeptAccess(assetId, user)) {
      res.status(403).json({ success: false, message: 'Bạn không có quyền truy cập tài sản này' });
      return;
    }
    const history = await assetService.getAssignmentHistory(assetId);
    res.status(200).json({ success: true, data: history });
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

    // Generate QR code (force: tạo lại theo yêu cầu chủ động của admin)
    // Note: asset từ getAssetById có thể là plain object, qrcodeService sẽ tự load lại instance
    const result = await qrcodeService.generateQRCodeForAsset(asset, { force: true });

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

    // QR là bất biến: chỉ tạo khi tài sản CHƯA có QR. Nếu đã có → trả lại nguyên trạng,
    // không tự tạo lại (giữ tem QR đã in luôn đúng).
    if (!asset.qr_code || !asset.qr_code_image) {
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

// POST /api/assets/qrcode/generate-all - Generate QR code hàng loạt
// Body/query: { force?: boolean, department_id?: number }
//  - force=false (mặc định): chỉ tạo cho tài sản CHƯA có QR (QR bất biến)
//  - force=true: TẠO LẠI (ghi đè) cả QR đã có — dùng để thay mẫu/QR lỗi
export const generateAllQRCodes = async (req: AuthRequest, res: Response, _next: NextFunction): Promise<void> => {
  try {
    const { Asset } = await import('../models');
    const { Op } = await import('sequelize');

    const force = String(req.body?.force ?? req.query.force ?? '') === 'true';
    const departmentIdRaw = req.body?.department_id ?? req.query.department_id;
    const departmentId = departmentIdRaw ? Number.parseInt(String(departmentIdRaw), 10) : null;

    const where: any = {};
    if (departmentId && Number.isFinite(departmentId)) {
      where.current_department_id = departmentId;
    }
    if (!force) {
      where[Op.or] = [{ qr_code: null }, { qr_code: '' }];
    }

    const assets = await Asset.findAll({
      where,
      order: [['id', 'ASC']],
    });

    if (assets.length === 0) {
      res.status(200).json({
        success: true,
        message: force ? 'Không có tài sản nào để tạo lại QR' : 'Tất cả tài sản đã có QR code',
        data: { generated: 0, failed: 0, total: 0, force },
      });
      return;
    }

    let generated = 0;
    let failed = 0;
    const errors: string[] = [];

    // Generate QR cho từng tài sản (tuần tự để tránh quá tải)
    for (const asset of assets) {
      try {
        await qrcodeService.generateQRCodeForAsset(asset, { force });
        generated++;
      } catch (err: any) {
        failed++;
        errors.push(`${asset.asset_code}: ${err.message}`);
      }
    }

    res.status(200).json({
      success: true,
      message: `${force ? 'Đã TẠO LẠI' : 'Đã tạo'} QR code cho ${generated}/${assets.length} tài sản${failed > 0 ? `, lỗi ${failed} tài sản` : ''}`,
      data: { generated, failed, total: assets.length, force, errors: errors.slice(0, 10) },
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

/**
 * GET /api/assets/loss-damage
 * Danh s�ch t�i s?n m?t/hu h?ng + b?i thu?ng (t? ki?m k� g?n nh?t).
 */
export const getLossDamageAssets = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const query: any = { ...req.query };
    const user = req.user;

    // Người dùng thường chỉ xem tài sản mất/hư hỏng của đơn vị mình.
    if (!['admin', 'director'].includes(user?.role || '')) {
      if (!user?.department_id) {
        res.status(200).json({ success: true, data: [] });
        return;
      }
      query.department_id = String(user.department_id);
    }

    const data = await assetService.getLossDamageAssets(query);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/assets/loss-damage/export
 * Xu?t Excel b�o c�o t�i s?n m?t/hu h?ng + b?i thu?ng.
 */
export const exportLossDamage = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rows = await assetService.getLossDamageAssets(req.query);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Tai san mat hu hong');

    sheet.columns = [
      { header: 'STT', key: 'stt', width: 6 },
      { header: 'M� t�i s?n', key: 'asset_code', width: 18 },
      { header: 'T�n t�i s?n', key: 'name', width: 32 },
      { header: '�on v?', key: 'department', width: 26 },
      { header: 'Cơ sở', key: 'campus', width: 18 },
      { header: 'Tr?ng th�i', key: 'status', width: 14 },
      { header: 'Nguy�n gi�', key: 'purchase_price', width: 18 },
      { header: 'Gi� tr? c�n l?i', key: 'current_value', width: 18 },
      { header: 'Nguy�n nh�n', key: 'discrepancy_reason', width: 36 },
      { header: 'Tr�ch nhi?m', key: 'responsibility', width: 28 },
    ];
    sheet.getRow(1).font = { bold: true };

    rows.forEach((r: any, idx: number) => {
      sheet.addRow({
        stt: idx + 1,
        asset_code: r.asset_code || '',
        name: r.name || '',
        department: r.department?.name || '',
        campus: campusLabel(r.campus),
        status: r.status === 'lost' ? 'M?t' : 'Hu h?ng',
        purchase_price: Number(r.purchase_price || 0),
        current_value: Number(r.current_value || 0),
        discrepancy_reason: r.discrepancy_reason || '',
        responsibility: r.responsibility || '',
      });
    });

    const totalRow = sheet.addRow({ name: 'TỔNG CỘNG' });
    totalRow.font = { bold: true };

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="bao-cao-mat-hu-hong-${Date.now()}.xlsx"`);
    const buffer = await workbook.xlsx.writeBuffer();
    res.send(Buffer.from(buffer as ArrayBuffer));
  } catch (error) {
    next(error);
  }
};
