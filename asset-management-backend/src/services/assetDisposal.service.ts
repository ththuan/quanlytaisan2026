import { Op } from 'sequelize';
import sequelize from '../config/database';
import {
  Asset,
  AssetDisposalCase,
  AssetDisposalItem,
  AuditLog,
  Department,
  InventoryReport,
  InventoryReportDetail,
  MaintenanceRequest,
  User,
} from '../models';
import { ConflictError, NotFoundError } from '../utils/errorHandler';
import { getPaginationParams, buildPaginationResult, getOffset, PaginationResult } from '../utils/pagination';

const normalizeCode = (code: string): string => code.trim().replace(/\s+/g, '-');

class AssetDisposalService {
  private async generateCaseCode(id: number, year: number): Promise<string> {
    return `GTS-${year}-${String(id).padStart(6, '0')}`;
  }

  async ensureDisposalCaseFromInventoryReport(
    reportId: number,
    approvedBy: number,
    transaction?: any
  ): Promise<AssetDisposalCase> {
    const report = await InventoryReport.findByPk(reportId, { transaction });
    if (!report) throw new NotFoundError('Inventory report not found');

    const existing = await AssetDisposalCase.findOne({
      where: { source_type: 'inventory', source_inventory_report_id: reportId },
      transaction,
    });
    if (existing) return existing;

    const created = await AssetDisposalCase.create(
      {
        code: 'TEMP',
        source_type: 'inventory',
        source_inventory_report_id: reportId,
        origin_department_id: (report as any).department_id,
        status: 'pending',
        created_by: approvedBy,
        approved_by: approvedBy,
        approved_at: new Date(),
      } as any,
      { transaction }
    );

    const year = new Date().getFullYear();
    const code = await this.generateCaseCode(created.id, year);
    await created.update({ code: normalizeCode(code) }, { transaction });

    return created;
  }

  async addItemFromInventoryDetail(
    disposalCaseId: number,
    detail: InventoryReportDetail,
    movedBy: number,
    movedFromDepartmentId?: number | null,
    transaction?: any
  ): Promise<void> {
    const assetId = (detail as any).asset_id;
    if (!assetId) return;

    const exists = await AssetDisposalItem.findOne({
      where: {
        disposal_case_id: disposalCaseId,
        asset_id: assetId,
      },
      transaction,
    });
    if (exists) return;

    await AssetDisposalItem.create(
      {
        disposal_case_id: disposalCaseId,
        asset_id: assetId,
        inventory_report_detail_id: (detail as any).id,
        moved_from_department_id: movedFromDepartmentId ?? undefined,
        moved_at: new Date(),
        moved_by: movedBy,
        reason: (detail as any).disposal_reason,
      } as any,
      { transaction }
    );
  }

  async listCases(query: any): Promise<PaginationResult<any>> {
    const { page, limit, sortBy, sortOrder } = getPaginationParams(query);
    const offset = getOffset(page, limit);

    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.origin_department_id) where.origin_department_id = Number(query.origin_department_id);
    if (query.search) {
      where[Op.or] = [{ code: { [Op.iLike]: `%${query.search}%` } }];
    }

    const { count, rows } = await AssetDisposalCase.findAndCountAll({
      where,
      limit,
      offset,
      order: [[sortBy, sortOrder]],
      include: [
        { model: Department, as: 'origin_department', attributes: ['id', 'name'], required: false },
        { model: User, as: 'creator', attributes: ['id', 'username', 'fullname'], required: false },
        { model: User, as: 'approver', attributes: ['id', 'username', 'fullname'], required: false },
      ],
    });

