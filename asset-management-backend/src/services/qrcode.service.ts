/**
 * QR Code Service
 * Generate và decode QR code cho tài sản
 * QR code chứa thông tin: mã tài sản, tên, loại, số lượng
 */

import QRCode from 'qrcode';
import { Op } from 'sequelize';
import { Asset } from '../models';
import envConfig from '../config/env';
import { generateQrToken } from '../utils/qrSigning';

export interface QRCodeData {
  asset_code: string;
  name: string;
  category_code?: string;
  category_name?: string;
  quantity: number;
  id: number;
}

class QRCodeService {
  /**
   * Generate QR code data string từ thông tin tài sản
   * Encode URL công khai (kèm token ngẫu nhiên) để camera điện thoại mở trang tra cứu.
   *
   * Token ngẫu nhiên → mỗi QR là duy nhất; reset/tạo lại tài sản luôn sinh QR mới,
   * tem QR cũ (kể cả trùng mã tài sản) không còn dùng được.
   */
  generateQRCodeData(asset: Asset): string {
    const baseUrl = envConfig.frontendUrl.replace(/\/$/, '');
    const token = generateQrToken();
    return `${baseUrl}/scan/${asset.asset_code}?t=${token}`;
  }

  /**
   * Generate QR code image (base64 hoặc buffer)
   */
  async generateQRCodeImage(data: string, options?: { format?: 'png' | 'svg'; size?: number }): Promise<string> {
    const format = options?.format || 'png';
    const size = options?.size || 600; // Lớn hơn để in sắc nét

    try {
      if (format === 'svg') {
        return await QRCode.toString(data, { type: 'svg', width: size });
      } else {
        // Return base64 data URL
        return await QRCode.toDataURL(data, {
          width: size,
          margin: 6,           // Tăng khoảng trắng để giúp scanner nhận ra viền QR
          errorCorrectionLevel: 'H', // 30% phục hồi - tốt hơn cho in ấn kém
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
        });
      }
    } catch (error) {
      throw new Error(`Failed to generate QR code: ${error}`);
    }
  }

  /**
   * Generate QR code image buffer (để lưu file)
   */
  async generateQRCodeBuffer(data: string, options?: { size?: number }): Promise<Buffer> {
    const size = options?.size || 400;

    try {
      return await QRCode.toBuffer(data, {
        width: size,
        margin: 6,
        errorCorrectionLevel: 'H',
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
    } catch (error) {
      throw new Error(`Failed to generate QR code buffer: ${error}`);
    }
  }

  /**
   * Decode QR code data từ string
   * Hỗ trợ 2 format: plain asset_code (mới) và JSON legacy (cũ)
   */
  decodeQRCodeData(qrDataString: string): QRCodeData {
    const trimmed = qrDataString.trim();
    // QR mới chứa token: .../scan/TS001?t=<token> → bỏ phần query khi lấy mã
    const withoutQuery = trimmed.split('?')[0];
    
    // Format URL: https://domain/scan/ASSET_CODE
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      const urlParts = withoutQuery.split('/');
      const scanIndex = urlParts.indexOf('scan');
      const assetCode = scanIndex !== -1 && urlParts[scanIndex + 1]
        ? urlParts[scanIndex + 1]
        : urlParts[urlParts.length - 1];
      return {
        asset_code: assetCode,
        name: '',
        category_code: '',
        category_name: '',
        quantity: 1,
        id: 0,
      };
    }

    // Format plain asset_code (không phải JSON, không phải URL)
    if (!trimmed.startsWith('{')) {
      return {
        asset_code: withoutQuery,
        name: '',
        category_code: '',
        category_name: '',
        quantity: 1,
        id: 0,
      };
    }
    
    // Format cũ: JSON
    try {
      const data = JSON.parse(trimmed);
      
      if (!data.asset_code && !data.name) {
        throw new Error('Invalid QR code data: missing required fields');
      }

      return {
        asset_code: data.asset_code,
        name: data.name || '',
        category_code: data.category_code || '',
        category_name: data.category_name || '',
        quantity: data.quantity || 1,
        id: data.id || 0,
      };
    } catch (error) {
      throw new Error(`Failed to decode QR code: ${error}`);
    }
  }

  /**
   * Generate QR code cho tài sản và lưu vào database.
   *
   * QR là VĨNH VIỄN: nếu tài sản đã có QR, mặc định trả lại QR cũ (không tạo lại).
   * Chỉ tạo lại khi `options.force = true` (thao tác chủ động của admin).
   */
  async generateQRCodeForAsset(
    asset: Asset | any,
    options?: { force?: boolean }
  ): Promise<{ qrCode: string; qrCodeImage: string }> {
    try {
      // Validate asset có đủ thông tin
      if (!asset.asset_code || !asset.name) {
        throw new Error('Asset must have asset_code and name to generate QR code');
      }

      // Đảm bảo asset là Sequelize instance, nếu không thì load lại từ database
      let assetInstance: Asset;
      if (asset instanceof Asset) {
        assetInstance = asset;
      } else {
        // Load lại asset instance từ database
        assetInstance = await Asset.findByPk(asset.id);
        if (!assetInstance) {
          throw new Error(`Asset with ID ${asset.id} not found`);
        }
      }

      // QR đã tồn tại → giữ nguyên (bất biến). Chỉ tạo lại khi force.
      if (!options?.force && assetInstance.qr_code && assetInstance.qr_code_image) {
        return {
          qrCode: assetInstance.qr_code,
          qrCodeImage: assetInstance.qr_code_image,
        };
      }

      // Generate QR code data
      const qrData = this.generateQRCodeData(assetInstance);
      
      // Generate QR code image (base64)
      const qrCodeImage = await this.generateQRCodeImage(qrData, { format: 'png', size: 300 });

      // Validate QR code image không quá dài (base64 có thể rất dài)
      if (qrCodeImage.length > 100000) {
        console.warn(`QR code image is very long: ${qrCodeImage.length} characters`);
      }

      // Update asset với QR code
      try {
        await assetInstance.update({
          qr_code: qrData,
          qr_code_image: qrCodeImage,
        });
      } catch (updateError: any) {
        console.error('Error updating asset with QR code:', updateError);
        console.error('Update error details:', {
          message: updateError.message,
          name: updateError.name,
          stack: updateError.stack,
        });
        // Nếu lỗi do column không tồn tại, throw error rõ ràng
        if (updateError.message && (
          updateError.message.includes('column') && updateError.message.includes('does not exist') ||
          updateError.message.includes('Unknown column')
        )) {
          throw new Error('QR code columns not found in database. Please run migration: npm run migrate');
        }
        throw updateError;
      }

      return {
        qrCode: qrData,
        qrCodeImage,
      };
    } catch (error: any) {
      console.error('Error in generateQRCodeForAsset:', error);
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack,
      });
      throw new Error(`Failed to generate QR code: ${error.message || error}`);
    }
  }

  /**
   * Tìm tài sản từ QR code data
   */
  async findAssetByQRCode(qrDataString: string): Promise<Asset | null> {
    try {
      const qrData = this.decodeQRCodeData(qrDataString);
      
      const whereClause: any[] = [];
      if (qrData.asset_code) whereClause.push({ asset_code: qrData.asset_code });
      if (qrData.id) whereClause.push({ id: qrData.id });
      
      if (!whereClause.length) return null;
      
      const asset = await Asset.findOne({
        where: { [Op.or]: whereClause },
      });

      return asset;
    } catch (error) {
      return null;
    }
  }
}

export default new QRCodeService();
