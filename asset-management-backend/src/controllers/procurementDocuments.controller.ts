import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import procurementDocumentsService from '../services/procurementDocuments.service';

class ProcurementDocumentsController {
  async listByProcurement(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const procurementId = parseInt(req.params.id, 10);
      const docs = await procurementDocumentsService.listByProcurementId(procurementId);
      return res.json({ success: true, data: docs });
    } catch (e) {
      next(e);
    }
  }

  async uploadToProcurement(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const procurementId = parseInt(req.params.id, 10);
      const userId = req.user!.id;
      const file = (req as any).file as Express.Multer.File;
      const created = await procurementDocumentsService.upload(procurementId, file, userId);
      return res.status(201).json({ success: true, message: 'Upload chứng từ thành công', data: created });
    } catch (e) {
      next(e);
    }
  }

  async download(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const procurementId = parseInt(req.params.id, 10);
      const docId = parseInt(req.params.docId, 10);
      const doc = await procurementDocumentsService.getContent(procurementId, docId);

      res.setHeader('Content-Type', doc.mime_type || 'application/pdf');
      res.setHeader('Content-Length', String(doc.size_bytes || (doc.content ? doc.content.length : 0)));
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(doc.file_name || 'document.pdf')}"`);

      return res.send(doc.content);
    } catch (e) {
      next(e);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const procurementId = parseInt(req.params.id, 10);
      const docId = parseInt(req.params.docId, 10);
      await procurementDocumentsService.delete(procurementId, docId);
      return res.json({ success: true, message: 'Đã xóa chứng từ' });
    } catch (e) {
      next(e);
    }
  }

  async listByAsset(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const assetId = parseInt(req.params.assetId, 10);
      const procurementId = await procurementDocumentsService.findProcurementIdByAssetId(assetId);
      const docs = await procurementDocumentsService.listByProcurementId(procurementId);
      return res.json({ success: true, data: { procurement_id: procurementId, documents: docs } });
    } catch (e) {
      next(e);
    }
  }

  async downloadByAsset(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const assetId = parseInt(req.params.assetId, 10);
      const docId = parseInt(req.params.docId, 10);
      const procurementId = await procurementDocumentsService.findProcurementIdByAssetId(assetId);
      const doc = await procurementDocumentsService.getContent(procurementId, docId);

      res.setHeader('Content-Type', doc.mime_type || 'application/pdf');
      res.setHeader('Content-Length', String(doc.size_bytes || (doc.content ? doc.content.length : 0)));
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(doc.file_name || 'document.pdf')}"`);

      return res.send(doc.content);
    } catch (e) {
      next(e);
    }
  }
}

export default new ProcurementDocumentsController();
