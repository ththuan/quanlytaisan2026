/**
 * Public Controller
 * API không cần xác thực - dành cho quét QR code công khai
 * Chỉ trả về thông tin cơ bản, KHÔNG bao gồm dữ liệu tài chính
 */
import { Request, Response } from 'express';
import { Asset, Department, AssetCategory } from '../models';
import { ASSET_STATUS_LABELS, ASSET_CONDITION_LABELS } from '../constants/assetLabels';
import { QR_REQUIRE_SIGNATURE, verifyAssetCode } from '../utils/qrSigning';

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

    // Bắt buộc token HMAC do hệ thống phát hành (chống dò mã)
    if (QR_REQUIRE_SIGNATURE && !verifyAssetCode(code, req.query.t as string | undefined)) {
      res.status(403).json({ success: false, message: 'Mã QR không hợp lệ hoặc đã hết hiệu lực' });
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
          status_label: ASSET_STATUS_LABELS[data.status] || data.status,
          condition_label: ASSET_CONDITION_LABELS[data.condition] || data.condition,
        },
      });
      return;
    }

    const data = asset.toJSON() as any;
    res.json({
      success: true,
      data: {
        ...data,
        status_label: ASSET_STATUS_LABELS[data.status] || data.status,
        condition_label: ASSET_CONDITION_LABELS[data.condition] || data.condition,
      },
    });
  } catch (error: any) {
    console.error('Public asset lookup error:', error);
    res.status(500).json({ success: false, message: 'Lỗi hệ thống, vui lòng thử lại sau' });
  }
};
