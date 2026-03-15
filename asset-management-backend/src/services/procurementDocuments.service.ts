import { Op } from 'sequelize';
import { Procurement, ProcurementDocument, Asset } from '../models';
import { NotFoundError, ConflictError } from '../utils/errorHandler';

const MAX_PDF_SIZE_BYTES = 20 * 1024 * 1024; // 20MB

class ProcurementDocumentsService {
  async listByProcurementId(procurementId: number): Promise<any[]> {
    const procurement = await Procurement.findByPk(procurementId);
    if (!procurement) throw new NotFoundError('Procurement not found');

    const docs = await ProcurementDocument.findAll({
      where: { procurement_id: procurementId },
      attributes: ['id', 'procurement_id', 'file_name', 'mime_type', 'size_bytes', 'created_by', 'created_at'],
      order: [['id', 'DESC']],
    });

    return docs;
  }

  async getContent(procurementId: number, docId: number): Promise<ProcurementDocument> {
    const doc = await ProcurementDocument.findOne({
      where: { id: docId, procurement_id: procurementId },
    });
    if (!doc) throw new NotFoundError('Document not found');
    return doc;
  }

  async upload(procurementId: number, file: Express.Multer.File, userId: number): Promise<any> {
    const procurement = await Procurement.findByPk(procurementId);
    if (!procurement) throw new NotFoundError('Procurement not found');

    if (!file) throw new ConflictError('File is required');

    const mime = file.mimetype || '';
    const name = file.originalname || 'document.pdf';
    const size = file.size || 0;

    if (mime !== 'application/pdf') throw new ConflictError('Chỉ cho phép upload file PDF');
    if (size <= 0) throw new ConflictError('File không hợp lệ');
    if (size > MAX_PDF_SIZE_BYTES) throw new ConflictError('File quá lớn (tối đa 20MB)');

    const created = await ProcurementDocument.create({
      procurement_id: procurementId,
      file_name: name,
      mime_type: mime,
      size_bytes: size,
      content: file.buffer,
      created_by: userId,
    } as any);

    return {
      id: created.id,
      procurement_id: created.procurement_id,
      file_name: created.file_name,
      mime_type: created.mime_type,
      size_bytes: created.size_bytes,
      created_by: created.created_by,
      created_at: (created as any).created_at,
    };
  }

  async delete(procurementId: number, docId: number): Promise<void> {
    const doc = await ProcurementDocument.findOne({
      where: { id: docId, procurement_id: procurementId },
    });
    if (!doc) throw new NotFoundError('Document not found');
    await doc.destroy();
  }

  async findProcurementIdByAssetId(assetId: number): Promise<number> {
    const asset = await Asset.findByPk(assetId);
    if (!asset) throw new NotFoundError('Asset not found');

    const procurement = await Procurement.findOne({
      where: {
        created_asset_ids: {
          [Op.contains]: [assetId],
        },
      } as any,
      attributes: ['id'],
      order: [['id', 'DESC']],
    });

    if (!procurement) throw new NotFoundError('Không tìm thấy phiếu mua sắm liên quan tài sản này');
    return (procurement as any).id;
  }
}

export default new ProcurementDocumentsService();
