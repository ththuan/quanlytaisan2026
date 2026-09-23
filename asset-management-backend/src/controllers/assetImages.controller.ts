import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { NotFoundError, ValidationError } from '../utils/errorHandler';
import { Asset } from '../models';
import { savePublicFile, deleteImageFile } from '../utils/fileStorage';

class AssetImagesController {
  async uploadAssetImage(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt((req as any).params.id, 10);
      const file = (req as any).file as Express.Multer.File | undefined;

      if (!file) throw new ValidationError('Thiếu file upload');

      const asset = await Asset.findByPk(id);
      if (!asset) throw new NotFoundError('Tài sản không tồn tại');

      // Extension từ MIME đã validate (KHÔNG dùng originalname — chống spoof)
      const mimeToExt: Record<string, string> = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/gif': 'gif',
        'image/webp': 'webp',
      };
      const safeExt = mimeToExt[file.mimetype] || 'jpg';
      const filename = `asset_${id}_${Date.now()}.${safeExt}`;

      // Save file to storage
      const relativePath = savePublicFile(file.buffer, `assets/${id}`, filename);

      // Update asset with image URL
      await asset.update({ image_url: `/storage/${relativePath}` } as any);

      res.json({
        success: true,
        message: 'Ảnh tài sản đã được upload thành công',
        image_url: `/storage/${relativePath}`,
        relative_path: relativePath,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteAssetImage(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt((req as any).params.id, 10);

      const asset = await Asset.findByPk(id);
      if (!asset) throw new NotFoundError('Tài sản không tồn tại');

      // Check if asset has an image
      if (!asset.image_url) {
        throw new ValidationError('Tài sản không có ảnh để xóa');
      }

      // Extract relative path from image_url
      const relativePath = asset.image_url.replace(/^\/storage\//, '');

      // Delete file from storage
      deleteImageFile(relativePath);

      // Remove image URL from asset
      await asset.update({ image_url: null } as any);

      res.json({
        success: true,
        message: 'Ảnh tài sản đã được xóa thành công',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AssetImagesController();
