/**
 * Public Controller
 * API không cần xác thực - dành cho quét QR code công khai
 * Chỉ trả về thông tin cơ bản, KHÔNG bao gồm dữ liệu tài chính
 */
import { Request, Response } from 'express';
import { Asset, Department, AssetCategory } from '../models';

const STATUS_LABELS: Record<string, string> = {
  active: 'Đang sử dụng',
  inactive: 'Ngừng sử dụng',
  damaged: 'Hỏng',
  lost: 'Mất',
  disposed: 'Đã thanh lý',
  pending_disposal: 'Chờ thanh lý',
  pending_repair: 'Chờ sửa chữa',
};

const CONDITION_LABELS: Record<string, string> = {
  good: 'Tốt',
  fair: 'Trung bình',
  poor: 'Kém',
  usable: 'Còn dùng được',
  needs_repair: 'Cần sửa chữa',
  damaged: 'Hỏng',
  disposed: 'Đã thanh lý',
};

/**
 * GET /api/public/asset/:code
 * Tra cứu thông tin tài sản qua mã QR - không cần đăng nhập
 */
export const getPublicAssetByCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.params;

    if (!code || code.trim().length === 0) {
      res.status(400).json({ success: false, message: 'Mã tài sản không hợp lệ' });
      return;
    }

    const asset = await Asset.findOne({
      where: { asset_code: code.trim().toUpperCase() },
      attributes: [
        'id',
        'asset_code',
        'name',
        'description',
        'category',
        'category_code',
        'status',
        'condition',
        'location',
        'unit',
        'quantity',
        'image_url',
        'year_in_use',
        'serial_number',
        'warranty_date',
        'current_department_id',
      ],
      include: [
        {
          model: Department,
          as: 'current_department',
          attributes: ['id', 'name', 'type'],
        },
        {
          model: AssetCategory,
          as: 'assetCategory',
          attributes: ['id', 'name', 'code', 'category_group'],
        },
      ],
    });

    if (!asset) {
      // Thử tìm không phân biệt hoa thường
      const assetAlt = await Asset.findOne({
        where: { asset_code: code.trim() },
        attributes: [
          'id',
          'asset_code',
          'name',
          'description',
          'category',
          'category_code',
          'status',
          'condition',
          'location',
          'unit',
          'quantity',
          'image_url',
          'year_in_use',
          'serial_number',
          'warranty_date',
          'current_department_id',
        ],
        include: [
          {
            model: Department,
            as: 'current_department',
            attributes: ['id', 'name', 'type'],
          },
          {
            model: AssetCategory,
            as: 'assetCategory',
            attributes: ['id', 'name', 'code', 'category_group'],
          },
        ],
      });

      if (!assetAlt) {
        res.status(404).json({ success: false, message: 'Không tìm thấy tài sản với mã này' });
        return;
      }

      const data = assetAlt.toJSON() as any;
      res.json({
        success: true,
        data: {
          ...data,
          status_label: STATUS_LABELS[data.status] || data.status,
          condition_label: CONDITION_LABELS[data.condition] || data.condition,
        },
      });
      return;
    }

    const data = asset.toJSON() as any;
    res.json({
      success: true,
      data: {
        ...data,
        status_label: STATUS_LABELS[data.status] || data.status,
        condition_label: CONDITION_LABELS[data.condition] || data.condition,
      },
    });
  } catch (error: any) {
    console.error('Public asset lookup error:', error);
    res.status(500).json({ success: false, message: 'Lỗi hệ thống, vui lòng thử lại sau' });
  }
};
