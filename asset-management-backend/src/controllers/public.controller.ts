/**
 * Public Controller
 * API không cần xác thực - dành cho quét QR code công khai
 * Chỉ trả về thông tin cơ bản, KHÔNG bao gồm dữ liệu tài chính
 */
import { Request, Response } from 'express';
import { Asset, Department, AssetCategory } from '../models';
import { ASSET_STATUS_LABELS, ASSET_CONDITION_LABELS } from '../constants/assetLabels';
import { QR_REQUIRE_SIGNATURE, isQrTokenValid } from '../utils/qrSigning';

const PUBLIC_ATTRIBUTES = [
  'id',
  'asset_code',
  'name',
  'category',
  'category_code',
  'status',
  'condition',
  'location',
  'unit',
  'quantity',
  'image_url',
  'year_in_use',
  'qr_code',
];

const PUBLIC_INCLUDES = [
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
];

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

    const trimmed = code.trim();
    const asset =
      (await Asset.findOne({
        where: { asset_code: trimmed.toUpperCase() },
        attributes: PUBLIC_ATTRIBUTES,
        include: PUBLIC_INCLUDES,
      })) ||
      (await Asset.findOne({
        where: { asset_code: trimmed },
        attributes: PUBLIC_ATTRIBUTES,
        include: PUBLIC_INCLUDES,
      }));

    if (!asset) {
      res.status(404).json({ success: false, message: 'Không tìm thấy tài sản với mã này' });
      return;
    }

    // Xác thực token đối chiếu với token ĐÃ LƯU trong QR → QR vĩnh viễn, không phụ thuộc
    // secret/domain. Tem cũ (không token) vẫn được chấp nhận.
    if (QR_REQUIRE_SIGNATURE && !isQrTokenValid((asset as any).qr_code, req.query.t as string | undefined)) {
      res.status(403).json({ success: false, message: 'Mã QR không hợp lệ với tài sản này' });
      return;
    }

    const data = asset.toJSON() as any;
    // Không trả qr_code ra ngoài (chỉ dùng nội bộ để xác thực)
    delete data.qr_code;

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
