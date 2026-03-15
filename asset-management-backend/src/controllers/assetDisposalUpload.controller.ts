import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { NotFoundError, ValidationError } from '../utils/errorHandler';
import { AssetDisposalCase } from '../models';
import { savePublicFile } from '../utils/fileStorage';

class AssetDisposalUploadController {
  async uploadDecisionFile(req: AuthRequest, res: Response) {
    const id = parseInt((req as any).params.id, 10);
    const file = (req as any).file as Express.Multer.File | undefined;
    if (!file) throw new ValidationError('Thiếu file upload');

    const disposalCase = await AssetDisposalCase.findByPk(id);
    if (!disposalCase) throw new NotFoundError('Disposal case not found');

    const extFromOriginal = (file.originalname || '').split('.').pop() || 'bin';
    const safeExt = extFromOriginal.toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin';
    const filename = `decision_${Date.now()}.${safeExt}`;

    const relativePath = savePublicFile(file.buffer, `asset-disposals/${id}`, filename);

    await disposalCase.update({ decision_file_url: `/storage/${relativePath}` } as any);

    res.json({
      success: true,
      decision_file_url: `/storage/${relativePath}`,
      relative_path: relativePath,
    });
  }
}

export default new AssetDisposalUploadController();