    return buildPaginationResult(rows, count, page, limit);
  }

  async getCaseById(id: number): Promise<any> {
    const c = await AssetDisposalCase.findByPk(id, {
      include: [
        { model: Department, as: 'origin_department', attributes: ['id', 'name'], required: false },
        { model: User, as: 'creator', attributes: ['id', 'username', 'fullname'], required: false },
        { model: User, as: 'approver', attributes: ['id', 'username', 'fullname'], required: false },
        {
          model: AssetDisposalItem,
          as: 'items',
          required: false,
          include: [
            { model: Asset, as: 'asset', required: false },
            {
              model: InventoryReportDetail,
              as: 'inventory_detail',
              required: false,
            },
            { model: Department, as: 'moved_from_department', required: false, attributes: ['id', 'name'] },
          ],
        },
        {
          model: InventoryReport,
          as: 'source_inventory_report',
          required: false,
        },
      ],
    });
    if (!c) throw new NotFoundError('Disposal case not found');
    return c;
  }

  async completeCase(
    id: number,
    userId: number,
    payload: { decision_no: string; decision_date?: string; decision_file_url?: string; notes?: string; revenue?: number }
  ): Promise<any> {
    const c = await AssetDisposalCase.findByPk(id, { include: [{ model: AssetDisposalItem, as: 'items' }] });
    if (!c) throw new NotFoundError('Disposal case not found');
    if ((c as any).status !== 'pending') throw new ConflictError('Chỉ được hoàn tất hồ sơ đang chờ');

    const transaction = await sequelize.transaction();
    try {
      await c.update(
        {
          status: 'completed',
          decision_no: payload.decision_no,
          decision_date: payload.decision_date ? new Date(payload.decision_date) : null,
          decision_file_url: payload.decision_file_url,
          notes: payload.notes,
          revenue: payload.revenue ?? 0,
        } as any,
        { transaction }
      );

      const items = ((c as any).items || []) as AssetDisposalItem[];
      const assetIds = items.map((it: any) => it.asset_id).filter(Boolean);

      if (assetIds.length) {
        const assets = await Asset.findAll({ where: { id: assetIds }, transaction });
        for (const a of assets) {
          const oldValue = { status: (a as any).status, current_department_id: (a as any).current_department_id };
          await a.update({ status: 'disposed' } as any, { transaction });
          await AuditLog.create(
            {
              user_id: userId,
              action: 'update',
              table_name: 'assets',
              record_id: (a as any).id,
              old_value: oldValue,
              new_value: { status: 'disposed', disposal_case_id: id },
            } as any,
            { transaction }
          );
        }
      }

      await transaction.commit();
      return this.getCaseById(id);
    } catch (e) {
      await transaction.rollback();
      throw e;
    }
  }

  /**
   * Tạo hồ sơ xử lý tài sản thủ công (tiêu hủy hoặc thanh lý đơn lẻ).
   * Theo Điều 23 (Thanh lý) và Điều 24 (Tiêu hủy) Quy chế.
   */
  async createManualCase(
    userId: number,
    payload: {
      disposal_type: 'liquidation' | 'destruction';
      origin_department_id?: number;
      destruction_method?: string;
      disposal_method?: string;
      notes?: string;
      asset_ids: number[];
    }
  ): Promise<any> {
    const transaction = await sequelize.transaction();
    try {
      const year = new Date().getFullYear();
      const prefix = payload.disposal_type === 'destruction' ? 'TH' : 'TL';

      const created = await AssetDisposalCase.create(
        {
          code: 'TEMP',
          source_type: 'manual',
          disposal_type: payload.disposal_type,
          destruction_method: payload.destruction_method ?? null,
          disposal_method: payload.disposal_method ?? null,
          origin_department_id: payload.origin_department_id ?? null,
          status: 'pending',
          notes: payload.notes ?? null,
          created_by: userId,
        } as any,
        { transaction }
      );

      const code = `${prefix}-${year}-${String(created.id).padStart(6, '0')}`;
      await created.update({ code }, { transaction });

      // Thêm các tài sản vào hồ sơ
      for (const assetId of payload.asset_ids) {
        const asset = await Asset.findByPk(assetId, { transaction });
        if (!asset) continue;
        await AssetDisposalItem.create(
          {
            disposal_case_id: created.id,
            asset_id: assetId,
            moved_from_department_id: (asset as any).current_department_id ?? null,
            moved_at: new Date(),
            moved_by: userId,
            reason: payload.notes ?? null,
          } as any,
          { transaction }
        );
        await AuditLog.create(
          {
            user_id: userId,
            action: 'update',
            table_name: 'assets',
            record_id: assetId,
            old_value: { status: (asset as any).status },
            new_value: { status: 'pending_disposal' },
          } as any,
          { transaction }
        );
        await asset.update({ status: 'pending_disposal' }, { transaction });
      }

      await transaction.commit();
      return this.getCaseById(created.id);
    } catch (e) {
      await transaction.rollback();
      throw e;
    }
  }

  /**
   * Tạo hồ sơ thanh lý/tiêu hủy từ đề nghị sửa chữa khi chi phí sửa chữa vượt quá giá trị tài sản.
   */
  async createFromMaintenance(
    maintenanceId: number,
    userId: number,
    disposalType: 'liquidation' | 'destruction' = 'liquidation'
  ): Promise<any> {
    const maintenance = await MaintenanceRequest.findByPk(maintenanceId, {
      include: [{ model: Asset, as: 'asset', required: false }],
    });
    if (!maintenance) throw new NotFoundError('Đề nghị sửa chữa không tồn tại');
    if (maintenance.request_type !== 'repair') {
      throw new ConflictError('Chỉ áp dụng cho đề nghị sửa chữa');
    }

    // Nếu đã có hồ sơ liên kết, trả về hồ sơ đó
    if ((maintenance as any).linked_disposal_case_id) {
      return this.getCaseById((maintenance as any).linked_disposal_case_id);
    }

    const assetId = maintenance.asset_id;
    const asset = assetId ? await Asset.findByPk(assetId) : null;
    const departmentId = (maintenance as any).department_id ?? (asset ? (asset as any).department_id : null);

    const transaction = await sequelize.transaction();
    try {
      const year = new Date().getFullYear();
      const prefix = disposalType === 'destruction' ? 'TH' : 'TL';

      const disposalCase = await AssetDisposalCase.create(
        {
          code: 'TEMP',
          source_type: 'maintenance',
          source_maintenance_request_id: maintenanceId,
          disposal_type: disposalType,
          origin_department_id: departmentId ?? null,
          status: 'pending',
          notes: `Chuyển từ đề nghị sửa chữa #${maintenanceId} – chi phí vượt quá giá trị tài sản`,
          created_by: userId,
        } as any,
        { transaction }
      );

      const code = `${prefix}-${year}-${String(disposalCase.id).padStart(6, '0')}`;
      await disposalCase.update({ code }, { transaction });

      // Thêm tài sản vào hồ sơ nếu có
      if (asset) {
        await AssetDisposalItem.create(
          {
            disposal_case_id: disposalCase.id,
            asset_id: assetId,
            moved_at: new Date(),
            moved_by: userId,
            reason: `Chi phí sửa chữa vượt quá giá trị tài sản (từ đề nghị #${maintenanceId})`,
          } as any,
          { transaction }
        );
        await AuditLog.create(
          {
            user_id: userId,
            action: 'update',
            table_name: 'assets',
            record_id: assetId,
            old_value: { status: (asset as any).status },
            new_value: { status: 'pending_disposal' },
          } as any,
          { transaction }
        );
        await asset.update({ status: 'pending_disposal' }, { transaction });
      }

      // Cập nhật trạng thái đề nghị sửa chữa
      await maintenance.update(
        {
          status: 'rejected_due_to_high_cost',
          linked_disposal_case_id: disposalCase.id,
        } as any,
        { transaction }
      );

      await transaction.commit();
      return this.getCaseById(disposalCase.id);
    } catch (e) {
      await transaction.rollback();
      throw e;
    }
  }
}

export default new AssetDisposalService();
