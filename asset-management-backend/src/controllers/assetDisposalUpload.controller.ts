import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { NotFoundError, ValidationError } from '../utils/errorHandler';
import { AssetDisposalCase } from '../models';
import { savePublicFile } from '../utils/fileStorage';

const SAFE_EXTENSION_BY_MIME: Record<string, string> = {
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
  'image/avif': 'avif',
  'image/bmp': 'bmp',
  'image/tiff': 'tiff',
};

class AssetDisposalUploadController {
  async uploadDecisionFile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt((req as any).params.id, 10);
      const file = (req as any).file as Express.Multer.File | undefined;
      if (!file) throw new ValidationError('Thiếu file upload');

      const disposalCase = await AssetDisposalCase.findByPk(id);
      if (!disposalCase) throw new NotFoundError('Disposal case not found');

      const safeExt = SAFE_EXTENSION_BY_MIME[file.mimetype];
      if (!safeExt) throw new ValidationError('Loại file không được phép.');
      const filename = `decision_${Date.now()}.${safeExt}`;

      const relativePath = savePublicFile(file.buffer, `asset-disposals/${id}`, filename);

      await disposalCase.update({ decision_file_url: `/storage/${relativePath}` } as any);

      res.json({
        success: true,
        decision_file_url: `/storage/${relativePath}`,
        relative_path: relativePath,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AssetDisposalUploadController();
